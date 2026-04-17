from django.db import transaction
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Customer, Staff, Admin

def generate_tokens_for_user(user: User):
    """Tạo bộ đôi Access và Refresh Token cho User"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@transaction.atomic
def user_create_customer(username, email, password, **extra_fields):
  
    full_name = extra_fields.pop('full_name', None)
    date_of_birth = extra_fields.pop('date_of_birth', None)
    gender = extra_fields.pop('gender', None)
    height = extra_fields.pop('height', None)
    weight = extra_fields.pop('weight', None)
    foot_length = extra_fields.pop('foot_length', None)
    phone_number = extra_fields.pop('phone_number', None)
    avatar_url = extra_fields.pop('avatar_url', None)

    customer = Customer.objects.create(
        username=username,
        email=email,
        password=make_password(password),
        full_name=full_name,          
        date_of_birth=date_of_birth,  # Cho phép Null
        gender=gender,                # Cho phép Null
        phone_number=phone_number,
        role='customer',
        height=height,                # Cho phép Null
        weight=weight,                # Cho phép Null
        foot_length=foot_length,      # Cho phép Null
        is_active=True,
        avatar_url=avatar_url,
        **extra_fields
    )
    return customer

@transaction.atomic
def staff_create(username, email, password, emp_type, **extra_fields):
    full_name = extra_fields.pop('full_name', None)
    
    staff = Staff.objects.create(
        username=username,
        email=email,
        password=make_password(password),
        full_name=full_name,          
        emp_type=emp_type,
        role='staff',
        is_staff=True,
        **extra_fields
    )
    return staff

@transaction.atomic
def user_update_profile(user: User, data: dict):

    user.full_name = data.get('full_name', user.full_name)
    user.date_of_birth = data.get('date_of_birth', user.date_of_birth)
    user.gender = data.get('gender', user.gender)
    user.phone_number = data.get('phone_number', user.phone_number)
    user.avatar_url = data.get('avatar_url', user.avatar_url)
    
    if 'password' in data and data['password']:
        user.password = make_password(data['password'])
    
    user.save()

    if user.role == 'customer':
        customer = user.customer
        customer.height = data.get('height', customer.height)
        customer.weight = data.get('weight', customer.weight)
        customer.foot_length = data.get('foot_length', customer.foot_length)
        customer.save()
        
    elif user.role == 'staff':
        staff = user.staff
        staff.emp_type = data.get('emp_type', staff.emp_type)
        staff.save()

    return user

@transaction.atomic
def staff_update_by_admin(staff_id, data: dict):

    staff = Staff.objects.get(pk=staff_id)
    
    if 'password' in data and data['password']:
        data['password'] = make_password(data['password'])
        
    for attr, value in data.items():
        setattr(staff, attr, value)
    
    staff.save()
    return staff

def staff_delete(staff_id):
    staff = Staff.objects.get(pk=staff_id)
    staff.delete()