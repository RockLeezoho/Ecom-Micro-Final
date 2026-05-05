from rest_framework import serializers


class CategoryReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()


class RelatedProductReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField(allow_null=True, required=False)
    price = serializers.FloatField()
    rating = serializers.FloatField()


class ProductDetailReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField(allow_null=True, required=False)
    origin = serializers.CharField()
    price = serializers.FloatField()
    import_price = serializers.FloatField()
    stock = serializers.IntegerField()
    rating = serializers.FloatField()
    status = serializers.CharField()
    view_count = serializers.IntegerField()
    category = CategoryReadSerializer()
    brand_name = serializers.CharField(allow_null=True, required=False)
    color = serializers.CharField(allow_null=True, required=False)
    description = serializers.CharField(allow_null=True, required=False)
    avatar_url = serializers.CharField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(allow_null=True, required=False)
    updated_at = serializers.DateTimeField(allow_null=True, required=False)
    related_products = RelatedProductReadSerializer(many=True)
