from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

from modules.application.ports.cache_gateway import CacheGateway
from modules.application.ports.order_gateway import OrderGateway
from modules.application.ports.product_catalog_repository import ProductCatalogRepository
from modules.application.ports.recommendation_gateway import RecommendationGateway
from modules.application.read_models.product_read_models import (
    CategoryReadModel,
    HomepageReadModel,
    ProductCardReadModel,
    ProductDetailReadModel,
    RelatedProductReadModel,
)
from modules.domain.entities.product import Product


class ProductService:
    HOMEPAGE_CACHE_TTL = 300
    RELATED_PRODUCTS_CACHE_TTL = 600

    def __init__(
        self,
        product_catalog_repository: ProductCatalogRepository,
        recommendation_gateway: RecommendationGateway,
        order_gateway: OrderGateway,
        cache_gateway: CacheGateway,
    ):
        self.product_catalog_repository = product_catalog_repository
        self.recommendation_gateway = recommendation_gateway
        self.order_gateway = order_gateway
        self.cache_gateway = cache_gateway

    def get_homepage_products(self, category_key: str) -> HomepageReadModel:
        category = self.product_catalog_repository.get_category(category_key)
        category_scope_ids = self.product_catalog_repository.get_category_scope_ids(category.id)
        new_arrivals = self.product_catalog_repository.get_new_arrivals(category, category_scope_ids=category_scope_ids)
        popular = self.product_catalog_repository.get_popular(category, category_scope_ids=category_scope_ids)
        recommendation_category_key = category.slug or category.name or category.id

        executor = ThreadPoolExecutor(max_workers=2)
        recommended_future = executor.submit(self._get_recommended_product_ids, recommendation_category_key)
        bestseller_future = executor.submit(self._get_best_seller_product_ids, category.id)
        try:
            recommended_ids = recommended_future.result(timeout=2)
        except FutureTimeoutError:
            recommended_ids = []
        try:
            bestseller_ids = bestseller_future.result(timeout=2)
        except FutureTimeoutError:
            bestseller_ids = []
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

        return HomepageReadModel(
            new_arrivals=[self._to_card_read_model(item) for item in new_arrivals],
            popular=[self._to_card_read_model(item) for item in popular],
            recommended=[self._to_card_read_model(item) for item in self.product_catalog_repository.get_products_by_ids(recommended_ids)],
            best_sellers=[self._to_card_read_model(item) for item in self.product_catalog_repository.get_products_by_ids(bestseller_ids)],
        )

    def get_product_detail(self, slug: str) -> ProductDetailReadModel:
        product = self.product_catalog_repository.get_product_by_slug(slug)
        related_products = self.get_related_products(product)
        self.product_catalog_repository.increment_view_count(product.id)
        return self._to_detail_read_model(product, related_products)

    def get_related_products(self, product: Product) -> list[RelatedProductReadModel]:
        cache_key = f"related_products_{product.id}"
        related_ids = self.cache_gateway.get(cache_key)
        if related_ids is None:
            related_ids = self.recommendation_gateway.get_related_product_ids(str(product.id))
            if not related_ids:
                related_ids = [item.id for item in self.product_catalog_repository.get_related_fallback_products(product)]
            self.cache_gateway.set(cache_key, related_ids, timeout=ProductService.RELATED_PRODUCTS_CACHE_TTL)

        return [self._to_related_read_model(item) for item in self.product_catalog_repository.get_products_by_ids(list(related_ids)[:8])]

    def _get_recommended_product_ids(self, category_id: str) -> list[str]:
        cache_key = f"ai_recommend_{category_id}"
        cached_ids = self.cache_gateway.get(cache_key)
        if cached_ids is not None:
            return cached_ids

        try:
            recommended_ids = self.recommendation_gateway.get_recommended_product_ids(str(category_id))
        except FutureTimeoutError:
            recommended_ids = []
        except Exception:
            recommended_ids = []

        self.cache_gateway.set(cache_key, recommended_ids, timeout=ProductService.HOMEPAGE_CACHE_TTL)
        return recommended_ids

    def _get_best_seller_product_ids(self, category_id: str) -> list[str]:
        cache_key = f"order_bestseller_{category_id}"
        cached_ids = self.cache_gateway.get(cache_key)
        if cached_ids is not None:
            return cached_ids

        try:
            bestseller_ids = self.order_gateway.get_best_seller_product_ids(str(category_id))
        except FutureTimeoutError:
            bestseller_ids = []
        except Exception:
            bestseller_ids = []

        self.cache_gateway.set(cache_key, bestseller_ids, timeout=ProductService.HOMEPAGE_CACHE_TTL)
        return bestseller_ids

    def _to_category_read_model(self, category) -> CategoryReadModel:
        return CategoryReadModel(
            id=str(category.id),
            name=category.name,
            slug=category.slug,
        )

    def _to_card_read_model(self, product: Product) -> ProductCardReadModel:
        return ProductCardReadModel(
            id=product.id,
            name=product.name,
            avatar_url=self._avatar_url(product),
            origin=str(product.origin),
            price=product.price,
            stock=product.stock,
            rating=product.rating,
            status=str(product.status),
        )

    def _to_related_read_model(self, product: Product) -> RelatedProductReadModel:
        return RelatedProductReadModel(
            id=product.id,
            name=product.name,
            slug=product.slug,
            price=product.price,
            rating=product.rating,
        )

    def _to_detail_read_model(self, product: Product, related_products: list[RelatedProductReadModel]) -> ProductDetailReadModel:
        category = product.category
        category_read_model = CategoryReadModel(
            id=str(category.id),
            name=category.name,
            slug=category.slug,
        )
        return ProductDetailReadModel(
            id=product.id,
            name=product.name,
            slug=product.slug,
            origin=str(product.origin),
            price=product.price,
            import_price=product.importPrice,
            stock=product.stock,
            rating=product.rating,
            status=str(product.status),
            view_count=product.viewCount,
            category=category_read_model,
            brand_name=getattr(product.brand, 'name', None),
            color=str(product.color) if product.color is not None else None,
            description=product.description,
            avatar_url=self._avatar_url(product),
            created_at=product.createdAt,
            updated_at=product.updatedAt,
            related_products=related_products,
        )

    def _avatar_url(self, product: Product):
        avatar = product.image
        if avatar is not None:
            return avatar.image_url
        if product.images:
            first_avatar = next((item for item in product.images if item.is_avatar), None)
            if first_avatar is not None:
                return first_avatar.image_url
            return product.images[0].image_url
        return None
