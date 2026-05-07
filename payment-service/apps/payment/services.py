import uuid
from datetime import datetime, timedelta
from django.utils import timezone

from apps.payment.models import Payment, PaymentStatus

def create_payment_transaction(data):
    # Save payment record to DB
    reference_number = f"REF{int(datetime.utcnow().timestamp())}"
    expire_at = timezone.now() + timedelta(hours=2)
    payment_url = None
    status = PaymentStatus.PENDING
    message = "Payment initialized successfully"
    provider = data.get("provider")
    if data["payment_method"] == "COD":
        status = PaymentStatus.AWAITING_PAYMENT
        payment_url = None
        provider = None
        message = "COD order, awaiting payment at delivery."
        expire_at = None
    else:
        # Simulate call to provider API (e.g., Momo, VNPay)
        payment_url = f"https://payment.{provider.lower()}.vn/pay/gateway?token={uuid.uuid4().hex[:12]}"
    payment = Payment.objects.create(
        order_id=data["order_id"],
        user_id=data["user_id"],
        amount=data["amount"],
        currency=data.get("currency", "VND"),
        method=data["payment_method"],
        status=status,
        reference_number=reference_number,
    )
    # Return all fields for response
    return {
        "payment_id": str(payment.id),
        "order_id": data["order_id"],
        "status": status,
        "payment_method": data["payment_method"],
        "provider": provider,
        "amount": data["amount"],
        "payment_url": payment_url,
        "reference_number": reference_number,
        "expire_at": expire_at,
        "message": message,
    }
