from __future__ import annotations

from typing import Protocol

from modules.domain.entities.category import Category
from modules.domain.entities.product import Product


class ProductCatalogRepository(Protocol):
    def get_category(self, category_key: str) -> Category:
        ...

    def get_category_scope_ids(self, category_id: str) -> list[str]:
        ...

    def get_product_by_slug(self, slug: str) -> Product:
        ...

    def get_product_by_id(self, product_id: str) -> Product:
        ...

    def get_new_arrivals(
        self,
        category: Category,
        limit: int = 10,
        category_scope_ids: list[str] | None = None,
    ) -> list[Product]:
        ...

    def get_popular(
        self,
        category: Category,
        limit: int = 10,
        category_scope_ids: list[str] | None = None,
    ) -> list[Product]:
        ...

    def get_products_by_ids(self, product_ids: list[str]) -> list[Product]:
        ...

    def get_related_fallback_products(self, product: Product, limit: int = 8) -> list[Product]:
        ...

    def increment_view_count(self, product_id: str) -> None:
        ...
