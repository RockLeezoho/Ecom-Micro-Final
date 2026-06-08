import json
import os
from urllib.parse import quote

import pika
import requests
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payment.models import PaymentMethod as PaymentMethodModel, PaymentStatus
from apps.payment.services import create_payment_transaction
from apps.payment.selectors import get_payment_by_reference, get_payment_by_id
from .serializers import (
    PaymentCreateResponseSerializer,
    PaymentCreateSerializer,
    PaymentMethodSerializer,
    PaymentQrSerializer,
    PaymentTransferConfirmSerializer,
)


def publish_payment_event(payment, event_name):
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
        channel = connection.channel()
        channel.exchange_declare(exchange="payment_events", exchange_type="fanout", durable=True)
        event = {
            "event": event_name,
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


def publish_payment_success_event(payment):
    publish_payment_event(payment, "PaymentSuccessEvent")


def publish_payment_failed_event(payment):
    publish_payment_event(payment, "PaymentFailedEvent")


def notify_order_service(payment, status_value, reason=""):
    order_service_url = os.getenv("ORDER_SERVICE_URL", "http://order-service:8005/api")
    payload = {
        "order_id": str(payment.order_id),
        "payment_id": str(payment.id),
        "status": status_value,
    }
    if reason:
        payload["reason"] = reason
    try:
        requests.post(f"{order_service_url}/payments/callback/", json=payload, timeout=5)
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
        payment = get_payment_by_reference(reference_number)
        if not payment:
            return Response({"error": "Payment not found"}, status=404)

        if status == "SUCCESS":
            payment.status = PaymentStatus.COMPLETED
            payment.external_transaction_id = external_transaction_id
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "external_transaction_id", "paid_at", "updated_at"])
            publish_payment_success_event(payment)
            notify_order_service(payment, "SUCCESS")
            return Response({"message": "Payment status updated to COMPLETED"}, status=200)

        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status", "updated_at"])
        publish_payment_failed_event(payment)
        notify_order_service(payment, "FAILED", "Payment failed from webhook")
        return Response({"message": "Payment status updated to FAILED"}, status=200)


class PaymentCreateAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_data = create_payment_transaction(serializer.validated_data)
        resp_serializer = PaymentCreateResponseSerializer(payment_data)
        return Response(resp_serializer.data, status=201)


class PaymentQrAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        serializer = PaymentQrSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment = None
        if data.get("payment_id"):
            payment = get_payment_by_id(data["payment_id"])
        elif data.get("reference_number"):
            payment = get_payment_by_reference(data["reference_number"])
        if not payment:
            return Response({"error": "Payment not found"}, status=404)

        payment_url = f"{os.getenv('PAYMENT_RETURN_URL', 'http://localhost:3000/payment')}?payment_id={payment.id}&reference_number={payment.reference_number}&order_id={payment.order_id}"
        qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote(payment_url, safe='')}"
        return Response(
            {
                "payment_id": str(payment.id),
                "reference_number": payment.reference_number,
                "payment_url": payment_url,
                "qr_image_url": qr_image_url,
                "expires_at": payment.expires_at,
            },
            status=200,
        )


class PaymentConfirmTransferAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PaymentTransferConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment = None
        if data.get("payment_id"):
            payment = get_payment_by_id(data["payment_id"])
        elif data.get("reference_number"):
            payment = get_payment_by_reference(data["reference_number"])
        if not payment:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status == PaymentStatus.COMPLETED:
            return Response(
                {
                    "message": "Payment already completed",
                    "payment_id": str(payment.id),
                    "order_id": str(payment.order_id),
                    "status": payment.status,
                },
                status=200,
            )

        if payment.expires_at and timezone.now() > payment.expires_at:
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=["status", "updated_at"])
            publish_payment_failed_event(payment)
            notify_order_service(payment, "FAILED", "QR payment expired")
            return Response({"error": "QR code has expired"}, status=400)

        if payment.method and payment.method.code != "BANK_TRANSFER":
            return Response({"error": "Only bank transfer can be confirmed here"}, status=400)

        payment.status = PaymentStatus.COMPLETED
        payment.external_transaction_id = data.get("transaction_id") or payment.external_transaction_id or f"TRF-{payment.id.hex[:8]}"
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "external_transaction_id", "paid_at", "updated_at"])
        publish_payment_success_event(payment)
        notify_order_service(payment, "SUCCESS")
        return Response(
            {
                "message": "Payment confirmed successfully",
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
                "status": payment.status,
            },
            status=200,
        )


class PaymentMethodListAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        methods = PaymentMethodModel.objects.filter(is_active=True).order_by('sort_order', 'name')
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)


class PaymentSimulateSuccessAPIView(APIView):
    def post(self, request):
        payment_id = request.data.get("payment_id")
        reference_number = request.data.get("reference_number")
        payment = None
        if payment_id:
            payment = get_payment_by_id(payment_id)
        elif reference_number:
            payment = get_payment_by_reference(reference_number)
        if not payment:
            return Response({"error": "Payment not found"}, status=404)

        payment.status = PaymentStatus.COMPLETED
        payment.external_transaction_id = payment.external_transaction_id or f"SIM-{payment.id.hex[:8]}"
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "external_transaction_id", "paid_at", "updated_at"])
        publish_payment_success_event(payment)
        notify_order_service(payment, "SUCCESS")
        return Response(
            {
                "message": "Payment simulated as successful",
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
                "status": payment.status,
            },
            status=200,
        )
