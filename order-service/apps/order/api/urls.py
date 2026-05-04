from django.urls import path
from .views import OrderCreateAPIView, OrderConfirmPackingAPIView
from .health import HealthCheckAPIView

urlpatterns = [
    path('orders/', OrderCreateAPIView.as_view(), name='order-create'),
    path('orders/<uuid:order_id>/confirm-packing/', OrderConfirmPackingAPIView.as_view(), name='order-confirm-packing'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
