from django.db.models import QuerySet
from .models import User, Customer, Staff, Admin, ShippingAddress

def get_user_profile(user: User) -> dict:
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
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
                # Lấy danh sách địa chỉ giao hàng
                "shipping_addresses": list(
                    customer.shipping_addresses.all().values('id', 'address')
                )
            })

    elif user.role == 'staff':
        staff = getattr(user, 'staff', None)
        if staff:
            data["emp_type"] = staff.emp_type

    elif user.role == 'admin':
        admin_obj = getattr(user, 'admin', None)
        if admin_obj:
            data["position"] = admin_obj.position

    return data

def staff_list() -> QuerySet:
    """
    Lấy danh sách tất cả nhân viên.
    Sử dụng select_related để tránh lỗi N+1 query (lấy dữ liệu User cha và Staff con trong 1 lần query).
    """
    return Staff.objects.select_related('user_ptr').all().order_by('-id')

def shipping_address_list_for_customer(customer: Customer) -> QuerySet:
    """
    Lấy danh sách địa chỉ giao hàng của một khách hàng.
    """
    return customer.shipping_addresses.all()