from rest_framework.generics import ListAPIView, GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from modules.infrastructure.models.product_model import ProductModel, CategoryModel
from ..serializers.product_list_serializer import ProductListSerializer
from ..filters.product_filters import ProductFilter
from ..pagination import StandardResultsSetPagination

class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        category_slug = self.request.query_params.get('category')
        subcategory_slug = self.request.query_params.get('subcategory')
        if not category_slug and not subcategory_slug:
            return ProductModel.objects.all().select_related('brand', 'category').prefetch_related('images')

        target_slug = subcategory_slug or category_slug
        category = get_object_or_404(CategoryModel, slug=target_slug)

        category_ids = [category.id]
        stack = [category]
        while stack:
            node = stack.pop()
            children = list(node.children.all())
            category_ids.extend([child.id for child in children])
            stack.extend(children)

        return ProductModel.objects.filter(category_id__in=category_ids).select_related('brand', 'category').prefetch_related('images')

class ProductFilterMetaView(GenericAPIView):
    permission_classes = [AllowAny]
    def get(self, request):
        category_slug = request.query_params.get('category')
        if not category_slug:
            return Response({"error": "category is required"}, status=400)
        category = get_object_or_404(CategoryModel, slug=category_slug)
        qs = ProductModel.objects.filter(category=category)
        data = {
            "origins": list(qs.values_list('origin', flat=True).distinct()),
            "brands": list(qs.values_list('brand__name', flat=True).distinct()),
            "colors": list(qs.values_list('color', flat=True).distinct()),
            "price_min": qs.order_by('price').first().price if qs.exists() else None,
            "price_max": qs.order_by('-price').first().price if qs.exists() else None,
        }
        return Response(data)
