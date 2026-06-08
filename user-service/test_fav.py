import os
import django
import sys
import requests

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, Customer
from rest_framework_simplejwt.tokens import RefreshToken

customer, _ = Customer.objects.get_or_create(username="test_customer", email="test@customer.com", phone_number="1234567890")
token = str(RefreshToken.for_user(customer).access_token)

resp = requests.post(
    "http://127.0.0.1:8001/api/users/favorites/",
    json={"product_id": "b78190da-988e-4a00-9819-20a258da71f7"},
    headers={"Authorization": f"Bearer {token}"}
)
print("STATUS:", resp.status_code)
print("BODY:", resp.text)
