from rest_framework import serializers


class PaymentMethodSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()

class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency = serializers.CharField(max_length=10)
    payment_method = serializers.ChoiceField(choices=["COD", "E_WALLET", "BANK_TRANSFER", "CREDIT_CARD"])
    provider = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    return_url = serializers.CharField(max_length=255)

class PaymentCreateResponseSerializer(serializers.Serializer):
    payment_id = serializers.CharField()
    order_id = serializers.UUIDField()
    status = serializers.CharField()
    payment_method = serializers.CharField()
    provider = serializers.CharField(allow_null=True, required=False)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    payment_url = serializers.CharField(allow_null=True, required=False)
    reference_number = serializers.CharField()
    expire_at = serializers.DateTimeField(allow_null=True, required=False)
    message = serializers.CharField()
