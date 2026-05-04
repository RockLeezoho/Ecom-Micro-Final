from rest_framework import serializers
from modules.infrastructure.models.product_model import ProductModel

class HomepageProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = ['id', 'name', 'imgUrl', 'origin', 'price', 'stock', 'rating', 'status']
