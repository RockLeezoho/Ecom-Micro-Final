from rest_framework import serializers


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)


class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.UUIDField(required=False, allow_null=True)
    address_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payment_method = serializers.ChoiceField(choices=["COD", "BANK_TRANSFER", "E_WALLET", "CREDIT_CARD"])
    shipping_method = serializers.ChoiceField(choices=["STANDARD", "EXPRESS"])
    items = OrderItemInputSerializer(many=True)

    def validate(self, attrs):
        address_id = attrs.get("address_id")
        address_text = (attrs.get("address_text") or "").strip()
        if not address_id and not address_text:
            raise serializers.ValidationError("Either address_id or address_text is required")
        return attrs


class OrderCreateResponseSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    message = serializers.CharField()
    payment_url = serializers.CharField(required=False, allow_null=True)


class OrderConfirmSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class OrderRejectSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class CreateShipmentSerializer(serializers.Serializer):
    weight = serializers.FloatField(min_value=0.0)
    length = serializers.FloatField(min_value=0.0)
    width = serializers.FloatField(min_value=0.0)
    height = serializers.FloatField(min_value=0.0)


class HandoverToCarrierSerializer(serializers.Serializer):
    carrier_name = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)
