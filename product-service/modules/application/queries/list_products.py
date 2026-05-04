from modules.infrastructure.models.product_model import ProductModel
from modules.domain.entities.product import Product

class ListActiveHighRatingProductsQuery:
    @staticmethod
    def execute():
        # Sử dụng custom queryset đã định nghĩa ở Infrastructure
        return ProductModel.objects.is_selling_and_high_rating().order_by('-createdAt')

class SearchProductsQuery:
    @staticmethod
    def execute(keyword: str):
        return ProductModel.objects.search_by_keyword(keyword).order_by('-rating')