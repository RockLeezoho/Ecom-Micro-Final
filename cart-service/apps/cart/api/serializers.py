from rest_framework import serializers
from apps.cart.models import Cart, CartItem

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'sales_price', 'quantity', 'subtotal']
        read_only_fields = ['id', 'subtotal']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user_id', 'items', 'total', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'items', 'total', 'created_at', 'updated_at']

    def get_total(self, obj):
        # Use the prefetched items if available (no extra query), else fall back to .all()
        items = obj.items.all()
        return sum(item.subtotal for item in items)

class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    sales_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity = serializers.IntegerField(min_value=1)

class UpdateCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

class RemoveCartItemSerializer(serializers.Serializer):
    product_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
