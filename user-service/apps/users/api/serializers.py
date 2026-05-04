from rest_framework import serializers

from ..exceptions import ConflictError
from ..models import Address, Admin, Customer, FavoriteProduct, Staff, User


class CommonUserFieldsMixin:
    common_fields = [
        'first_name', 'last_name', 'phone_number', 'gender', 'date_of_birth', 'avatar_url'
    ]
    common_extra_kwargs = {
        'first_name': {'allow_null': True, 'required': False},
        'last_name': {'allow_null': True, 'required': False},
        'gender': {'allow_null': True, 'required': False},
        'date_of_birth': {'allow_null': True, 'required': False},
        'avatar_url': {'allow_null': True, 'required': False},
        'phone_number': {'allow_null': True, 'required': False},
    }


class UniqueUserValidatorMixin:
    def validate_username(self, value):
        user_id = getattr(self.instance, 'id', None)
        if User.objects.exclude(id=user_id).filter(username=value).exists():
            raise ConflictError({"username": ["Tên đăng nhập này đã tồn tại."]})
        return value

    def validate_email(self, value):
        user_id = getattr(self.instance, 'id', None)
        if User.objects.exclude(id=user_id).filter(email=value).exists():
            raise ConflictError({"email": ["Email đã được sử dụng."]})
        return value


class PasswordChangeValidatorMixin:
    def validate(self, attrs):
        old_password = attrs.get('old_password')
        new_password = attrs.get('password')
        if new_password:
            if not old_password:
                raise serializers.ValidationError({"old_password": "Cần nhập mật khẩu cũ để đổi mật khẩu."})
            if old_password == new_password:
                raise serializers.ValidationError({"password": "Mật khẩu mới không được trùng mật khẩu cũ."})
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        if not username or not password:
            raise serializers.ValidationError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.")
        return attrs


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'address']


class FavoriteProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteProduct
        fields = ["id", "product_id", "created_at"]
        read_only_fields = ["id", "created_at"]


class FavoriteProductCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()


class UserSerializer(serializers.ModelSerializer, CommonUserFieldsMixin):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', *CommonUserFieldsMixin.common_fields,
            'role', 'is_active'
        ]
        extra_kwargs = {**CommonUserFieldsMixin.common_extra_kwargs}


class CustomerRegisterSerializer(
    serializers.ModelSerializer,
    CommonUserFieldsMixin,
    UniqueUserValidatorMixin
):
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'email', *CommonUserFieldsMixin.common_fields
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': True},
            'password': {'required': True},
            'email': {'required': True},
            'phone_number': {'required': True},
        }


class CustomerUpdateSerializer(serializers.ModelSerializer, CommonUserFieldsMixin, PasswordChangeValidatorMixin):
    old_password = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Customer
        fields = [
            *CommonUserFieldsMixin.common_fields,
            'avatar', 'height', 'weight', 'foot_length', 'old_password', 'password'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'height': {'allow_null': True, 'required': False},
            'weight': {'allow_null': True, 'required': False},
            'foot_length': {'allow_null': True, 'required': False},
            'avatar_url': {'read_only': True},
        }


class StaffUpdateSerializer(serializers.ModelSerializer, CommonUserFieldsMixin):
    class Meta:
        model = Staff
        fields = CommonUserFieldsMixin.common_fields
        extra_kwargs = {**CommonUserFieldsMixin.common_extra_kwargs}


class StaffAdminGetSerializer(serializers.ModelSerializer, CommonUserFieldsMixin):
    class Meta:
        model = Staff
        fields = [
            'id', 'username', 'email', *CommonUserFieldsMixin.common_fields,
            'employment_type', 'is_active'
        ]
        extra_kwargs = {**CommonUserFieldsMixin.common_extra_kwargs}


class StaffAdminCreateSerializer(serializers.ModelSerializer, CommonUserFieldsMixin, UniqueUserValidatorMixin):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Staff
        fields = [
            'username', 'password', 'email', *CommonUserFieldsMixin.common_fields,
            'employment_type', 'is_active'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': True},
            'password': {'required': True},
            'email': {'required': True},
            'employment_type': {'required': True},
            'is_active': {'required': False},
        }


class StaffAdminUpdateSerializer(serializers.ModelSerializer, UniqueUserValidatorMixin):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Staff
        fields = [
            'username', 'email', *CommonUserFieldsMixin.common_fields,
            'employment_type', 'is_active', 'password'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': False},
            'email': {'required': False},
            'employment_type': {'required': False},
            'is_active': {'required': False},
        }


class AdminUpdateSerializer(serializers.ModelSerializer, CommonUserFieldsMixin, UniqueUserValidatorMixin, PasswordChangeValidatorMixin):
    old_password = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    position = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Admin
        fields = [
            'username', *CommonUserFieldsMixin.common_fields,
            'position', 'old_password', 'password'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': False},
            'position': {'allow_null': True, 'required': False},
        }


class CustomerAdminGetSerializer(serializers.ModelSerializer, CommonUserFieldsMixin):
    class Meta:
        model = Customer
        fields = [
            'id', 'username', 'email', *CommonUserFieldsMixin.common_fields,
            'height', 'weight', 'foot_length', 'is_active'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'height': {'allow_null': True, 'required': False},
            'weight': {'allow_null': True, 'required': False},
            'foot_length': {'allow_null': True, 'required': False},
        }


class CustomerAdminCreateSerializer(
    serializers.ModelSerializer,
    CommonUserFieldsMixin,
    UniqueUserValidatorMixin
):
    password = serializers.CharField(write_only=True, required=True)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Customer
        fields = [
            'username', 'password', 'email', *CommonUserFieldsMixin.common_fields,
            'avatar', 'height', 'weight', 'foot_length', 'is_active'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': True},
            'password': {'required': True},
            'email': {'required': True},
            'height': {'allow_null': True, 'required': False},
            'weight': {'allow_null': True, 'required': False},
            'foot_length': {'allow_null': True, 'required': False},
            'is_active': {'required': False},
            'avatar_url': {'read_only': True},
        }


class CustomerAdminUpdateSerializer(
    serializers.ModelSerializer,
    CommonUserFieldsMixin,
    UniqueUserValidatorMixin
):
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Customer
        fields = [
            'username', 'email', *CommonUserFieldsMixin.common_fields,
            'avatar', 'height', 'weight', 'foot_length', 'is_active', 'password'
        ]
        extra_kwargs = {
            **CommonUserFieldsMixin.common_extra_kwargs,
            'username': {'required': False},
            'email': {'required': False},
            'height': {'allow_null': True, 'required': False},
            'weight': {'allow_null': True, 'required': False},
            'foot_length': {'allow_null': True, 'required': False},
            'is_active': {'required': False},
            'avatar_url': {'read_only': True},
        }