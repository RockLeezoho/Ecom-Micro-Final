from rest_framework import serializers

class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)

class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=["COD", "BANK_TRANSFER", "E_WALLET", "CREDIT_CARD"])
    shipping_method = serializers.ChoiceField(choices=["STANDARD", "EXPRESS"])
    items = OrderItemInputSerializer(many=True)

class OrderCreateResponseSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    message = serializers.CharField()
    payment_url = serializers.CharField(required=False, allow_null=True)
