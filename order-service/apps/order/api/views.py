from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.order.models import Order
from apps.order.services import call_shipping_service_create_shipment, create_order_with_integrations
from .serializers import OrderCreateSerializer


def _ensure_staff(user) -> bool:
    return getattr(user, "role", None) in {"staff", "admin"}

class OrderConfirmPackingAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        if not _ensure_staff(request.user):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, id=order_id)
        data = request.data
        required_fields = ['weight', 'length', 'width', 'height']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing {field}'}, status=status.HTTP_400_BAD_REQUEST)
        shipment_data = call_shipping_service_create_shipment(
            order_id=str(order.id),
            user_id=str(order.user_id),
            address=order.shipping_address,
            weight=data['weight'],
            length=data['length'],
            width=data['width'],
            height=data['height'],
        )
        return Response({'message': 'Packing confirmed, shipping order requested', 'shipment': shipment_data}, status=200)


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
        # TODO: Fetch address snapshot from User Service if needed
        address_snapshot = {"address_id": str(data['address_id'])}  # Replace with real address fetch
        order, payment_url = create_order_with_integrations(
            user_id=user_id,
            address_snapshot=address_snapshot,
            payment_method=data['payment_method'],
            shipping_method=data['shipping_method'],
            items=data['items']
        )
        if data['payment_method'] == 'COD':
            message = 'Order placed successfully. Please pay on delivery.'
        else:
            message = 'Order created. Redirect to payment.'
        resp = {'order_id': order.id, 'message': message}
        if payment_url:
            resp['payment_url'] = payment_url
        return Response(resp, status=status.HTTP_201_CREATED)
