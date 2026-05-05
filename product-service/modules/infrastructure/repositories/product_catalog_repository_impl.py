from __future__ import annotations

from django.db.models import F

from modules.application.ports.product_catalog_repository import ProductCatalogRepository
from modules.domain.entities.brand import Brand
from modules.domain.entities.category import Category
from modules.domain.entities.image import ProductImage
from modules.domain.entities.product import Product, ProductStatus
from modules.infrastructure.models.category_model import CategoryModel
from modules.infrastructure.models.product_model import ProductModel


class ProductCatalogRepositoryImpl(ProductCatalogRepository):
    def get_category(self, category_key: str) -> Category:
        category = CategoryModel.objects.filter(name__iexact=category_key).first()
        if category is None:
            category = CategoryModel.objects.filter(slug__iexact=category_key).first()
        if category is None:
            raise CategoryModel.DoesNotExist(category_key)
        return self._to_category(category)

    def get_product_by_slug(self, slug: str) -> Product:
        model = ProductModel.objects.select_related('category', 'brand').prefetch_related('images').get(slug=slug)
        return self._to_entity(model)

    def get_product_by_id(self, product_id: str) -> Product:
        model = ProductModel.objects.select_related('category', 'brand').prefetch_related('images').get(id=product_id)
        return self._to_entity(model)

    def get_new_arrivals(self, category: Category, limit: int = 10) -> list[Product]:
        models = (
            ProductModel.objects.filter(category_id=category.id)
            .select_related('category', 'brand')
            .prefetch_related('images')
            .order_by('-created_at')[:limit]
        )
        return [self._to_entity(model) for model in models]

    def get_popular(self, category: Category, limit: int = 10) -> list[Product]:
        models = (
            ProductModel.objects.filter(category_id=category.id, rating__gte=4.8)
            .select_related('category', 'brand')
            .prefetch_related('images')
            .order_by('-rating')[:limit]
        )
        return [self._to_entity(model) for model in models]

    def get_products_by_ids(self, product_ids: list[str]) -> list[Product]:
        models = ProductModel.objects.filter(id__in=product_ids).select_related('category', 'brand').prefetch_related('images')
        return [self._to_entity(model) for model in models]

    def get_related_fallback_products(self, product: Product, limit: int = 8) -> list[Product]:
        models = (
            ProductModel.objects.filter(category_id=product.category.id)
            .exclude(id=product.id)
            .select_related('category', 'brand')
            .prefetch_related('images')
            .order_by('-rating')[:limit]
        )
        return [self._to_entity(model) for model in models]

    def increment_view_count(self, product_id: str) -> None:
        ProductModel.objects.filter(id=product_id).update(view_count=F('view_count') + 1)

    def _to_category(self, model: CategoryModel) -> Category:
        return Category(
            id=str(model.id),
            name=model.name,
            slug=model.slug,
            description=model.description,
            parent=None,
            children=[],
        )

    def _to_entity(self, model: ProductModel) -> Product:
        category = self._to_category(model.category) if model.category else None
        images = [
            ProductImage(
                id=str(img.id),
                product_id=str(model.id),
                image_url=img.image_url,
                public_id=img.public_id,
                is_avatar=img.is_avatar,
                created_at=img.created_at,
            )
            for img in model.images.all()
        ]
        brand = Brand(id=str(model.brand.id), name=model.brand.name) if model.brand else None
        return Product(
            id=str(model.id),
            name=model.name,
            origin=model.origin,
            category=category,
            price=model.price,
            importPrice=model.import_price,
            stock=model.stock,
            rating=model.rating,
            status=ProductStatus(model.status),
            viewCount=model.view_count,
            brand=brand,
            color=model.color,
            image=next((img for img in images if img.is_avatar), None),
            images=images,
            createdAt=model.created_at,
            updatedAt=model.updated_at,
            slug=model.slug,
        )
