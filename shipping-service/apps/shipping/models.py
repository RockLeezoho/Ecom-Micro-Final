import uuid
from django.db import models

class ShipmentStatus(models.TextChoices):
    PREPARING = 'PREPARING', 'Đang chuẩn bị hàng'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Sẵn sàng lấy hàng'
    PICKED_UP = 'PICKED_UP', 'Đã lấy hàng'
    IN_TRANSIT = 'IN_TRANSIT', 'Đang vận chuyển'
    DELIVERED = 'DELIVERED', 'Đã giao hàng thành công'
    RETURNED = 'RETURNED', 'Đã trả hàng'
    FAILED = 'FAILED', 'Giao hàng thất bại'

class ShippingMethod(models.TextChoices):
    STANDARD = 'STANDARD', 'Giao hàng tiêu chuẩn'
    EXPRESS = 'EXPRESS', 'Giao hàng hỏa tốc'
    @property
    def price(self):
        prices = {
            'STANDARD': 15000,
            'EXPRESS': 30000,
        }
        return prices.get(self.value, 0)

class Carrier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Tên đơn vị vận chuyển")
    code = models.CharField(max_length=50, unique=True, verbose_name="Mã định danh (GHTK, GHN...)")
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name="Đang hoạt động")

    class Meta:
        db_table = 'carriers'
        verbose_name = "Đơn vị vận chuyển"

    def __str__(self):
        return self.name

class Shipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.UUIDField(db_index=True, verbose_name="ID đơn hàng")
    user_id = models.UUIDField(db_index=True, verbose_name="ID khách hàng")
    
    carrier = models.ForeignKey(
        Carrier, 
        on_delete=models.PROTECT, 
        related_name='shipments',
        verbose_name="Đơn vị vận chuyển"
    )
    
    carrier_shipment_id = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="ID vận đơn bên đối tác"
    )
    
    method = models.CharField(
        max_length=20,
        choices=ShippingMethod.choices,
        default=ShippingMethod.STANDARD
    )
    
    status = models.CharField(
        max_length=20,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PREPARING,
        db_index=True
    )
    
    shipping_address_snapshot = models.JSONField(verbose_name="Địa chỉ giao hàng thực tế")
    
    weight = models.FloatField(default=0.0, verbose_name="Trọng lượng (kg)")
    length = models.FloatField(default=0.0, verbose_name="Chiều dài (cm)")
    width = models.FloatField(default=0.0, verbose_name="Chiều rộng (cm)")
    height = models.FloatField(default=0.0, verbose_name="Chiều cao (cm)")
    
    # Phí ship sẽ tự động cập nhật dựa trên method
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    tracking_number = models.CharField(
        max_length=100, blank=True, null=True, unique=True, db_index=True
    )
    
    estimated_delivery_at = models.DateTimeField(blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'

    def save(self, *args, **kwargs):
        method_enum = ShippingMethod(self.method)
        self.shipping_fee = method_enum.price
        
        super(Shipment, self).save(*args, **kwargs)

class ShipmentLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='logs')
    status = models.CharField(max_length=50)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipment_logs'
        ordering = ['-created_at']