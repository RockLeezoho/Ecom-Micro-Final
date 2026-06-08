#!/usr/bin/env python3
import requests
import json
import time

API_GATEWAY_URL = "http://localhost:8080"
USER_SERVICE_URL = "http://localhost:8001"
PRODUCT_SERVICE_URL = "http://localhost:8003"
CART_SERVICE_URL = "http://localhost:8004"

USER_CREDENTIALS = {
    "username": "customer1",
    "password": "customer123"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BLUE = '\033[94m'

def print_msg(color, text):
    print(f"{color}{text}{Colors.RESET}")

def register_user_if_needed():
    print_msg(Colors.BLUE, "Ensuring user exists...")
    try:
        res = requests.post(
            f"{USER_SERVICE_URL}/api/users/auth/register/",
            json={
                "username": USER_CREDENTIALS["username"],
                "email": f"{USER_CREDENTIALS['username']}@test.com",
                "password": USER_CREDENTIALS["password"],
                "first_name": "Test",
                "last_name": "Customer",
                "phone_number": "0123456789"
            }
        )
        if res.status_code in [201, 400, 409]:
            print_msg(Colors.GREEN, "User is ready.")
            return True
        else:
            print_msg(Colors.RED, f"Registration failed: {res.text}")
    except Exception as e:
        print_msg(Colors.RED, f"Error creating user: {e}")
    return False

def login():
    print_msg(Colors.BLUE, "Logging in...")
    try:
        res = requests.post(
            f"{USER_SERVICE_URL}/api/users/auth/login/customer/",
            json=USER_CREDENTIALS
        )
        if res.status_code == 200:
            data = res.json().get("data", {})
            token = data.get("access_token")
            if token:
                print_msg(Colors.GREEN, "Logged in.")
                return token
            else:
                print_msg(Colors.RED, "Login successful but no token found in response.")
        else:
            print_msg(Colors.RED, f"Login failed: {res.text}")
    except Exception as e:
        print_msg(Colors.RED, f"Login error: {e}")
    return None

def get_product():
    print_msg(Colors.BLUE, "Fetching products...")
    try:
        res = requests.get(f"{PRODUCT_SERVICE_URL}/api/products/list/?page_size=1")
        if res.status_code == 200:
            results = res.json().get("results", [])
            if results:
                print_msg(Colors.GREEN, f"Got product: {results[0]['id']}")
                return results[0]
    except Exception as e:
        print_msg(Colors.RED, f"Error fetching product: {e}")
    return None

def add_to_cart(token, product_id, sales_price):
    print_msg(Colors.BLUE, f"Adding product {product_id} to cart (price: {sales_price})...")
    try:
        res = requests.post(
            f"{API_GATEWAY_URL}/api/cart/add/",
            json={
                "product_id": product_id,
                "sales_price": str(sales_price),
                "quantity": 1
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        if res.status_code == 201:
            print_msg(Colors.GREEN, "Added to cart successfully!")
            return True
        else:
            print_msg(Colors.RED, f"Failed to add to cart: {res.status_code} - {res.text}")
    except Exception as e:
        print_msg(Colors.RED, f"Error adding to cart: {e}")
    return False

def view_cart(token):
    print_msg(Colors.BLUE, "Viewing cart...")
    try:
        res = requests.get(
            f"{API_GATEWAY_URL}/api/cart/",
            headers={"Authorization": f"Bearer {token}"}
        )
        if res.status_code == 200:
            print_msg(Colors.GREEN, f"Cart contents: {json.dumps(res.json(), indent=2)}")
            return True
        else:
            print_msg(Colors.RED, f"Failed to view cart: {res.status_code} - {res.text}")
    except Exception as e:
        print_msg(Colors.RED, f"Error viewing cart: {e}")
    return False

def main():
    if not register_user_if_needed(): return
    token = login()
    if not token: return
    
    product = get_product()
    if not product:
        print_msg(Colors.RED, "No product found.")
        return
        
    if add_to_cart(token, product["id"], product["price"]):
        view_cart(token)

if __name__ == "__main__":
    main()
