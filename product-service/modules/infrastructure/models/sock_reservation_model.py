from django.utils import timezone
from datetime import timedelta
from django.db import models
import uuid
from .product_model import ProductModel
from modules.domain.entities.stock_reservation import (
    ReservationStatus as DomainStatus
)

class StockReservationModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(ProductModel, on_delete=models.CASCADE, related_name='reservations')
    order_id = models.UUIDField(db_index=True)
    quantity = models.IntegerField()
    expires_at = models.DateTimeField(db_index=True)
    STATUS_CHOICES = [(tag.value, tag.value) for tag in DomainStatus]
    status = models.CharField(db_index=True, null=True, max_length=50, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Thêm để track khi release
    
    class Meta:
        db_table = 'stock_reservations'
        indexes = [
            models.Index(fields=['product_id', 'status']),
            models.Index(fields=['order_id']),
            models.Index(fields=['expires_at']),
        ]
    def __str__(self):
        return self.name