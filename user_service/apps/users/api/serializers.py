from rest_framework import serializers
from ..models import User, Admin, Staff, Customer, ShippingAddress

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = ['id', 'address']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'phone_number', 'avatar_url',
            'role', 'gender', 'date_of_birth', 'is_active'
        ]

        extra_kwargs = {
            'full_name': {'allow_null': True, 'required': False},
            'gender': {'allow_null': True, 'required': False},
            'date_of_birth': {'allow_null': True, 'required': False},
            'phone_number': {'allow_null': True, 'required': False},
        }

class CustomerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=10)
    
    full_name = serializers.CharField(max_length=255, required=False, allow_null=True)
    gender = serializers.CharField(max_length=10, required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    

    height = serializers.FloatField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    foot_length = serializers.FloatField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên đăng nhập này đã tồn tại.")
        return value

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class CustomerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'username', 'password', 'full_name', 'phone_number', 'gender', 'date_of_birth', 'avatar_url',
            'height', 'weight', 'foot_length'
        ]
        extra_kwargs = {
            'full_name': {'allow_null': True, 'required': False},
            'gender': {'allow_null': True, 'required': False},
            'date_of_birth': {'allow_null': True, 'required': False},
            'avatar_url': {'allow_null': True, 'required': False},
            'height': {'allow_null': True, 'required': False},
            'weight': {'allow_null': True, 'required': False},
            'foot_length': {'allow_null': True, 'required': False},
        }

class StaffSerializer(serializers.ModelSerializer):
    
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False) # Admin có thể không đổi pass khi update
    full_name = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'username', 'password', 'email', 'full_name', 
            'employment_type', 'is_active', 'date_of_birth'
        ]

    def validate_username(self, value):
        user_id = self.instance.id if self.instance else None
        if User.objects.exclude(id=user_id).filter(username=value).exists():
            raise serializers.ValidationError("Username đã được sử dụng.")
        return value