from django.core.cache import cache
from concurrent.futures import ThreadPoolExecutor
from modules.infrastructure.grpc_client import get_recommendation_stub, get_order_stub
from modules.presentation.api.serializers.homepage_product_serializer import HomepageProductSerializer
from modules.infrastructure.models.category_model import CategoryModel
from modules.infrastructure.models.product_model import ProductModel
from rest_framework.views import APIView
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import F
from modules.application.queries.list_products import ListActiveHighRatingProductsQuery, SearchProductsQuery
from ..serializers.product_serializer import ProductPolymorphicSerializer, ProductDetailSerializer
from modules.application.queries.get_product import GetProductDetailQuery
import threading
# Homepage Aggregator APIView
class HomepageAggregatorAPIView(APIView):
    def get(self, request):
        category_slug = request.query_params.get('category')
        if not category_slug:
            return Response({"error": "category is required"}, status=400)
        try:
            category = CategoryModel.objects.get(name__iexact=category_slug)
        except CategoryModel.DoesNotExist:
            return Response({"error": "Category not found"}, status=404)

        # Local DB queries
        new_arrivals = ProductModel.objects.filter(category=category).order_by('-createdAt')[:10]
        popular = ProductModel.objects.filter(category=category, rating__gte=4.8).order_by('-rating')[:10]

        # gRPC calls with cache
        cache_key_ai = f"ai_recommend_{category.id}"
        cache_key_order = f"order_bestseller_{category.id}"
        recommended_ids = cache.get(cache_key_ai)
        bestseller_ids = cache.get(cache_key_order)

        def fetch_ai():
            try:
                stub = get_recommendation_stub()
                resp = stub.GetRecommendedProducts(category_id=str(category.id))
                return list(resp.product_ids)
            except Exception:
                return []

        def fetch_order():
            try:
                stub = get_order_stub()
                resp = stub.GetBestSellers(category_id=str(category.id))
                return list(resp.product_ids)
            except Exception:
                return []

        with ThreadPoolExecutor() as executor:
            futures = {}
            if recommended_ids is None:
                futures['ai'] = executor.submit(fetch_ai)
            if bestseller_ids is None:
                futures['order'] = executor.submit(fetch_order)
            results = {k: v.result(timeout=2) for k, v in futures.items()}

        if recommended_ids is None:
            recommended_ids = results.get('ai', [])
            cache.set(cache_key_ai, recommended_ids, timeout=300)
        if bestseller_ids is None:
            bestseller_ids = results.get('order', [])
            cache.set(cache_key_order, bestseller_ids, timeout=300)

        recommended = list(ProductModel.objects.filter(id__in=recommended_ids))
        best_sellers = list(ProductModel.objects.filter(id__in=bestseller_ids))

        return Response({
            "status": "success",
            "category": {"id": category.id, "name": category.name},
            "data": {
                "new_arrivals": HomepageProductSerializer(new_arrivals, many=True).data,
                "popular": HomepageProductSerializer(popular, many=True).data,
                "recommended": HomepageProductSerializer(recommended, many=True).data,
                "best_sellers": HomepageProductSerializer(best_sellers, many=True).data,
            }
        }, status=200)

    @action(detail=False, methods=['get'], url_path='homepage')
    def homepage(self, request):
        """
        Endpoint: GET /api/products/homepage/?category=books
        """
        category_name = request.query_params.get('category', None)
        if not category_name:
            return Response({"status": "error", "message": "category is required"}, status=400)

        try:
            category = CategoryModel.objects.get(name__iexact=category_name)
        except CategoryModel.DoesNotExist:
            return Response({"status": "error", "message": "Category not found"}, status=404)

        # New arrivals: latest products in this category
        new_arrivals = ProductModel.objects.filter(category=category).order_by('-createdAt')[:10]
        # Popular: highest rating
        popular = ProductModel.objects.filter(category=category).order_by('-rating')[:10]
        # Best sellers: highest stock (for demo, real logic may use sales data)
        best_sellers = ProductModel.objects.filter(category=category).order_by('-stock')[:10]

        def product_brief(prod, status_label):
            return {
                "id": prod.id,
                "name": prod.name,
                "origin": prod.origin,
                "price": prod.price,
                "rating": prod.rating,
                "stocks": prod.stock,
                "imgUrl": prod.imgUrl,
                "status": status_label
            }

        data = {
            "new_arrivals": [product_brief(p, "NEW") for p in new_arrivals],
            "popular": [product_brief(p, "POPULAR") for p in popular],
            "best_sellers": [product_brief(p, "BEST_SELLER") for p in best_sellers],
        }

        return Response({
            "status": "success",
            "category": {
                "id": category.id,
                "name": category.name
            },
            "data": data
        }, status=200)


# Move ProductDetailAPIView to top-level for DRF import
class ProductDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint: GET /api/products/<slug:slug>/
    hoặc GET /api/products/<uuid:id>/
    Trả về chi tiết sản phẩm, bao gồm sản phẩm liên quan.
    """
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        product_id = kwargs.get('id')
        product = None
        if slug:
            product = GetProductDetailQuery.by_slug(slug)
        elif product_id:
            product = GetProductDetailQuery.by_id(product_id)
        else:
            return Response({"status": "error", "message": "Missing product identifier (slug or id)"}, status=400)

        # Tăng view count bất đồng bộ
        threading.Thread(target=self.increment_view_count, args=(product.id,)).start()

        # Lấy danh sách sản phẩm liên quan (gRPC + cache)
        cache_key = f"related_products_{product.id}"
        related_ids = cache.get(cache_key)
        if related_ids is None:
            try:
                stub = get_recommendation_stub()
                resp = stub.GetRelatedProducts(product_id=str(product.id))
                related_ids = list(resp.product_ids)
            except Exception:
                related_ids = list(ProductModel.objects.filter(category=product.category).exclude(id=product.id).values_list('id', flat=True)[:8])
            cache.set(cache_key, related_ids, timeout=600)

        related_products = ProductModel.objects.filter(id__in=related_ids)[:8]
        serializer = self.get_serializer(product, context={"related_products": related_products})
        return Response({"status": "success", "data": serializer.data})

    def increment_view_count(self, product_id):
        ProductModel.objects.filter(id=product_id).update(view_count=F('view_count') + 1)


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