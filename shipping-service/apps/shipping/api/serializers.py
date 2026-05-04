from rest_framework import serializers

class ShippingMethodSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    fee = serializers.DecimalField(max_digits=10, decimal_places=2)
