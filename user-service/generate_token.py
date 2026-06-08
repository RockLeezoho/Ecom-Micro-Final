import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, Customer
from rest_framework_simplejwt.tokens import RefreshToken
import uuid

# Create a test customer
customer, _ = Customer.objects.get_or_create(
    username="test_customer",
    email="test@customer.com",
    phone_number="1234567890",
)

# Generate token
refresh = RefreshToken.for_user(customer)
token = str(refresh.access_token)
print(f"TOKEN={token}")
