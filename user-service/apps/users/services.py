from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Customer
from rest_framework.exceptions import ValidationError


def generate_tokens_for_user(user: User):
    """Tạo bộ đôi Access và Refresh Token cho User"""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = (getattr(user, "role", "") or "").lower()
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@transaction.atomic
def user_create_customer(username, email, password, phone_number, **extra_fields):
    first_name = extra_fields.pop('first_name', '') or ''
    last_name = extra_fields.pop('last_name', '') or ''
    date_of_birth = extra_fields.pop('date_of_birth', None)
    gender = extra_fields.pop('gender', None)
    height = extra_fields.pop('height', None)
    weight = extra_fields.pop('weight', None)
    foot_length = extra_fields.pop('foot_length', None)
    avatar_url = extra_fields.pop('avatar_url', None)
    is_active = extra_fields.pop('is_active', True)

    customer = Customer.objects.create(
        username=username,
        email=email,
        password=make_password(password),
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,  
        gender=gender,                
        phone_number=phone_number,
        role='CUSTOMER',
        height=height,               
        weight=weight,                
        foot_length=foot_length,      
        is_active=is_active,
        avatar_url=avatar_url,
        **extra_fields
    )
    return customer


@transaction.atomic
def _change_password(user, data):
    old_password = data.get("old_password")
    new_password = data.get("password")
    if old_password and new_password:
        if old_password == new_password:
            raise ValidationError({"password": ["Mật khẩu mới không được trùng mật khẩu cũ."]})
        if check_password(old_password, user.password):
            user.password = make_password(new_password)
        else:
            raise ValidationError({"old_password": ["Mật khẩu cũ không đúng."]})
    elif new_password:
        raise ValidationError({"old_password": ["Cần cung cấp mật khẩu cũ để đổi mật khẩu."]})


@transaction.atomic
def customer_update_profile(user: User, data: dict):
    user_fields = ["first_name", "last_name", "phone_number", "date_of_birth", "gender", "avatar_url"]
    customer_fields = ["height", "weight", "foot_length"]

    for field in user_fields:
        if field in data:
            setattr(user, field, data[field])

    customer = user.customer
    for field in customer_fields:
        if field in data:
            setattr(customer, field, data[field])
    customer.save()

    if "password" in data:
        _change_password(user, data)

    user.save()
    return user
