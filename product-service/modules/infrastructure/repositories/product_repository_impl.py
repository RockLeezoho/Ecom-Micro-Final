from typing import List, Optional
from modules.domain.repositories.product_repository import ProductRepository
from modules.domain.entities.product import Product, Book, Fashion, Electronic
from modules.domain.entities.image import ProductImage
from modules.domain.entities.category import Category
from modules.infrastructure.models.product_model import ProductModel, BookModel, FashionModel, ElectronicModel
from modules.infrastructure.models.image_model import ProductImageModel
from modules.infrastructure.models.category_model import CategoryModel
from django.db import transaction

class ProductRepositoryImpl(ProductRepository):
    def get_by_id(self, product_id: str) -> Optional[Product]:
        try:
            model = ProductModel.objects.select_related('category').prefetch_related('images').get(id=product_id)
            return self._to_entity(model)
        except ProductModel.DoesNotExist:
            return None

    def list(self, *, category_id: Optional[str] = None) -> List[Product]:
        qs = ProductModel.objects.all().select_related('category').prefetch_related('images')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return [self._to_entity(obj) for obj in qs]

    @transaction.atomic
    def create(self, product: Product) -> Product:
        # Mapping entity -> model (simplified, real impl should handle all fields)
        model = ProductModel.objects.create(
            name=product.name,
            slug=product.slug,
            category_id=product.category.id,
            origin=product.origin.value,
            price=product.price,
            import_price=product.importPrice,
            stock=product.stock,
            rating=product.rating,
            status=product.status.value,
            view_count=product.view_count
        )
        # Images
        for img in product.images:
            ProductImageModel.objects.create(
                product=model,
                image_url=img.image_url,
                public_id=img.public_id,
                is_avatar=img.is_avatar
            )
        return self._to_entity(model)

    @transaction.atomic
    def update(self, product: Product) -> Product:
        model = ProductModel.objects.get(id=product.id)
        model.name = product.name
        model.slug = product.slug
        model.category_id = product.category.id
        model.origin = product.origin.value
        model.price = product.price
        model.import_price = product.importPrice
        model.stock = product.stock
        model.rating = product.rating
        model.status = product.status.value
        model.view_count = product.view_count
        model.save()
        # Update images (simple: delete all, re-add)
        model.images.all().delete()
        for img in product.images:
            ProductImageModel.objects.create(
                product=model,
                image_url=img.image_url,
                public_id=img.public_id,
                is_avatar=img.is_avatar
            )
        return self._to_entity(model)

    @transaction.atomic
    def delete(self, product_id: str) -> None:
        ProductModel.objects.filter(id=product_id).delete()

    def _to_entity(self, model: ProductModel) -> Product:
        # Map model -> entity (simplified, extend for Book/Fashion/Electronic)
        category = Category(
            id=str(model.category.id),
            name=model.category.name,
            description=model.category.description
        ) if model.category else None
        images = [ProductImage(
            id=str(img.id),
            product_id=str(model.id),
            image_url=img.image_url,
            public_id=img.public_id,
            is_avatar=img.is_avatar,
            created_at=img.created_at
        ) for img in model.images.all()]
        return Product(
            id=str(model.id),
            name=model.name,
            origin=model.origin,
            category=category,
            price=model.price,
            importPrice=model.import_price,
            stock=model.stock,
            rating=model.rating,
            status=model.status,
            view_count=model.view_count,
            image=next((img for img in images if img.is_avatar), None),
            images=images,
            createdAt=model.created_at,
            updatedAt=model.updated_at
        )
