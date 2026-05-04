import json

import pika
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payment.models import Payment, PaymentStatus
from apps.payment.services import create_payment_transaction
from .serializers import PaymentCreateResponseSerializer, PaymentCreateSerializer, PaymentMethodSerializer


def publish_payment_success_event(payment):
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
        channel = connection.channel()
        channel.exchange_declare(exchange="payment_events", exchange_type="fanout", durable=True)
        event = {
            "event": "PaymentSuccessEvent",
            "order_id": str(payment.order_id),
            "payment_id": str(payment.id),
        }
        channel.basic_publish(
            exchange="payment_events",
            routing_key="",
            body=json.dumps(event),
            properties=pika.BasicProperties(content_type="application/json"),
        )
        connection.close()
    except Exception:
        pass


class PaymentGatewayWebhookAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else json.loads(request.body)
        reference_number = payload.get("reference_number")
        external_transaction_id = payload.get("transaction_id")
        status = payload.get("status")
        try:
            payment = Payment.objects.get(reference_number=reference_number)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if status == "SUCCESS":
            payment.status = PaymentStatus.COMPLETED
            payment.external_transaction_id = external_transaction_id
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "external_transaction_id", "paid_at", "updated_at"])
            publish_payment_success_event(payment)
            return Response({"message": "Payment status updated to COMPLETED"}, status=200)

        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status", "updated_at"])
        return Response({"message": "Payment status updated to FAILED"}, status=200)


class PaymentCreateAPIView(APIView):
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_data = create_payment_transaction(serializer.validated_data)
        resp_serializer = PaymentCreateResponseSerializer(payment_data)
        return Response(resp_serializer.data, status=201)


class PaymentMethodListAPIView(APIView):
    def get(self, request):
        methods = [
            {"code": "cod", "name": "Thanh toan khi nhan hang (COD)"},
            {"code": "vnpay", "name": "VNPay"},
            {"code": "momo", "name": "Momo"},
            {"code": "bank", "name": "Chuyen khoan ngan hang"},
        ]
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)
