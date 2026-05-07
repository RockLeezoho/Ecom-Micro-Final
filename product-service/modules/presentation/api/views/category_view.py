from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from modules.application.services.category_service import CategoryService
from modules.infrastructure.repositories.category_repository_impl import CategoryRepositoryImpl
from ..serializers.category_read_serializer import (
    CategoryReadModelNestedSerializer,
    CategoryReadModelSerializer,
)

# DI: Instantiate service with concrete repository
category_service = CategoryService(
    category_repository=CategoryRepositoryImpl()
)


class CategoryListAPIView(APIView):
    """
    List categories endpoint.
    GET /api/categories/           → parent categories with nested children
    GET /api/categories/?all=true  → all categories (parent + children) flat
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        # Support ?all=true query param to get all categories flat
        all_categories = request.query_params.get('all', 'false').lower() == 'true'
        
        if all_categories:
            # Return flat list (all categories)
            categories_read = category_service.get_all_categories_flat()
            serializer = CategoryReadModelSerializer(categories_read, many=True)
        else:
            # Return nested structure (parent categories with children)
            categories_read = category_service.get_homepage_categories()
            serializer = CategoryReadModelNestedSerializer(categories_read, many=True)
        
        return Response({
            "status": "success",
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class CategoryAllFlatAPIView(APIView):
    """
    Get all categories (parent + children) in nested hierarchical structure.
    Endpoint: GET /api/categories/all/
    Response includes nested children array for each parent category.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        categories_read = category_service.get_all_categories_nested()
        serializer = CategoryReadModelNestedSerializer(categories_read, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
