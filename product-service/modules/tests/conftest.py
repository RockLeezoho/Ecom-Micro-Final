# product-service/modules/tests/conftest.py
"""
Pytest configuration và fixtures cho Product Service tests
"""
import pytest
from django.contrib.auth.models import User
from modules.infrastructure.models.product_model import ProductModel
from modules.infrastructure.models.category_model import CategoryModel


@pytest.fixture
def test_user():
    """Create a test user"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    return user


@pytest.fixture
def test_category():
    """Create a test category"""
    category = CategoryModel.objects.create(
        name="Test Category",
        slug="test-category",
        description="Test category description",
    )
    return category


@pytest.fixture
def test_product(test_category):
    """Create a test product"""
    product = ProductModel.objects.create(
        name="Test Product",
        slug="test-product",
        category=test_category,
        origin="Vietnam",
        price=100.0,
        import_price=50.0,
        stock=100,
        rating=4.5,
    )
    return product


@pytest.fixture
def test_products(test_category):
    """Create multiple test products"""
    products = []
    for i in range(5):
        product = ProductModel.objects.create(
            name=f"Test Product {i}",
            slug=f"test-product-{i}",
            category=test_category,
            origin="Vietnam",
            price=100.0 * (i + 1),
            import_price=50.0 * (i + 1),
            stock=100 + (i * 10),
            rating=4.0 + (i * 0.1),
        )
        products.append(product)
    return products
