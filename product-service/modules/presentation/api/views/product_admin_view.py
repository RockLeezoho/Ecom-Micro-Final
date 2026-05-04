from rest_framework import viewsets
from modules.infrastructure.models.product_model import ProductModel
from ..serializers.product_crud_serializer import ProductCreateUpdateSerializer
from ..permissions.is_staff_or_admin_user import IsStaffOrAdminUser


class ProductAdminViewSet(viewsets.ModelViewSet):
    queryset = ProductModel.objects.all().select_related('category').prefetch_related('images')
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsStaffOrAdminUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
