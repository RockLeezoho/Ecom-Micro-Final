# modules/presentation/api/serializers/stock_reservation_serializer.py
from rest_framework import serializers


class CreateStockReservationSerializer(serializers.Serializer):
    """Serializer cho request tạo stock reservation"""
    product_id = serializers.CharField(max_length=255)
    order_id = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(min_value=1)
    reservation_duration_minutes = serializers.IntegerField(
        default=15, 
        min_value=1, 
        max_value=1440,  # Max 1 day
        required=False
    )


class StockReservationReadSerializer(serializers.Serializer):
    """Serializer cho response stock reservation"""
    id = serializers.CharField()
    product_id = serializers.CharField()
    order_id = serializers.CharField()
    quantity = serializers.IntegerField()
    status = serializers.CharField()
    expires_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()


class ReleaseStockReservationSerializer(serializers.Serializer):
    """Serializer cho request hủy giữ kho"""
    reason = serializers.CharField(
        default="Order cancelled",
        required=False,
        max_length=255
    )


class ListReservationsFilterSerializer(serializers.Serializer):
    """Serializer cho filter query parameters"""
    order_id = serializers.CharField(required=False, allow_blank=True)
    product_id = serializers.CharField(required=False, allow_blank=True)
