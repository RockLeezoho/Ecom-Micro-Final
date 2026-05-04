from rest_framework import serializers
from apps.users.models import User
from apps.users.api.serializers import (
    LoginSerializer,
    CustomerUpdateSerializer,
    StaffUpdateSerializer,
    AdminUpdateSerializer,
    StaffAdminGetSerializer,
    StaffAdminCreateSerializer,
    StaffAdminUpdateSerializer,
    CustomerAdminGetSerializer,
    CustomerAdminCreateSerializer,
    CustomerAdminUpdateSerializer,
)
from apps.users.api.serializers import (
    LoginSerializer,
    CustomerUpdateSerializer,
    StaffUpdateSerializer,
    AdminUpdateSerializer,
    StaffAdminGetSerializer,
    StaffAdminCreateSerializer,
    StaffAdminUpdateSerializer,
    CustomerAdminGetSerializer,
    CustomerAdminCreateSerializer,
    CustomerAdminUpdateSerializer,
)


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'avatar_url',
            'role',
            'is_active',
            'is_staff',
            'phone_number',
        )


class ManagementLoginUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar_url')
