from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.order.models import Order, OrderTimeline
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


class OrderConfirmAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(Order.objects.select_for_update(), id=order_id)
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

        order = get_object_or_404(Order.objects.select_for_update(), id=order_id)
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

        order = get_object_or_404(Order.objects.select_for_update(), id=order_id)
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

        order = get_object_or_404(Order.objects.select_for_update(), id=order_id)
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _ensure_staff(request.user):
            qs = Order.objects.filter(user_id=request.user.id).order_by("-created_at")
        else:
            qs = Order.objects.all().order_by("-created_at")

        return Response(
            [
                {
                    "id": str(order.id),
                    "status": order.status,
                    "payment_method": order.payment_method,
                    "shipping_method": order.shipping_method,
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
        user_id = request.user.id
        address_snapshot = {}
        if data.get("address_id"):
            address_snapshot["address_id"] = str(data["address_id"])
        if data.get("address_text"):
            address_snapshot["address_text"] = data["address_text"]

        order, payment_data = create_order_with_integrations(
            user_id=user_id,
            address_snapshot=address_snapshot,
            payment_method=data["payment_method"],
            shipping_method=data["shipping_method"],
            items=data["items"],
        )
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
