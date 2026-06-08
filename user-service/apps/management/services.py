from django.contrib.auth.hashers import make_password
from django.db import transaction

from apps.users.models import User, Customer, Staff
from apps.users.services import generate_tokens_for_user, user_create_customer, _change_password


@transaction.atomic
def user_update_profile(user: User, data: dict):
    user_fields = ["first_name", "last_name", "phone_number", "date_of_birth", "gender", "avatar_url"]
    admin_fields = ["username", "position"]

    for field in user_fields:
        if field in data:
            setattr(user, field, data[field])

    if user.role.lower() == "staff":
        staff = user.staff
        staff.save()
        if "password" in data:
            _change_password(user, data)

    elif user.role.lower() == "admin":
        admin = user.admin
        for field in admin_fields:
            if field in data:
                setattr(admin, field, data[field])
        admin.save()
        if "password" in data:
            _change_password(user, data)

    elif user.role.lower() == "customer":
        customer = user.customer
        for field in ["height", "weight", "foot_length"]:
            if field in data:
                setattr(customer, field, data[field])
        customer.save()
        if "password" in data:
            _change_password(user, data)

    user.save()
    return user


@transaction.atomic
def customer_create_by_admin(username, email, password, phone_number, **extra_fields):
    return user_create_customer(
        username=username,
        email=email,
        password=password,
        phone_number=phone_number,
        **extra_fields,
    )


@transaction.atomic
def staff_create(username, email, password, phone_number, employment_type, **extra_fields):
    first_name = extra_fields.pop('first_name', '') or ''
    last_name = extra_fields.pop('last_name', '') or ''
    avatar_url = extra_fields.pop('avatar_url', None)
    is_active = extra_fields.pop('is_active', True)
    staff = Staff.objects.create(
        username=username,
        email=email,
        password=make_password(password),
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        employment_type=employment_type,
        role='STAFF',
        is_active=is_active,
        avatar_url=avatar_url,
        **extra_fields,
    )
    return staff


@transaction.atomic
def staff_update_by_admin(staff_id, data: dict):
    staff = Staff.objects.get(pk=staff_id)

    if 'password' in data and data['password']:
        data['password'] = make_password(data['password'])

    for attr, value in data.items():
        setattr(staff, attr, value)

    staff.save()
    return staff


@transaction.atomic
def customer_update_by_admin(customer_id, data: dict):
    customer = Customer.objects.get(pk=customer_id)

    if 'password' in data and data['password']:
        data['password'] = make_password(data['password'])

    for attr, value in data.items():
        setattr(customer, attr, value)

    customer.save()
    return customer


def staff_delete(staff_id):
    staff = Staff.objects.get(pk=staff_id)
    staff.delete()


def customer_delete(customer_id):
    customer = Customer.objects.get(pk=customer_id)
    customer.delete()