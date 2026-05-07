from modules.presentation.api.serializers.homepage_read_serializer import HomepageReadSerializer
from modules.infrastructure.models.category_model import CategoryModel
from modules.infrastructure.models.product_model import ProductModel
from modules.infrastructure.gateways.django_cache_gateway import DjangoCacheGateway
from modules.infrastructure.gateways.grpc_product_gateways import GrpcOrderGateway, GrpcRecommendationGateway
from modules.infrastructure.repositories.product_catalog_repository_impl import ProductCatalogRepositoryImpl
from rest_framework.views import APIView
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from modules.application.queries.list_products import ListActiveHighRatingProductsQuery, SearchProductsQuery
from ..serializers.product_detail_read_serializer import ProductDetailReadSerializer
from ..serializers.product_serializer import ProductPolymorphicSerializer
from modules.application.services.product_service import ProductService

product_service = ProductService(
    product_catalog_repository=ProductCatalogRepositoryImpl(),
    recommendation_gateway=GrpcRecommendationGateway(),
    order_gateway=GrpcOrderGateway(),
    cache_gateway=DjangoCacheGateway(),
)

# Homepage Aggregator APIView
class HomepageAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        category_key = request.query_params.get('category')
        if not category_key:
            return Response({"error": "category_key is required"}, status=400)
        try:
            homepage_data = product_service.get_homepage_products(category_key)
        except CategoryModel.DoesNotExist:
            return Response({"error": "Category not found"}, status=404)

        return Response({
            "status": "success",
            "data": HomepageReadSerializer(homepage_data).data,
        }, status=200)


# Move ProductDetailAPIView to top-level for DRF import
class ProductDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint: GET /api/products/<slug:slug>/
    hoặc GET /api/products/<uuid:id>/
    Trả về chi tiết sản phẩm, bao gồm sản phẩm liên quan.
    """
    serializer_class = ProductDetailReadSerializer
    lookup_field = 'slug'

    def get(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        if not slug:
            return Response({"status": "error", "message": "Missing product identifier (slug or id)"}, status=400)

        detail = product_service.get_product_detail(slug)
        serializer = ProductDetailReadSerializer(detail)
        return Response({"status": "success", "data": serializer.data})


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductPolymorphicSerializer

    def get_queryset(self):
        """
        Mặc định trả về tất cả, nhưng hỗ trợ search qua query param ?q=
        """
        keyword = self.request.query_params.get('q', None)
        if keyword:
            return SearchProductsQuery.execute(keyword)
        return ProductModel.objects.all()

    @action(detail=False, methods=['get'], url_path='featured')
    def get_featured_products(self, request):
        """
        Endpoint: GET /api/products/featured/
        Lấy sản phẩm đang bán và có rating >= 4.0
        """
        products = ListActiveHighRatingProductsQuery.execute()
        
        # Phân trang (nếu cần)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(products, many=True)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        Endpoint: GET /api/products/search/?q=keyword
        """
        keyword = request.query_params.get('q', '')
        if not keyword:
            return Response(
                {"message": "Keyword is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        products = SearchProductsQuery.execute(keyword)
        serializer = self.get_serializer(products, many=True)
        return Response({"status": "success", "data": serializer.data})
    
    @action(detail=False, methods=['get'], url_path='health')
    def health(self, request):
        """
        Endpoint: GET /api/products/health/
        Healthcheck cho product_service
        """
        return Response({"status": "ok"}, status=200)