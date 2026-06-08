from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Prefetch
from apps.order.models import Order, OrderTimeline, OrderPayment, OrderItem, PaymentMethod
from apps.order.services import (
    call_shipping_service_create_shipment,
    call_product_service_release_reservations,
    create_order_with_integrations,
    handle_payment_failed_event,
    handle_payment_success_event,
)
from .serializers import (
    CreateShipmentSerializer,
    HandoverToCarrierSerializer,
    OrderConfirmSerializer,
    OrderCreateSerializer,
    OrderRejectSerializer,
    OrderDetailSerializer,
)



def _ensure_staff(user) -> bool:
    return getattr(user, "role", None) in {"staff", "admin"}


def _append_timeline(order, previous_status, current_status, changed_by, note=""):
    if not changed_by:
        return
    OrderTimeline.objects.create(
        order=order,
        previous_status=previous_status,
        current_status=current_status,
        changed_by=changed_by,
        note=note or "",
    )


def _extract_customer_name_from_shipping(shipping_address):
    if not isinstance(shipping_address, dict):
        return ""
    for key in ("recipient_name", "customer_name", "full_name", "name"):
        value = str(shipping_address.get(key) or "").strip()
        if value:
            return value
    return ""


def _build_customer_display_name(user) -> str:
    if not user:
        return ""
    full_name = " ".join(
        part.strip()
        for part in [getattr(user, "first_name", "") or "", getattr(user, "last_name", "") or ""]
        if part and part.strip()
    ).strip()
    return full_name or str(getattr(user, "name", "") or getattr(user, "username", "") or "").strip()


class OrderConfirmAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related("items", "payments", "timeline"),
            id=order_id,
        )
        if order.status != "PENDING":
            return Response(
                {"error": f"Order must be PENDING to confirm. Current status: {order.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = order.status
        order.status = "PROCESSING"
        order.confirmed_by = request.user.id
        order.confirmed_at = timezone.now()
        order.save(update_fields=["status", "confirmed_by", "confirmed_at", "updated_at"])

        _append_timeline(
            order=order,
            previous_status=previous_status,
            current_status=order.status,
            changed_by=request.user.id,
            note=serializer.validated_data.get("note") or "Staff confirmed order",
        )

        return Response(
            {
                "message": "Order confirmed successfully",
                "order_id": str(order.id),
                "status": order.status,
                "confirmed_at": order.confirmed_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class OrderRejectAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related("items", "payments", "timeline"),
            id=order_id,
        )
        if order.status != "PENDING":
            return Response(
                {"error": f"Order must be PENDING to reject. Current status: {order.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = order.status
        order.status = "CANCELLED"
        order.save(update_fields=["status", "updated_at"])

        call_product_service_release_reservations(str(order.id), "Rejected by staff")

        _append_timeline(
            order=order,
            previous_status=previous_status,
            current_status=order.status,
            changed_by=request.user.id,
            note=serializer.validated_data.get("note") or "Staff rejected order",
        )

        return Response(
            {
                "message": "Order rejected successfully",
                "order_id": str(order.id),
                "status": order.status,
            },
            status=status.HTTP_200_OK,
        )


class OrderCreateShipmentAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related("items", "payments", "timeline"),
            id=order_id,
        )
        if order.status not in {"PROCESSING", "PENDING"}:
            return Response(
                {"error": f"Order cannot create shipment in status {order.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        shipment_data = call_shipping_service_create_shipment(
            order_id=str(order.id),
            user_id=str(order.user_id),
            address=order.shipping_address,
            weight=data["weight"],
            length=data["length"],
            width=data["width"],
            height=data["height"],
        )

        tracking_number = shipment_data.get("tracking_number")
        if tracking_number and not order.tracking_number:
            order.tracking_number = tracking_number
            order.save(update_fields=["tracking_number", "updated_at"])

        _append_timeline(
            order=order,
            previous_status=order.status,
            current_status=order.status,
            changed_by=request.user.id,
            note=f"Shipment created with tracking {tracking_number or 'N/A'}",
        )

        return Response(
            {
                "message": "Shipment created successfully",
                "order_id": str(order.id),
                "status": order.status,
                "shipment": shipment_data,
            },
            status=status.HTTP_200_OK,
        )


class OrderConfirmPackingAPIView(OrderCreateShipmentAPIView):
    """Backward compatibility for existing confirm-packing endpoint."""


class OrderHandoverToCarrierAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = HandoverToCarrierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related("items", "payments", "timeline"),
            id=order_id,
        )
        if order.status != "PROCESSING":
            return Response(
                {"error": f"Order must be PROCESSING to hand over. Current status: {order.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not order.tracking_number:
            return Response(
                {"error": "Cannot hand over order without tracking_number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = order.status
        order.status = "SHIPPED"
        order.save(update_fields=["status", "updated_at"])

        carrier_name = serializer.validated_data["carrier_name"]
        handover_note = serializer.validated_data.get("note") or ""
        note = f"Handed over to carrier {carrier_name}."
        if handover_note:
            note = f"{note} {handover_note}"
        _append_timeline(
            order=order,
            previous_status=previous_status,
            current_status=order.status,
            changed_by=request.user.id,
            note=note,
        )

        return Response(
            {
                "message": "Order handed over to carrier successfully",
                "order_id": str(order.id),
                "status": order.status,
                "carrier_name": carrier_name,
            },
            status=status.HTTP_200_OK,
        )


class OrderCreateAPIView(APIView):
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated for testing

    def get(self, request):
        if not _ensure_staff(request.user):
            if not request.user or not request.user.id:
                qs = Order.objects.none()
            else:
                qs = (
                    Order.objects.filter(user_id=request.user.id)
                    .order_by("-created_at")
                    .prefetch_related("items", "payments", "timeline")
                )
        else:
            qs = (
                Order.objects.all().order_by("-created_at").prefetch_related("items", "payments", "timeline")
            )

        return Response(
            [
                {
                    "id": str(order.id),
                    "user_id": str(order.user_id),
                    "customer_name": _extract_customer_name_from_shipping(order.shipping_address),
                    "item_count": sum(int(item.quantity or 0) for item in order.items.all()),
                    "status": order.status,
                    "payment_method": order.payment_method,
                    "is_paid": bool(order.is_paid),
                    "shipping_method": order.shipping_method,
                    "carrier": order.carrier,
                    "total_price": str(order.total_price),
                    "shipping_fee": str(order.shipping_fee),
                    "tracking_number": order.tracking_number,
                    "created_at": order.created_at.isoformat(),
                }
                for order in qs
            ],
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Allow user_id to be provided in request body for testing (or from JWT if authenticated)
        user_id = request.data.get('customer_id') or (request.user.id if request.user and request.user.id else "test-customer-001")
        customer_display_name = _build_customer_display_name(request.user)
        address_snapshot = {}
        if data.get("address_id"):
            address_snapshot["address_id"] = str(data["address_id"])
        if data.get("address_text"):
            address_snapshot["address_text"] = data["address_text"]
        if data.get("recipient_name"):
            address_snapshot["recipient_name"] = data["recipient_name"].strip()
        elif customer_display_name:
            address_snapshot["recipient_name"] = customer_display_name
        if customer_display_name:
            address_snapshot["customer_name"] = customer_display_name
            address_snapshot["full_name"] = customer_display_name
            address_snapshot["name"] = customer_display_name
        if data.get("recipient_phone"):
            address_snapshot["recipient_phone"] = data["recipient_phone"].strip()

        try:
            order, payment_data = create_order_with_integrations(
                user_id=user_id,
                address_snapshot=address_snapshot,
                payment_method=data["payment_method"],
                shipping_method=data["shipping_method"],
                items=data["items"],
                shipping_fee=data.get("shipping_fee") or 0,
                carrier_name=data.get("carrier_name") or "",
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if data["payment_method"] == "COD":
            message = "Order placed successfully. Please pay on delivery."
        else:
            message = "Order created. Redirect to payment."
        resp = {"order_id": str(order.id), "message": message}
        if payment_data:
            resp["payment"] = payment_data
            if isinstance(payment_data, dict) and payment_data.get("payment_url"):
                resp["payment_url"] = payment_data.get("payment_url")
        return Response(resp, status=status.HTTP_201_CREATED)


class PaymentCallbackAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        status_value = str(payload.get("status", "")).upper()
        event = {
            "order_id": payload.get("order_id"),
            "payment_id": payload.get("payment_id"),
            "reason": payload.get("reason", "Payment failed"),
        }
        if status_value in {"SUCCESS", "COMPLETED"}:
            handle_payment_success_event(event)
            return Response({"message": "Order updated by payment success"}, status=status.HTTP_200_OK)
        handle_payment_failed_event(event)
        return Response({"message": "Order updated by payment failure"}, status=status.HTTP_200_OK)


class BestSellerProductsAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        limit_raw = request.query_params.get("limit", 10)
        try:
            limit = max(1, min(int(limit_raw), 50))
        except (TypeError, ValueError):
            limit = 10

        # category_id is accepted for API compatibility with the Product Service gateway.
        # The Order Service currently stores product ids only, so best-seller ranking is global.
        _category_id = request.query_params.get("category_id")

        eligible_statuses = {"PENDING", "PROCESSING", "SHIPPED", "COMPLETED"}
        queryset = OrderItem.objects.filter(
            order__status__in=eligible_statuses,
            order__is_paid=True,
        )
        if _category_id:
            queryset = queryset.filter(category_id=_category_id)

        queryset = (
            queryset.values("product_id")
            .annotate(total_quantity=Sum("quantity"))
            .order_by("-total_quantity", "product_id")[:limit]
        )
        product_ids = [str(item["product_id"]) for item in queryset]

        return Response(
            {
                "product_ids": product_ids,
                "count": len(product_ids),
                "category_id": _category_id,
            },
            status=status.HTTP_200_OK,
        )


class OrderDetailAPIView(APIView):
    """Retrieve order detail with items and payments"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        
        order = get_object_or_404(
            Order.objects.prefetch_related("items", "payments"),
            id=order_id
        )
        
        # Authorization check: user can only view their own orders (unless staff)
        is_staff = _ensure_staff(request.user)
        if not is_staff and str(order.user_id) != str(request.user.id):
            return Response(
                {"error": "You don't have permission to view this order"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
