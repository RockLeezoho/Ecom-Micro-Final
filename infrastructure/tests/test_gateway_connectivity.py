import json
import os
import unittest
from urllib import error, request


API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8080").rstrip("/")


class GatewayConnectivityTest(unittest.TestCase):
    def _request(self, method: str, path: str, body: dict | None = None) -> tuple[int, str]:
        url = f"{API_GATEWAY_URL}{path}"
        data = None
        headers = {}

        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = request.Request(url=url, data=data, method=method, headers=headers)

        try:
            with request.urlopen(req, timeout=20) as resp:
                payload = resp.read().decode("utf-8", errors="replace")
                return resp.getcode(), payload
        except error.HTTPError as exc:
            payload = exc.read().decode("utf-8", errors="replace")
            return exc.code, payload

    def _assert_status_in(self, method: str, path: str, allowed: set[int], body: dict | None = None):
        status, payload = self._request(method, path, body=body)
        self.assertIn(
            status,
            allowed,
            msg=f"{method} {path} failed with status={status}, response={payload}",
        )

    def test_frontend_gateway_contract_sequence(self):
        endpoint_steps: list[tuple[str, str, str, set[int], dict | None]] = [
            # 1) User service endpoints used by frontend services
            ("user-health", "GET", "/api/users/health/", {200}, None),
            (
                "user-login-customer",
                "POST",
                "/api/users/auth/login/customer/",
                {200, 400, 401, 403},
                {"username": "connectivity-check", "password": "invalid"},
            ),
            ("user-register", "POST", "/api/users/auth/register/", {200, 201, 400, 409}, {"username": "x", "email": "x@x.com", "password": "x", "phone_number": "0123"}),
            ("user-profile", "GET", "/api/users/me/customer/", {200, 401, 403}, None),
            ("user-addresses", "GET", "/api/users/addresses/", {200, 401, 403}, None),
            ("user-favorites", "GET", "/api/users/favorites/", {200, 401, 403}, None),
            ("user-staff-list", "GET", "/api/users/staffs/", {200, 401, 403}, None),
            ("user-customer-list", "GET", "/api/users/customers/", {200, 401, 403}, None),
            # 2) Product service endpoints
            ("product-health", "GET", "/api/products/health/", {200}, None),
            ("product-list", "GET", "/api/products/", {200}, None),
            ("product-search", "GET", "/api/products/?search=book", {200}, None),
            ("product-admin-list", "GET", "/api/products/admin/products/", {200, 401, 403}, None),
            # 3) Cart service endpoints
            ("cart-health", "GET", "/api/cart/health/", {200}, None),
            ("cart-list", "GET", "/api/cart/", {200, 401, 403}, None),
            ("cart-add", "POST", "/api/cart/add/", {200, 201, 400, 401, 403}, {"product_id": "00000000-0000-0000-0000-000000000000", "sales_price": 1000, "quantity": 1}),
            # 4) Order service endpoints
            ("order-health", "GET", "/api/orders/health/", {200}, None),
            ("order-list", "GET", "/api/orders/", {200, 401, 403}, None),
            ("order-create", "POST", "/api/orders/", {200, 201, 400, 401, 403}, {"address_id": "00000000-0000-0000-0000-000000000000", "payment_method": "COD", "shipping_method": "STANDARD", "items": []}),
            # 5) Payment service endpoints
            ("payment-health", "GET", "/api/payments/health/", {200}, None),
            ("payment-methods", "GET", "/api/payments/methods/", {200, 401, 403}, None),
            # 6) Shipping service endpoints
            ("shipping-health", "GET", "/api/shipping/health/", {200}, None),
            ("shipping-methods", "GET", "/api/shipping/methods/", {200, 401, 403}, None),
            # 7) AI service endpoints
            ("ai-health", "GET", "/api/ai/health/", {200}, None),
            (
                "ai-recommend",
                "POST",
                "/api/ai/recommend",
                {200},
                {"user_id": "connectivity-check", "history_prods": [], "history_acts": [], "user_query": "stationery"},
            ),
            ("ai-chat", "POST", "/api/ai/chat", {200}, {"user_query": "hello"}),
        ]

        for _, method, path, allowed, body in endpoint_steps:
            self._assert_status_in(method, path, allowed, body=body)


if __name__ == "__main__":
    unittest.main()
