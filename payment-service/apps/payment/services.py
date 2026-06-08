import uuid
from datetime import datetime, timedelta
from urllib.parse import quote
from django.utils import timezone

from apps.payment.models import Payment, PaymentMethod, PaymentStatus


def build_payment_qr_url(payment_url: str) -> str | None:
    if not payment_url:
        return None
    return f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote(payment_url, safe='')}"

def create_payment_transaction(data):
    # Save payment record to DB
    reference_number = f"REF{int(datetime.utcnow().timestamp())}"
    expire_at = timezone.now() + timedelta(minutes=15)
    payment_url = None
    qr_image_url = None
    status = PaymentStatus.PENDING
    message = "Payment initialized successfully"
    provider = data.get("provider")
    return_url = data.get("return_url") or "http://localhost:3000/payment"
    payment_method_code = str(data["payment_method"] or "").strip().upper()
    payment_method = PaymentMethod.objects.filter(code__iexact=payment_method_code, is_active=True).first()
    if payment_method is None:
        raise ValueError("Payment method is invalid or inactive")

    if payment_method.code == "COD":
        status = PaymentStatus.AWAITING_PAYMENT
        payment_url = None
        provider = None
        message = "COD order, awaiting payment at delivery."
        expire_at = None
    else:
        # Simulate call to provider API (e.g., Momo, VNPay)
        payment_url = f"{return_url}?payment_id={{payment_id}}&reference_number={{reference_number}}&order_id={data['order_id']}"
    payment = Payment.objects.create(
        order_id=data["order_id"],
        user_id=data["user_id"],
        amount=data["amount"],
        currency=data.get("currency", "VND"),
        method=payment_method,
        status=status,
        reference_number=reference_number,
        expires_at=expire_at,
    )
    if payment_url and "{payment_id}" in payment_url:
        payment_url = payment_url.format(payment_id=str(payment.id), reference_number=reference_number)
    if payment_url:
        qr_image_url = build_payment_qr_url(payment_url)
    # Return all fields for response
    return {
        "payment_id": str(payment.id),
        "order_id": data["order_id"],
        "status": status,
        "payment_method": payment_method.code,
        "provider": provider,
        "amount": data["amount"],
        "payment_url": payment_url,
        "qr_image_url": qr_image_url,
        "reference_number": reference_number,
        "expire_at": expire_at,
        "message": message,
    }
