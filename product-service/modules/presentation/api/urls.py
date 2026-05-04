from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.product_view import ProductViewSet, HomepageAggregatorAPIView, ProductDetailAPIView
from .views.health import HealthCheckAPIView
from .views.product_admin_view import ProductAdminViewSet
from .views.product_list_view import ProductListView, ProductFilterMetaView
from .views.category_view import CategoryListAPIView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'admin/products', ProductAdminViewSet, basename='admin-product')

urlpatterns = [
	path('', include(router.urls)),
	path('categories/', CategoryListAPIView.as_view(), name='category-list'),
	path('products/homepage/', HomepageAggregatorAPIView.as_view(), name='homepage-aggregator'),
	path('products/', ProductListView.as_view(), name='product-list'),
	path('products/filters/', ProductFilterMetaView.as_view(), name='product-filter-meta'),
    path('products/<slug:slug>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
