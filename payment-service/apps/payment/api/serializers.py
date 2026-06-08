from rest_framework import serializers

from apps.payment.models import PaymentMethod


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['code', 'name', 'description', 'provider', 'is_active', 'sort_order']

class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency = serializers.CharField(max_length=10)
    payment_method = serializers.CharField()
    provider = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    return_url = serializers.CharField(max_length=255)

    def validate_payment_method(self, value):
        normalized_value = str(value or '').strip().upper()
        method = PaymentMethod.objects.filter(code__iexact=normalized_value, is_active=True).first()
        if method is None:
            raise serializers.ValidationError("Phuong thuc thanh toan khong hop le")
        return method.code

class PaymentCreateResponseSerializer(serializers.Serializer):
    payment_id = serializers.CharField()
    order_id = serializers.UUIDField()
    status = serializers.CharField()
    payment_method = serializers.CharField()
    provider = serializers.CharField(allow_null=True, required=False)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    payment_url = serializers.CharField(allow_null=True, required=False)
    qr_image_url = serializers.CharField(allow_null=True, required=False)
    reference_number = serializers.CharField()
    expire_at = serializers.DateTimeField(allow_null=True, required=False)
    message = serializers.CharField()


class PaymentTransferConfirmSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField(required=False)
    reference_number = serializers.CharField(required=False, allow_blank=True)
    transaction_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if not attrs.get('payment_id') and not str(attrs.get('reference_number') or '').strip():
            raise serializers.ValidationError('payment_id hoặc reference_number là bắt buộc')
        return attrs


class PaymentQrSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField(required=False)
    reference_number = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get('payment_id') and not str(attrs.get('reference_number') or '').strip():
            raise serializers.ValidationError('payment_id hoặc reference_number là bắt buộc')
        return attrs
