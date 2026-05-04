from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from modules.infrastructure.models.category_model import CategoryModel
from ..serializers.category_serializer import CategorySerializer

class CategoryListAPIView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		categories = CategoryModel.objects.prefetch_related('children').filter(parent__isnull=True)
		serializer = CategorySerializer(categories, many=True)
		return Response({
			"status": "success",
			"data": serializer.data
		}, status=status.HTTP_200_OK)
