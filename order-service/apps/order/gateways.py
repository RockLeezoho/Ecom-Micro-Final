# order-service/apps/order/gateways.py
import requests
import os
import json
from django.conf import settings
from typing import List, Dict, Any


class ProductServiceGateway:
    """Gateway để gọi Product Service APIs"""

    def __init__(self):
        # Product service mounts its API at /api/ (not /api/v1)
        self.base_url = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8003/api')
        self.timeout = 10
        self.internal_token = os.getenv('PRODUCT_SERVICE_INTERNAL_TOKEN', '')

    def _headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.internal_token:
            headers['X-Service-Token'] = self.internal_token
        return headers

    def get_product_snapshot(self, product_id: str) -> Dict[str, Any]:
        """Lấy snapshot tối thiểu của product để lưu vào order item.

        Behavior:
        - Calls /products/{product_id}/ and returns the parsed payload (handles wrappers)
        - If the returned payload does not include a nested `category` with `slug`,
          attempts to resolve the slug by calling the product service categories endpoint
          (`/categories/?all=true`) and mapping `category_id` -> `slug`.
        - Caches the category map on the gateway instance to avoid repeated calls.
        """
        url = f"{self.base_url}/products/{product_id}/"
        try:
            response = requests.get(url, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict) and isinstance(payload.get('data'), dict):
                data = payload['data']
            elif isinstance(payload, dict):
                data = payload
            else:
                data = {}

            # If category is missing or doesn't include slug, try to fill it from categories endpoint
            category = data.get('category')
            category_slug = None
            category_id = None

            if isinstance(category, dict):
                category_id = category.get('id')
                category_slug = category.get('slug')
            else:
                # category might be a raw id or missing
                category_id = data.get('category') or data.get('category_id') or None

            # Normalize to string if present
            if category_id is not None:
                category_id = str(category_id)

            if not category_slug and category_id:
                # lazy-load category map
                if not hasattr(self, '_category_map') or self._category_map is None:
                    try:
                        cat_url = f"{self.base_url}/categories/?all=true"
                        resp = requests.get(cat_url, headers=self._headers(), timeout=self.timeout)
                        resp.raise_for_status()
                        cat_payload = resp.json()
                        cat_list = None
                        if isinstance(cat_payload, dict) and isinstance(cat_payload.get('data'), list):
                            cat_list = cat_payload['data']
                        elif isinstance(cat_payload, list):
                            cat_list = cat_payload
                        else:
                            cat_list = []
                        # build map id -> slug
                        self._category_map = {str(c.get('id')): c.get('slug') for c in cat_list if c.get('id')}
                    except requests.exceptions.RequestException:
                        self._category_map = {}

                category_slug = self._category_map.get(category_id)

            # inject normalized category object and category_slug for consumers
            if category_id or category_slug:
                data['category'] = {'id': category_id, 'slug': category_slug}
                # also set category_slug top-level key for backward compatibility
                data['category_slug'] = category_slug

            return data
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get product snapshot: {str(e)}")

    def create_stock_reservation(
        self,
        product_id: str,
        order_id: str,
        quantity: int,
        reservation_duration_minutes: int = 15,
    ) -> Dict[str, Any]:
        """
        Tạo stock reservation trên Product Service
        
        Returns:
            {
                "reservation_id": "uuid",
                "product_id": "uuid",
                "order_id": "uuid",
                "quantity": 5,
                "expires_at": "datetime",
                "status": "ACTIVE"
            }
        """
        url = f"{self.base_url}/products/reservations/"
        # Ensure all fields are JSON-serializable (UUIDs -> str, ints)
        payload = {
            "product_id": str(product_id) if product_id is not None else None,
            "order_id": str(order_id) if order_id is not None else None,
            "quantity": int(quantity),
            "reservation_duration_minutes": int(reservation_duration_minutes),
        }

        try:
            # defensive check: attempt to serialize payload to surface type errors early
            try:
                _ = json.dumps(payload)
            except TypeError as te:
                raise Exception(f"Payload contains non-serializable types: {te} | payload={repr(payload)}")

            response = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
            if response.status_code >= 400:
                # include response body to aid debugging (non-sensitive)
                body = response.text[:1000]
                raise Exception(f"Failed to create stock reservation: {response.status_code} {response.reason} | body={body} | payload={repr(payload)}")
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create stock reservation: {str(e)} | payload={repr(payload)}")

    def release_stock_reservation(
        self,
        reservation_id: str,
        reason: str = "Order cancelled",
    ) -> Dict[str, Any]:
        """
        Hủy stock reservation trên Product Service
        
        Returns:
            {
                "reservation_id": "uuid",
                "status": "RELEASED",
                "released_at": "datetime"
            }
        """
        url = f"{self.base_url}/products/reservations/{reservation_id}/"
        payload = {"reason": reason}

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to release stock reservation: {str(e)}")

    def get_reservations_by_order(self, order_id: str) -> List[Dict[str, Any]]:
        """Lấy tất cả reservations của 1 đơn hàng"""
        url = f"{self.base_url}/products/reservations/list/"
        params = {"order_id": order_id}

        try:
            response = requests.get(url, params=params, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get reservations: {str(e)}")

    def confirm_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """
        Xác nhận stock reservation (khi order thanh toán thành công)
        
        Returns:
            {
                "reservation_id": "uuid",
                "status": "CONFIRMED"
            }
        """
        url = f"{self.base_url}/products/reservations/{reservation_id}/confirm/"
        
        try:
            response = requests.post(url, json={}, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to confirm stock reservation: {str(e)}")


class PaymentServiceGateway:
    """Gateway để gọi Payment Service APIs"""

    def __init__(self):
        self.base_url = os.getenv('PAYMENT_SERVICE_URL', 'http://payment-service:8006/api/payments')
        self.timeout = 10
        self.return_url = os.getenv('PAYMENT_RETURN_URL', 'http://localhost:3000/payment')

    def _provider_from_method(self, payment_method: str) -> str:
        normalized = str(payment_method).upper()
        if normalized == 'BANK_TRANSFER':
            return 'bank'
        if normalized == 'CREDIT_CARD':
            return 'vnpay'
        if normalized == 'E_WALLET':
            return 'momo'
        return ''

    def create_payment(self, order_id: str, user_id: str, amount: float, payment_method: str) -> Dict[str, Any] | None:
        if str(payment_method).upper() == 'COD':
            return None

        url = f"{self.base_url}/create/"
        payload = {
            'order_id': order_id,
            'user_id': user_id,
            'amount': amount,
            'currency': 'VND',
            'payment_method': payment_method,
            'provider': self._provider_from_method(payment_method),
            'description': f'Payment for order {order_id}',
            'return_url': self.return_url,
        }
        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create payment: {str(e)}")
