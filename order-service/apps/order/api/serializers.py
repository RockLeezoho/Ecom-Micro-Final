from rest_framework import serializers


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)


class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.UUIDField(required=False, allow_null=True)
    address_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    recipient_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    recipient_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payment_method = serializers.ChoiceField(choices=["COD", "BANK_TRANSFER"])
    shipping_method = serializers.ChoiceField(choices=["STANDARD", "EXPRESS"])
    shipping_fee = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    carrier_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
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


# Order Detail Response Serializers
class OrderItemDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    product_id = serializers.UUIDField()
    name_product = serializers.CharField(allow_null=True, allow_blank=True)
    category_id = serializers.UUIDField(allow_null=True)
    category_slug = serializers.CharField(allow_null=True, allow_blank=True)
    quantity = serializers.IntegerField()
    sales_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    subtotal = serializers.SerializerMethodField()

    def get_subtotal(self, obj):
        return obj.quantity * obj.sales_price


class OrderPaymentDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    payment_method = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    transaction_id = serializers.CharField(allow_null=True, allow_blank=True)
    paid_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()


class CustomerDetailSerializer(serializers.Serializer):
    """Extracts customer information from order shipping address snapshot"""
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    address_id = serializers.SerializerMethodField()
    
    def get_customer_name(self, shipping_address):
        """Extract customer name from shipping address"""
        if not shipping_address or not isinstance(shipping_address, dict):
            return None
        # Priority: recipient_name > username > None
        return (shipping_address.get('recipient_name') or 
                shipping_address.get('username'))
    
    def get_customer_phone(self, shipping_address):
        """Extract customer phone from shipping address"""
        if not shipping_address or not isinstance(shipping_address, dict):
            return None
        # Priority: recipient_phone > phone_number > phone > None
        return (shipping_address.get('recipient_phone') or 
                shipping_address.get('phone_number') or 
                shipping_address.get('phone'))
    
    def get_customer_address(self, shipping_address):
        """Extract delivery address text from shipping address"""
        if not shipping_address or not isinstance(shipping_address, dict):
            return None
        # Priority: address_text > address > None
        return (shipping_address.get('address_text') or 
                shipping_address.get('address'))
    
    def get_address_id(self, shipping_address):
        """Extract address ID from shipping address"""
        if not shipping_address or not isinstance(shipping_address, dict):
            return None
        return shipping_address.get('address_id')


class OrderDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    
    # Customer information (extracted from shipping_address snapshot)
    customer = serializers.SerializerMethodField()
    
    # Financial information
    total_price = serializers.DecimalField(max_digits=15, decimal_places=2)
    shipping_fee = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Order status and fulfillment
    status = serializers.CharField()
    shipping_method = serializers.CharField()
    carrier = serializers.CharField(allow_null=True, allow_blank=True)
    tracking_number = serializers.CharField(allow_null=True, allow_blank=True)
    
    # Address and notes
    shipping_address = serializers.JSONField()
    note = serializers.CharField(allow_null=True, allow_blank=True)
    
    # Payment and confirmation status
    is_paid = serializers.BooleanField()
    payment_method = serializers.CharField(allow_null=True)
    confirmed_by = serializers.UUIDField(allow_null=True)
    confirmed_at = serializers.DateTimeField(allow_null=True)
    
    # Timestamps
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    
    # Nested relationships
    items = OrderItemDetailSerializer(many=True, source='items.all')
    payments = OrderPaymentDetailSerializer(many=True, source='payments.all')
    
    def get_customer(self, obj):
        """Serialize customer information from shipping_address"""
        customer_serializer = CustomerDetailSerializer(obj.shipping_address)
        return customer_serializer.data
