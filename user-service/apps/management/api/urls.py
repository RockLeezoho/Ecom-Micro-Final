from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginAdminApi,
    LoginStaffApi,
    LogoutApi,
    StaffProfileApi,
    AdminProfileApi,
    StaffViewSet,
    CustomerViewSet,
    AdminUserViewSet,
)


router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'staffs', StaffViewSet, basename='staff-management')
router.register(r'customers', CustomerViewSet, basename='customer-management')


urlpatterns = [
    path('auth/login/admin/', LoginAdminApi.as_view(), name='management-login-admin'),
    path('auth/login/staff/', LoginStaffApi.as_view(), name='management-login-staff'),
    path('auth/logout/', LogoutApi.as_view(), name='management-logout'),
    path('me/staff/', StaffProfileApi.as_view(), name='management-staff-profile'),
    path('me/admin/', AdminProfileApi.as_view(), name='management-admin-profile'),
    path('', include(router.urls)),
]