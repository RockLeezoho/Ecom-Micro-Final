import pytest
from unittest.mock import Mock
from datetime import datetime

from modules.application.services.product_service import ProductService
from modules.domain.entities.product import Product
from modules.domain.entities.category import Category
from modules.domain.entities.brand import Brand
from modules.domain.entities.image import ProductImage


def make_product(pid: str, name: str, category: Category) -> Product:
    img = ProductImage(id=f"img-{pid}", product_id=pid, image_url=f"/images/{pid}.jpg", public_id=f"pub-{pid}", is_avatar=True, created_at=datetime.utcnow())
    brand = Brand(id="b1", name="BrandX")
    return Product(
        id=pid,
        name=name,
        origin="VIETNAM",
        price=10.0,
        importPrice=5.0,
        stock=100,
        rating=4.5,
        status="SELLING",
        viewCount=0,
        category=category,
        brand=brand,
        color=None,
        slug=f"{name}-slug",
        description="desc",
        image=img,
        images=[img],
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )


def test_get_homepage_products_returns_structured_read_model():
    # Arrange
    category = Category(id="c1", name="Cat", slug="cat")
    prod1 = make_product("p1", "Prod1", category)
    prod2 = make_product("p2", "Prod2", category)

    repo = Mock()
    repo.get_category.return_value = category
    repo.get_new_arrivals.return_value = [prod1]
    repo.get_popular.return_value = [prod2]
    repo.get_products_by_ids.side_effect = lambda ids: [prod1] if ids and ids[0].startswith('r') else [prod2]

    recommendation = Mock()
    recommendation.get_recommended_product_ids.return_value = ["r1", "r2"]

    order = Mock()
    order.get_best_seller_product_ids.return_value = ["b1"]

    cache = Mock()
    # simulate cache miss for both keys
    cache.get.return_value = None

    svc = ProductService(repo, recommendation, order, cache)

    # Act
    homepage = svc.get_homepage_products("cat")

    # Assert
    assert len(homepage.new_arrivals) == 1
    assert len(homepage.popular) == 1
    assert [item.id for item in homepage.recommended] == ["p1"]
    assert [item.id for item in homepage.best_sellers] == ["p2"]
    recommendation.get_recommended_product_ids.assert_called_once_with("cat")
    order.get_best_seller_product_ids.assert_called_once_with("c1")
    assert repo.get_products_by_ids.call_count == 2
    assert cache.set.call_count == 2


def test_homepage_best_sellers_and_recommended_use_separate_cache_keys():
    category = Category(id="c2", name="Cat2", slug="cat2")

    repo = Mock()
    repo.get_category.return_value = category
    repo.get_category_scope_ids.return_value = ["c2"]
    repo.get_new_arrivals.return_value = []
    repo.get_popular.return_value = []
    repo.get_products_by_ids.return_value = []

    recommendation = Mock()
    recommendation.get_recommended_product_ids.return_value = ["r1"]

    order = Mock()
    order.get_best_seller_product_ids.return_value = ["b1"]

    cache = Mock()
    cache.get.return_value = None

    svc = ProductService(repo, recommendation, order, cache)

    svc.get_homepage_products("cat2")

    assert cache.get.call_args_list[0].args[0] == "ai_recommend_cat2"
    assert cache.get.call_args_list[1].args[0] == "order_bestseller_c2"
    assert cache.set.call_args_list[0].args[0] == "ai_recommend_cat2"
    assert cache.set.call_args_list[1].args[0] == "order_bestseller_c2"


def test_get_product_detail_increments_view_and_returns_detail():
    # Arrange
    category = Category(id="c10", name="Books", slug="books")
    product = make_product("p10", "Book1", category)

    repo = Mock()
    repo.get_product_by_slug.return_value = product
    repo.get_related_fallback_products.return_value = [make_product("p11", "Fallback", category)]
    repo.get_products_by_ids.return_value = [make_product("p11", "Fallback", category)]

    recommendation = Mock()
    recommendation.get_related_product_ids.return_value = []

    order = Mock()

    cache = Mock()
    cache.get.return_value = None

    svc = ProductService(repo, recommendation, order, cache)

    # Act
    detail = svc.get_product_detail(product.slug)

    # Assert
    repo.increment_view_count.assert_called_once_with(product.id)
    assert detail.id == product.id
    assert detail.category.id == category.id
    assert detail.avatar_url is not None
