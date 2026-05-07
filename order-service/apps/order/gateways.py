# order-service/apps/order/gateways.py
import requests
import os
from django.conf import settings
from typing import List, Dict, Any


class ProductServiceGateway:
    """Gateway để gọi Product Service APIs"""

    def __init__(self):
        self.base_url = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8003/api/v1')
        self.timeout = 10
        self.internal_token = os.getenv('PRODUCT_SERVICE_INTERNAL_TOKEN', '')

    def _headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.internal_token:
            headers['X-Service-Token'] = self.internal_token
        return headers

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
        payload = {
            "product_id": product_id,
            "order_id": order_id,
            "quantity": quantity,
            "reservation_duration_minutes": reservation_duration_minutes,
        }

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create stock reservation: {str(e)}")

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
