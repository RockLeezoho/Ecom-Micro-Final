from rest_framework import serializers
from modules.infrastructure.models.product_model import ProductModel
from modules.presentation.api.serializers.category_serializer import CategorySerializer

class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = [
            'id', 'name', 'category', 'brand', 'author', 'origin', 'price', 'rating',
            'language', 'color', 'material'
        ]
        avatar = serializers.SerializerMethodField()
        images = serializers.SerializerMethodField()
        category = CategorySerializer()

        class Meta:
            model = ProductModel
            fields = (
                'id', 'name', 'slug', 'price', 'discount_price', 'inventory',
                'avatar', 'images', 'category', 'brand', 'publisher', 'author',
                'created_at', 'updated_at',
            )

        def get_avatar(self, obj):
            avatar = obj.images.filter(is_avatar=True).first()
            return avatar.image_url if avatar else None

        def get_images(self, obj):
            return [img.image_url for img in obj.images.all()]
