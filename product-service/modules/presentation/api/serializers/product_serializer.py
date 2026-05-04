from rest_framework import serializers

from modules.infrastructure.models.product_model import ProductModel


class ProductBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = [
            "id",
            "name",
            "slug",
            "origin",
            "category",
            "price",
            "import_price",
            "stock",
            "rating",
            "status",
            "view_count",
            "created_at",
            "updated_at",
        ]


class ProductDetailSerializer(ProductBaseSerializer):
    category = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()

    class Meta(ProductBaseSerializer.Meta):
        fields = ProductBaseSerializer.Meta.fields + ["related_products"]

    def get_category(self, obj):
        category = obj.category
        if not category:
            return None
        return {"id": str(category.id), "name": category.name, "slug": category.slug}

    def get_related_products(self, obj):
        related_products = self.context.get("related_products", [])
        return [
            {"id": str(item.id), "name": item.name, "slug": item.slug, "price": item.price, "rating": item.rating}
            for item in related_products
        ]


class ProductPolymorphicSerializer(ProductBaseSerializer):
    pass