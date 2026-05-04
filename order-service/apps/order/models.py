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
    E_WALLET = 'E_WALLET', 'Ví điện tử'
    CREDIT_CARD = 'CREDIT_CARD', 'Thẻ tín dụng'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Chờ thanh toán'
    PAID = 'PAID', 'Đã thanh toán'
    FAILED = 'FAILED', 'Thanh toán thất bại'

class ShippingMethod(models.TextChoices):
    STANDARD = 'STANDARD', 'Giao hàng tiêu chuẩn'
    EXPRESS = 'EXPRESS', 'Giao hàng hỏa tốc'

class ShippingStatus(models.TextChoices):
    PREPARING = 'PREPARING', 'Đang chuẩn bị hàng'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Sẵn sàng lấy hàng'
    PICKED_UP = 'PICKED_UP', 'Đã lấy hàng'
    IN_TRANSIT = 'IN_TRANSIT', 'Đang vận chuyển'
    DELIVERED = 'DELIVERED', 'Đã giao thành công'
    FAILED = 'FAILED', 'Giao hàng thất bại'

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True, verbose_name="ID khách hàng")
    
    # Tài chính tổng quát
    total_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Tổng tiền đơn hàng")
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name="Phí vận chuyển")
    
    # Trạng thái tổng quát của đơn hàng
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True
    )

    payment_method = models.CharField(
        max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.COD
    )

    shipping_method = models.CharField(
        max_length=30, choices=ShippingMethod.choices, default=ShippingMethod.STANDARD
    )

    tracking_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã vận đơn hiển thị nhanh")
    
    # Địa chỉ giao hàng (Snapshot từ Shipping Service)
    shipping_address = models.JSONField(verbose_name="Địa chỉ giao hàng snapshot")
    
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú của khách hàng")
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        verbose_name = "Đơn hàng"
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.status}"

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    
    product_id = models.UUIDField(db_index=True, verbose_name="ID sản phẩm")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số lượng")
    
    # Snapshot giá để bảo toàn dữ liệu lịch sử
    sales_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá tại thời điểm mua")

    class Meta:
        db_table = 'order_items'

    @property
    def subtotal(self):
        return self.sales_price * self.quantity