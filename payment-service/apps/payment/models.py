import uuid
from django.db import models

class PaymentMethod(models.TextChoices):
    COD = 'COD', 'Thanh toán khi nhận hàng'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Chuyển khoản ngân hàng'
    E_WALLET = 'E_WALLET', 'Ví điện tử'
    CREDIT_CARD = 'CREDIT_CARD', 'Thẻ tín dụng'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Đang chờ thanh toán'
    AWAITING_PAYMENT = 'AWAITING_PAYMENT', 'Đang chờ thanh toán COD'
    PROCESSING = 'PROCESSING', 'Đang xử lý'
    COMPLETED = 'COMPLETED', 'Thành công'
    FAILED = 'FAILED', 'Thất bại'
    REFUNDED = 'REFUNDED', 'Đã hoàn tiền'

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField(db_index=True)
    
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=10, default='VND')

    method = models.CharField(
        max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.COD
    )
    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )
    
    # Mã để làm việc với các cổng thanh toán (Momo, VNPay...)
    reference_number = models.CharField(max_length=100, unique=True, db_index=True)
    external_transaction_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'