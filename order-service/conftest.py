# order-service/conftest.py
"""
Pytest configuration cho Order Service tests
"""
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def test_user():
    """Create a test user (customer)"""
    user = User.objects.create_user(
        username='testcustomer',
        email='customer@test.com',
        password='testpass123'
    )
    return user


@pytest.fixture
def test_staff_user():
    """Create a test staff user"""
    user = User.objects.create_user(
        username='teststaff',
        email='staff@test.com',
        password='testpass123'
    )
    user.is_staff = True
    user.save()
    return user


@pytest.fixture
def test_admin_user():
    """Create a test admin user"""
    user = User.objects.create_user(
        username='testadmin',
        email='admin@test.com',
        password='testpass123'
    )
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user
