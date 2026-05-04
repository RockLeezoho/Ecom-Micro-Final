from django.urls import path
from .views import PaymentMethodListAPIView, PaymentCreateAPIView, PaymentGatewayWebhookAPIView
from .health import HealthCheckAPIView

urlpatterns = [
    path('methods/', PaymentMethodListAPIView.as_view(), name='payment-method-list'),
    path('create/', PaymentCreateAPIView.as_view(), name='payment-create'),
    path('webhook/', PaymentGatewayWebhookAPIView.as_view(), name='payment-webhook'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
