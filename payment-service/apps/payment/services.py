import uuid
from datetime import datetime, timedelta

def create_payment_transaction(data):
    # Save payment record to DB (pseudo, replace with real ORM logic)
    payment_id = f"p_{uuid.uuid4().hex[:9]}"
    reference_number = f"REF{int(datetime.utcnow().timestamp())}"
    expire_at = datetime.utcnow() + timedelta(hours=2)
    payment_url = None
    status = "PENDING"
    message = "Payment initialized successfully"
    provider = data.get("provider")
    if data["payment_method"] == "COD":
        status = "AWAITING_PAYMENT"
        payment_url = None
        provider = None
        message = "COD order, awaiting payment at delivery."
        expire_at = None
    else:
        # Simulate call to provider API (e.g., Momo, VNPay)
        payment_url = f"https://payment.{provider.lower()}.vn/pay/gateway?token={uuid.uuid4().hex[:12]}"
    # Return all fields for response
    return {
        "payment_id": payment_id,
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
