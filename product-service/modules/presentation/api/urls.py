from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.product_view import ProductViewSet, HomepageAPIView, ProductDetailAPIView
from .views.health import HealthCheckAPIView
from .views.product_admin_view import ProductAdminViewSet
from .views.product_list_view import ProductListView, ProductFilterMetaView
from .views.category_view import CategoryListAPIView, CategoryAllFlatAPIView
from .views.stock_reservation_view import (
    StockReservationCreateAPIView,
    StockReservationDetailAPIView,
    StockReservationListAPIView,
    StockReservationConfirmAPIView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'admin/products', ProductAdminViewSet, basename='admin-product')

urlpatterns = [
    path('products/homepage/', HomepageAPIView.as_view(), name='product-homepage'),
    path('categories/', CategoryListAPIView.as_view(), name='product-category-list'),
    path('categories/all/', CategoryAllFlatAPIView.as_view(), name='product-category-all-flat'),
    path('products/list/', ProductListView.as_view(), name='product-list'),
    path('products/filters/', ProductFilterMetaView.as_view(), name='product-filter-meta'),

    # Stock reservation endpoints must be before the router-generated product detail patterns
    path('products/reservations/', StockReservationCreateAPIView.as_view(), name='stock-reservation-create'),
    path('products/reservations/list/', StockReservationListAPIView.as_view(), name='stock-reservation-list'),
    path('products/reservations/<uuid:reservation_id>/', StockReservationDetailAPIView.as_view(), name='stock-reservation-detail'),
    path('products/reservations/<uuid:reservation_id>/confirm/', StockReservationConfirmAPIView.as_view(), name='stock-reservation-confirm'),

    # Router URLs (detail/list) come after explicit reservation routes
    path('', include(router.urls)),
    path('products/', ProductListView.as_view(), name='product-list-legacy'),
    path('products/<slug:slug>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
