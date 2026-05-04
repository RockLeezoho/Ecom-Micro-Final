from django.urls import path
from .views import CartView, AddCartItemView, UpdateCartItemView, RemoveCartItemView
from .health import HealthCheckAPIView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/add/', AddCartItemView.as_view(), name='cart-add'),
    path('cart/update/', UpdateCartItemView.as_view(), name='cart-update'),
    path('cart/remove/', RemoveCartItemView.as_view(), name='cart-remove'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
