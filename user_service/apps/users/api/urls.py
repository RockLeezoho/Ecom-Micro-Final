from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterCustomerApi, 
    LoginCustomerApi,
    LoginStaffApi,
    LoginAdminApi, 
    LogoutApi, 
    CustomerProfileApi,
    StaffProfileApi,
    AdminProfileApi,    
    StaffViewSet, 
    ShippingAddressListCreateApi,
    ShippingAddressDeleteApi
)

router = DefaultRouter()
router.register(r'staffs', StaffViewSet, basename='staff-management')

urlpatterns = [
    # Auth & Registration
    path('auth/register/', RegisterCustomerApi.as_view(), name='register-customer'),
    path('auth/login/customer/', LoginCustomerApi.as_view(), name='login'),
    path('auth/login/staff/', LoginStaffApi.as_view(), name='login'),
    path('auth/login/admin/', LoginAdminApi.as_view(), name='login'),
    
    path('auth/logout/', LogoutApi.as_view(), name='logout'),

    # Profile
    path('me/customer/', CustomerProfileApi.as_view(), name='user-profile'),
    path('me/staff/', StaffProfileApi.as_view(), name='user-profile'),
    path('me/admin/', AdminProfileApi.as_view(), name='user-profile'),

    # Address
    path('addresses/', ShippingAddressListCreateApi.as_view(), name='shipping-address-list'),
    path('addresses/<int:pk>/', ShippingAddressDeleteApi.as_view(), name='shipping-address-delete'),

    # CRUD Staff
    # paths with prefix: /staffs/ và /staffs/<id>/
    path('', include(router.urls)),
]