#!/usr/bin/env python3
"""
Automated Test Suite: Authentication & Product Update
Tests JWT auth fix by attempting staff/admin operations
"""
import requests
import json
import time
from typing import Optional, Dict, Any

# Configuration
API_GATEWAY_URL = "http://localhost:8080"
USER_SERVICE_URL = "http://localhost:8001"
PRODUCT_SERVICE_URL = "http://localhost:8003"

# Test users
STAFF_CREDENTIALS = {
    "username": "staff_user",
    "password": "staff_123"
}

ADMIN_CREDENTIALS = {
    "username": "admin_user",
    "password": "admin_123"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{text}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def test_service_health() -> bool:
    """Test if all services are healthy"""
    print_header("TEST 1: Service Health Check")
    
    services = [
        ("User Service", f"{USER_SERVICE_URL}/health/"),
        ("Product Service", f"{PRODUCT_SERVICE_URL}/api/health/"),
        ("API Gateway", f"{API_GATEWAY_URL}/health/"),
    ]
    
    all_healthy = True
    for service_name, url in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print_success(f"{service_name} is healthy")
            else:
                print_error(f"{service_name} returned {response.status_code}")
                all_healthy = False
        except Exception as e:
            print_error(f"{service_name} is not responding: {str(e)}")
            all_healthy = False
    
    return all_healthy

def create_test_users_if_needed() -> bool:
    """Create test staff and admin users if they don't exist"""
    print_header("TEST 2: Ensure Test Users Exist")
    
    try:
        # Attempt staff user creation
        print_info("Creating staff test user...")
        response = requests.post(
                f"{USER_SERVICE_URL}/api/users/auth/register/",
            json={
                "username": STAFF_CREDENTIALS["username"],
                "email": f"{STAFF_CREDENTIALS['username']}@test.com",
                "password": STAFF_CREDENTIALS["password"],
                "first_name": "Staff",
                "last_name": "User"
            },
            timeout=10
        )
        
        if response.status_code in [201, 400]:  # 400 means already exists
            print_success("Staff user ready")
        else:
            print_warning(f"Staff user creation got status {response.status_code}")
        
        return True
    except Exception as e:
        print_error(f"Error creating test users: {str(e)}")
        return False

def login_user(credentials: Dict[str, str], user_type: str) -> Optional[str]:
    """Login user and return JWT token"""
    print_info(f"Logging in {user_type}...")
    
    try:
            # Use correct endpoint
            endpoint = "/api/management/auth/login/staff" if user_type == "staff" else "/api/management/auth/login/admin"
        response = requests.post(
            f"{USER_SERVICE_URL}{endpoint}",
            json=credentials,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access") or data.get("token")
            if token:
                print_success(f"{user_type.capitalize()} logged in successfully")
                print_info(f"Token (first 50 chars): {token[:50]}...")
                return token
            else:
                print_error(f"Login response missing token: {data}")
                return None
        else:
            print_error(f"Login failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None

def get_products(limit: int = 5) -> Optional[list]:
    """Fetch first N products"""
    print_info("Fetching products...")
    
    try:
        response = requests.get(
            f"{PRODUCT_SERVICE_URL}/api/products/list/?page_size={limit}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("results", [])
            print_success(f"Fetched {len(products)} products")
            return products
        else:
            print_error(f"Failed to fetch products: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error fetching products: {str(e)}")
        return None

def test_admin_product_list_access(token: str) -> bool:
    """Test accessing admin product list with JWT token"""
    print_header("TEST 3: Admin Product List Access (without authentication)")
    
    try:
        response = requests.get(
            f"{PRODUCT_SERVICE_URL}/api/admin/products/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Admin product list accessible with staff token")
            return True
        elif response.status_code == 403:
            print_error(f"Still getting 403 Forbidden on admin list")
            print_info(f"Response: {response.json()}")
            return False
        else:
            print_warning(f"Got status {response.status_code} on admin list")
            return False
    except Exception as e:
        print_error(f"Error accessing admin product list: {str(e)}")
        return False

def test_product_update(product_id: str, token: str) -> bool:
    """Test updating a product with PATCH request"""
    print_header(f"TEST 4: Product Update (PATCH /api/admin/products/{product_id}/)")
    
    update_data = {
        "name": f"Updated Product - {int(time.time())}",
    }
    
    try:
        print_info(f"Sending PATCH to /api/admin/products/{product_id}/")
        print_info(f"Authorization: Bearer {token[:50]}...")
        
        response = requests.patch(
            f"{PRODUCT_SERVICE_URL}/api/admin/products/{product_id}/",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print_success("✓✓✓ PRODUCT UPDATE SUCCESSFUL! ✓✓✓")
            print_info(f"Updated product: {response.json() if response.text else 'No response body'}")
            return True
        elif response.status_code == 403:
            print_error(f"❌ STILL GETTING 403 FORBIDDEN")
            print_info(f"Response: {response.json()}")
            return False
        else:
            print_warning(f"Got unexpected status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error updating product: {str(e)}")
        return False

def test_via_api_gateway(product_id: str, token: str) -> bool:
    """Test product update via API Gateway"""
    print_header(f"TEST 5: Product Update via API Gateway")
    
    update_data = {
        "name": f"Updated via Gateway - {int(time.time())}",
    }
    
    try:
        print_info(f"Sending PATCH to gateway: {API_GATEWAY_URL}/api/products/admin/products/{product_id}/")
        
        response = requests.patch(
            f"{API_GATEWAY_URL}/api/products/admin/products/{product_id}/",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print_success("✓ PRODUCT UPDATE via GATEWAY SUCCESSFUL!")
            return True
        elif response.status_code == 403:
            print_error(f"❌ GOT 403 FORBIDDEN via gateway")
            print_info(f"Response: {response.json()}")
            return False
        else:
            print_warning(f"Got unexpected status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error updating via gateway: {str(e)}")
        return False

def main():
    """Run all tests"""
    print_header("AUTOMATED TEST SUITE: Authentication & Product Update")
    
    test_results = {}
    
    # Test 1: Service Health
    test_results["health_check"] = test_service_health()
    
    if not test_results["health_check"]:
        print_error("Services are not healthy. Cannot proceed.")
        return
    
    # Test 2: Create users
    test_results["create_users"] = create_test_users_if_needed()
    
    time.sleep(2)  # Wait for user service to be ready
    
    # Test 3: Login as staff
    print_header("TEST 3: Staff User Login")
    staff_token = login_user(STAFF_CREDENTIALS, "staff")
    test_results["staff_login"] = staff_token is not None
    
    if not staff_token:
        print_error("Could not login as staff user. Cannot continue.")
        return
    
    # Test 4: Fetch products
    print_header("TEST 4: Fetch Products")
    products = get_products(limit=1)
    test_results["fetch_products"] = products is not None and len(products) > 0
    
    if not products:
        print_error("Could not fetch any products. Cannot continue.")
        return
    
    product_id = products[0]["id"]
    print_success(f"Using product ID: {product_id}")
    
    # Test 5: Admin product list
    test_results["admin_list_access"] = test_admin_product_list_access(staff_token)
    
    # Test 6: Direct product update
    test_results["direct_product_update"] = test_product_update(product_id, staff_token)
    
    # Test 7: Gateway product update
    test_results["gateway_product_update"] = test_via_api_gateway(product_id, staff_token)
    
    # Summary
    print_header("TEST SUMMARY")
    print()
    
    for test_name, result in test_results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.RESET} - {test_name}")
    
    print()
    
    passed = sum(1 for r in test_results.values() if r)
    total = len(test_results)
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED! JWT authentication is working correctly.{Colors.RESET}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ {total - passed} test(s) failed. See details above.{Colors.RESET}")
    
    print()

if __name__ == "__main__":
    main()
