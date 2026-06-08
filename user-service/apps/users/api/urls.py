from django.urls import path
from .views import (
    RegisterCustomerApi, 
    LoginCustomerApi,
    LogoutApi, 
    CustomerProfileApi,
    AddressListCreateApi,
    AddressDetailApi,
    FavoriteProductListCreateApi,
    FavoriteProductDeleteApi,
)
from .health import HealthCheckAPIView

urlpatterns = [
    path('auth/register/', RegisterCustomerApi.as_view(), name='register-customer'),
    path('auth/login/customer/', LoginCustomerApi.as_view(), name='login-customer'),
    path('auth/logout/', LogoutApi.as_view(), name='logout'),

    path('health/', HealthCheckAPIView.as_view(), name='health'),

    path('me/customer/', CustomerProfileApi.as_view(), name='customer-profile'),

    path('addresses/', AddressListCreateApi.as_view(), name='address-list'),
    path('addresses/<uuid:pk>/', AddressDetailApi.as_view(), name='address-detail'),
    path('favorites/', FavoriteProductListCreateApi.as_view(), name='favorite-product-list-create'),
    path('favorites/<str:product_id>/', FavoriteProductDeleteApi.as_view(), name='favorite-product-delete'),
]