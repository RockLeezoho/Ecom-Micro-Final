from django.urls import path
from .views import (
    PaymentMethodListAPIView,
    PaymentCreateAPIView,
    PaymentQrAPIView,
    PaymentConfirmTransferAPIView,
    PaymentGatewayWebhookAPIView,
    PaymentSimulateSuccessAPIView,
)
from .health import HealthCheckAPIView

urlpatterns = [
    path('methods/', PaymentMethodListAPIView.as_view(), name='payment-method-list'),
    path('methods', PaymentMethodListAPIView.as_view(), name='payment-method-list-no-slash'),
    path('create/', PaymentCreateAPIView.as_view(), name='payment-create'),
    path('qr/', PaymentQrAPIView.as_view(), name='payment-qr'),
    path('confirm-transfer/', PaymentConfirmTransferAPIView.as_view(), name='payment-confirm-transfer'),
    path('simulate-success/', PaymentSimulateSuccessAPIView.as_view(), name='payment-simulate-success'),
    path('webhook/', PaymentGatewayWebhookAPIView.as_view(), name='payment-webhook'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
