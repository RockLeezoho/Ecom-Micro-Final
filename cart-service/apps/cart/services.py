# Service layer for cart logic (optional, for DDD separation)
from .models import Cart, CartItem
from django.db import transaction
from django.shortcuts import get_object_or_404

class CartService:
    @staticmethod
    def get_or_create_cart(user_id):
        return Cart.objects.get_or_create(user_id=user_id)

    @staticmethod
    @transaction.atomic
    def add_item(cart, product_id, sales_price, quantity):
        item, created = CartItem.objects.get_or_create(
            cart=cart, product_id=product_id,
            defaults={'sales_price': sales_price, 'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.sales_price = sales_price
            item.save()
        return item

    @staticmethod
    @transaction.atomic
    def update_item(cart, product_id, quantity):
        item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        item.quantity = quantity
        item.save()
        return item

    @staticmethod
    @transaction.atomic
    def remove_items(cart, product_ids):
        deleted, _ = CartItem.objects.filter(cart=cart, product_id__in=product_ids).delete()
        return deleted
