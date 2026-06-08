from django.urls import path
from .views import CarrierListAPIView, ShippingMethodListAPIView
from .health import HealthCheckAPIView

urlpatterns = [
    path('carriers/', CarrierListAPIView.as_view(), name='carrier-list'),
    path('carriers', CarrierListAPIView.as_view(), name='carrier-list-no-slash'),
    path('methods/', ShippingMethodListAPIView.as_view(), name='shipping-method-list'),
    path('methods', ShippingMethodListAPIView.as_view(), name='shipping-method-list-no-slash'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
    path('health', HealthCheckAPIView.as_view(), name='health-no-slash'),
]
