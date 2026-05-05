from rest_framework import serializers
from modules.infrastructure.models.product_model import ProductModel

class HomepageProductSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductModel
        fields = ['id', 'name', 'avatar_url', 'origin', 'price', 'stock', 'rating', 'status']

    def get_avatar_url(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return avatar.image_url if avatar else None
