import cloudinary
import cloudinary.uploader
from django.conf import settings
from rest_framework import serializers
from django.db import transaction
from modules.infrastructure.models.product_model import ProductModel, BookModel, FashionModel, ElectronicModel
from modules.infrastructure.models.image_model import ProductImageModel
from modules.infrastructure.models.author_model import AuthorModel
from modules.infrastructure.models.publisher_model import PublisherModel
from modules.infrastructure.models.brand_model import BrandModel
from modules.infrastructure.models.category_model import CategoryModel
from django.utils.text import slugify

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImageModel
        fields = ['id', 'image_url', 'public_id', 'is_avatar', 'created_at']
        read_only_fields = ['id', 'image_url', 'public_id', 'created_at']

class CategoryRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            import uuid
            uuid.UUID(str(data))
            return super().to_internal_value(data)
        except ValueError:
            try:
                return self.get_queryset().get(slug=data)
            except self.get_queryset().model.DoesNotExist:
                raise serializers.ValidationError(f"Invalid pk or slug '{data}' - object does not exist.")

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False, read_only=True)
    category = CategoryRelatedField(queryset=CategoryModel.objects.all())

    class Meta:
        model = ProductModel
        fields = [
            'id', 'name', 'slug', 'origin', 'category', 'price', 'import_price', 'stock', 'rating', 'status', 'view_count',
            'created_at', 'updated_at', 'images'
        ]

    def validate(self, attrs):
        # Add custom validation if needed
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        images_data = self.context['request'].FILES.getlist('images')
        product = ProductModel.objects.create(**validated_data)
        product.slug = self.generate_unique_slug(product.name)
        product.save()
        self.handle_images(product, images_data)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        images_data = self.context['request'].FILES.getlist('images')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.slug = self.generate_unique_slug(instance.name, instance.id)
        instance.save()
        if images_data:
            instance.images.all().delete()
            self.handle_images(instance, images_data)
        return instance

    def handle_images(self, product, images_data):
        for idx, image in enumerate(images_data):
            try:
                res = cloudinary.uploader.upload(image, folder=f"products/{product.id}")
                ProductImageModel.objects.create(
                    product=product,
                    image_url=res['secure_url'],
                    public_id=res['public_id'],
                    is_avatar=(idx == 0)
                )
            except Exception as e:
                raise serializers.ValidationError({'images': f'Cloudinary upload failed: {str(e)}'})

    def generate_unique_slug(self, name, instance_id=None):
        base_slug = slugify(name)
        slug = base_slug
        num = 1
        while ProductModel.objects.filter(slug=slug).exclude(id=instance_id).exists():
            slug = f"{base_slug}-{num}"
            num += 1
        return slug
