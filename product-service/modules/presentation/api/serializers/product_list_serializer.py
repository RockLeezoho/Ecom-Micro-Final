from rest_framework import serializers

from modules.infrastructure.models.product_model import ProductModel
from modules.presentation.api.serializers.category_serializer import CategorySerializer


class ProductListSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField(allow_null=True, required=False)
    origin = serializers.CharField(allow_null=True, required=False)
    price = serializers.FloatField()
    import_price = serializers.FloatField(required=False)
    stock = serializers.IntegerField()
    rating = serializers.FloatField()
    status = serializers.CharField(required=False)
    view_count = serializers.IntegerField(required=False)
    category = CategorySerializer()
    brand = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    language = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    material = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(allow_null=True, required=False)
    updated_at = serializers.DateTimeField(allow_null=True, required=False)

    def get_brand(self, obj):
        brand = getattr(obj, 'brand', None)
        return getattr(brand, 'name', None) if brand else None

    def get_author(self, obj):
        author = getattr(obj, 'author', None)
        return getattr(author, 'name', None) if author else None

    def get_language(self, obj):
        return getattr(obj, 'language', None)

    def get_color(self, obj):
        return getattr(obj, 'color', None)

    def get_material(self, obj):
        return getattr(obj, 'material', None)

    def get_description(self, obj):
        return getattr(obj, 'description', None) or ''

    def get_avatar_url(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return getattr(avatar, 'image_url', None) if avatar else None

    def get_images(self, obj):
        images = getattr(obj, 'images', None)
        if not images:
            return []
        return [getattr(image, 'image_url', None) for image in images.all() if getattr(image, 'image_url', None)]
