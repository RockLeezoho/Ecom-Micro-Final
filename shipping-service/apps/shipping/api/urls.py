from django.urls import path
from .views import ShippingMethodListAPIView
from .health import HealthCheckAPIView

urlpatterns = [
    path('methods/', ShippingMethodListAPIView.as_view(), name='shipping-method-list'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
