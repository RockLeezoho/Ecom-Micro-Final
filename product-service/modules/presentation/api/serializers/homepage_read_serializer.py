from rest_framework import serializers


class CategoryReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()


class ProductCardReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    avatar_url = serializers.CharField(allow_null=True, required=False)
    origin = serializers.CharField()
    price = serializers.FloatField()
    stock = serializers.IntegerField()
    rating = serializers.FloatField()
    status = serializers.CharField()


class HomepageReadSerializer(serializers.Serializer):
    category = CategoryReadSerializer()
    new_arrivals = ProductCardReadSerializer(many=True)
    popular = ProductCardReadSerializer(many=True)
    recommended = ProductCardReadSerializer(many=True)
    best_sellers = ProductCardReadSerializer(many=True)
