from django.db.models import QuerySet
from .models import User, Customer, Staff, Admin

def get_user_profile(user: User) -> dict:
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.avatar_url,
        "phone_number": user.phone_number,
        "gender": user.gender,
        "date_of_birth": user.date_of_birth,
        "role": user.role,
        "is_active": user.is_active,
    }

    if user.role == 'customer':
        customer = getattr(user, 'customer', None)
        if customer:
            data.update({
                "height": customer.height,
                "weight": customer.weight,
                "foot_length": customer.foot_length,
                "shipping_addresses": list(
                    customer.addresses.all().values('id', 'address')
                )
            })

    elif user.role == 'staff':
        staff = getattr(user, 'staff', None)
        if staff:
            data["employment_type"] = staff.employment_type

    elif user.role == 'admin':
        admin_obj = getattr(user, 'admin', None)
        if admin_obj:
            data["position"] = admin_obj.position

    return data

def staff_list() -> QuerySet:
    return Staff.objects.select_related('user_ptr').all().order_by('-id')


def customer_list() -> QuerySet:
    return Customer.objects.select_related('user_ptr').all().order_by('-id')