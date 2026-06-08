from rest_framework import serializers
from apps.shipping.models import ShippingMethod


class CarrierSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    contact_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    fee = serializers.DecimalField(max_digits=12, decimal_places=2)

class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = ['code', 'name', 'fee']
