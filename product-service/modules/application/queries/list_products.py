from modules.infrastructure.models.product_model import ProductModel
from modules.domain.entities.product import Product

class ListActiveHighRatingProductsQuery:
    @staticmethod
    def execute():
        # Sử dụng custom queryset đã định nghĩa ở Infrastructure
        return ProductModel.objects.is_selling_and_high_rating().select_related('category', 'brand').prefetch_related('images').order_by('-created_at')

class SearchProductsQuery:
    @staticmethod
    def execute(keyword: str):
        return ProductModel.objects.search_by_keyword(keyword).select_related('category', 'brand').prefetch_related('images').order_by('-rating')