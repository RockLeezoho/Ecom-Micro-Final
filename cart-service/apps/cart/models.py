import uuid
from django.db import models

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True, verbose_name="ID người dùng")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'
        verbose_name = "Giỏ hàng"

    def __str__(self):
        return f"Cart ID: {self.id} - User ID: {self.user_id}"


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    cart = models.ForeignKey(
        Cart, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    
    product_id = models.UUIDField(db_index=True, verbose_name="ID sản phẩm")
    
    sales_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        verbose_name="Giá bán"
    )
    
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số lượng")

    class Meta:
        db_table = 'cart_items'
        verbose_name = "Vật phẩm giỏ hàng"
        unique_together = ('cart', 'product_id')

    def __str__(self):
        return f"Item: {self.product_id} in Cart: {self.cart.id}"

    @property
    def subtotal(self):
        """Tính thành tiền cho dòng này"""
        return self.sales_price * self.quantity