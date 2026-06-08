import django_filters
from modules.infrastructure.models.product_model import ProductModel

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    origin = django_filters.CharFilter(field_name="origin", lookup_expr='iexact')
    brand = django_filters.CharFilter(field_name="brand__name", lookup_expr='iexact')
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr='iexact')
    color = django_filters.CharFilter(field_name="color", lookup_expr='iexact')

    class Meta:
        model = ProductModel
        fields = []
