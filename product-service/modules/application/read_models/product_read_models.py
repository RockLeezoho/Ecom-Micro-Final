from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class CategoryReadModel:
    id: str
    name: str
    slug: str


@dataclass(frozen=True)
class ProductCardReadModel:
    id: str
    name: str
    avatar_url: Optional[str]
    origin: str
    price: float
    stock: int
    rating: float
    status: str


@dataclass(frozen=True)
class RelatedProductReadModel:
    id: str
    name: str
    slug: Optional[str]
    price: float
    rating: float


@dataclass(frozen=True)
class ProductDetailReadModel:
    id: str
    name: str
    slug: Optional[str]
    origin: str
    price: float
    import_price: float
    stock: int
    rating: float
    status: str
    view_count: int
    category: CategoryReadModel
    brand_name: Optional[str]
    color: Optional[str]
    description: Optional[str]
    avatar_url: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    related_products: list[RelatedProductReadModel] = field(default_factory=list)


@dataclass(frozen=True)
class HomepageReadModel:
    category: CategoryReadModel
    new_arrivals: list[ProductCardReadModel]
    popular: list[ProductCardReadModel]
    recommended: list[ProductCardReadModel]
    best_sellers: list[ProductCardReadModel]
