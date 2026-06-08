import uuid
from django.db import models

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Chờ xác nhận'
    PROCESSING = 'PROCESSING', 'Đang xử lý'
    SHIPPED = 'SHIPPED', 'Đang giao hàng'
    COMPLETED = 'COMPLETED', 'Hoàn thành'
    CANCELLED = 'CANCELLED', 'Đã hủy'

class PaymentMethod(models.TextChoices):
    COD = 'COD', 'Thanh toán khi nhận hàng'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Chuyển khoản ngân hàng'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Chờ thanh toán'
    AWAITING_PAYMENT = 'AWAITING_PAYMENT', 'Đang chờ thanh toán COD'
    PAID = 'PAID', 'Đã thanh toán'
    FAILED = 'FAILED', 'Thanh toán thất bại'

class ShippingMethod(models.TextChoices):
    STANDARD = 'STANDARD', 'Giao hàng tiêu chuẩn'
    EXPRESS = 'EXPRESS', 'Giao hàng hỏa tốc'

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True, verbose_name="ID khách hàng")
    
    # Tài chính tổng quát
    total_price = models.DecimalField(db_index=True, max_digits=15, decimal_places=2, verbose_name="Tổng tiền đơn hàng")
    shipping_fee = models.DecimalField(db_index=True, max_digits=12, decimal_places=2, default=0.0, verbose_name="Phí vận chuyển")

    carrier = models.CharField(max_length=255, blank=True, null=True, db_index=True, verbose_name="Đơn vị vận chuyển")
    
    # Trạng thái tổng quát của đơn hàng
    status = models.CharField(
        db_index=True, max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )

    shipping_method = models.CharField(
        db_index=True, max_length=30, choices=ShippingMethod.choices, default=ShippingMethod.STANDARD
    )

    tracking_number = models.CharField(db_index=True, max_length=100, blank=True, null=True, verbose_name="Mã vận đơn hiển thị nhanh")
    
    # Địa chỉ giao hàng (Snapshot từ Shipping Service)
    shipping_address = models.JSONField(verbose_name="Địa chỉ giao hàng snapshot")
    
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú của khách hàng")
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    confirmed_by = models.UUIDField(null=True, blank=True, verbose_name="ID nhân viên xác nhận")
    confirmed_at = models.DateTimeField(null=True, blank=True)

    is_paid = models.BooleanField(db_index=True, default=False)
    class Meta:
        db_table = 'orders'
        verbose_name = "Đơn hàng"
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.status}"

    @property
    def payment_method(self):
        # If payments are prefetched (payments_cache), reuse the prefetched list to avoid extra queries
        payments_prefetched = getattr(self, 'payments_cache', None)
        if payments_prefetched is not None:
            first_payment = payments_prefetched[0] if payments_prefetched else None
        else:
            first_payment = self.payments.order_by("created_at").first()
        return first_payment.payment_method if first_payment else None

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, db_index=True, on_delete=models.CASCADE, related_name='items')
    
    product_id = models.UUIDField(db_index=True, verbose_name="ID sản phẩm")
    name_product = models.CharField(max_length=255, null=True, blank=True, db_index=True, verbose_name="Snapshot tên sản phẩm")
    category_id = models.UUIDField(db_index=True, null=True, blank=True, verbose_name="Snapshot ID danh mục")
    category_slug = models.CharField(max_length=255, null=True, blank=True, db_index=True, verbose_name="Snapshot slug danh mục")
    quantity = models.PositiveIntegerField(db_index=True, default=1, verbose_name="Số lượng")
    
    # Snapshot giá để bảo toàn dữ liệu lịch sử
    sales_price = models.DecimalField(db_index=True, max_digits=12, decimal_places=2, verbose_name="Giá tại thời điểm mua")

    class Meta:
        db_table = 'order_items'

    @property
    def subtotal(self):
        return self.sales_price * self.quantity

class OrderPayment(models.Model):
    """Lưu chi tiết các giao dịch thanh toán"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, db_index=True, on_delete=models.CASCADE, related_name='payments')
    
    payment_method = models.CharField(db_index=True, max_length=30, choices=PaymentMethod.choices)
    status = models.CharField(
        db_index=True,
        max_length=20, 
        choices=PaymentStatus.choices, 
        default=PaymentStatus.PENDING
    )
    
    transaction_id = models.CharField(db_index=True, max_length=255, null=True, blank=True)
    
    gateway_response = models.JSONField(null=True, blank=True)
    
    amount = models.DecimalField(db_index=True, max_digits=15, decimal_places=2)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_payments'

class OrderTimeline(models.Model):
    """Lưu lịch sử thay đổi trạng thái (Nhân viên check đơn sẽ ghi vào đây)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, db_index=True, on_delete=models.CASCADE, related_name='timeline')
    
    previous_status = models.CharField(db_index=True, max_length=20)
    current_status = models.CharField(db_index=True, max_length=20)
    
    changed_by = models.UUIDField(verbose_name="ID người thực hiện (User/Staff)")
    note = models.TextField(blank=True, null=True, verbose_name="Lý do thay đổi/Ghi chú của nhân viên")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_timeline'