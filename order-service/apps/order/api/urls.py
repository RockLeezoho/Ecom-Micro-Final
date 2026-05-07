from django.urls import path
from .views import (
    OrderConfirmAPIView,
    OrderRejectAPIView,
    OrderConfirmPackingAPIView,
    OrderCreateAPIView,
    OrderCreateShipmentAPIView,
    OrderHandoverToCarrierAPIView,
    PaymentCallbackAPIView,
)
from .health import HealthCheckAPIView

urlpatterns = [
    path('orders/', OrderCreateAPIView.as_view(), name='order-create'),
    path('orders/<uuid:order_id>/confirm-order/', OrderConfirmAPIView.as_view(), name='order-confirm'),
    path('orders/<uuid:order_id>/reject-order/', OrderRejectAPIView.as_view(), name='order-reject'),
    path('orders/<uuid:order_id>/create-shipment/', OrderCreateShipmentAPIView.as_view(), name='order-create-shipment'),
    path('orders/<uuid:order_id>/confirm-packing/', OrderConfirmPackingAPIView.as_view(), name='order-confirm-packing'),
    path('orders/<uuid:order_id>/handover-to-carrier/', OrderHandoverToCarrierAPIView.as_view(), name='order-handover-to-carrier'),
    path('payments/callback/', PaymentCallbackAPIView.as_view(), name='order-payment-callback'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
