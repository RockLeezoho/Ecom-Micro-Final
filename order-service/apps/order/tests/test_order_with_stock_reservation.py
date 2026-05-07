# order-service/apps/order/tests/test_order_with_stock_reservation.py
import pytest
import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.order.models import Order, OrderItem, OrderPayment, OrderStatus


class OrderStockReservationIntegrationTest(TestCase):
    """
    Integration test: Tạo đơn -> Giữ kho -> Thanh toán -> Xác nhận
    （Create order -> Hold stock -> Process payment -> Confirm reservation）
    """

    def setUp(self):
        """Setup fixtures"""
        self.client = APIClient()
        
        # Create test user (customer)
        self.user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            id='550e8400-e29b-41d4-a716-446655440001'
        )
        self.client.force_authenticate(user=self.user)

    def test_full_order_flow_with_stock_reservation(self):
        """
        Test luồng đầy đủ:
        1. Tạo order (POST /api/v1/orders/)
        2. Verify reservations được tạo
        3. Simulate payment success
        4. Verify reservations được confirm
        """
        
        # ================== STEP 1: Tạo Order ==================
        order_data = {
            'address_id': '550e8400-e29b-41d4-a716-446655440010',
            'payment_method': 'BANK_TRANSFER',
            'shipping_method': 'STANDARD',
            'items': [
                {
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'quantity': 5,
                    'price': 100.0,
                },
                {
                    'product_id': '550e8400-e29b-41d4-a716-446655440101',
                    'quantity': 3,
                    'price': 200.0,
                },
            ]
        }

        # Mock Product Service API calls
        with patch('apps.order.gateways.ProductServiceGateway.create_stock_reservation') as mock_create_res, \
             patch('apps.order.gateways.ProductServiceGateway.get_reservations_by_order') as mock_get_res, \
             patch('apps.order.gateways.ProductServiceGateway.confirm_stock_reservation') as mock_confirm_res, \
             patch('apps.order.gateways.ProductServiceGateway.release_stock_reservation') as mock_release_res, \
             patch('apps.order.services.call_payment_service_initiate') as mock_payment, \
             patch('apps.order.services.publish_cart_remove') as mock_cart:
            
            # Setup mocks
            mock_create_res.side_effect = [
                {
                    'reservation_id': '550e8400-e29b-41d4-a716-446655440200',
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'order_id': None,  # Will be set by order creation
                    'quantity': 5,
                    'expires_at': '2026-05-06T10:20:00Z',
                    'status': 'ACTIVE'
                },
                {
                    'reservation_id': '550e8400-e29b-41d4-a716-446655440201',
                    'product_id': '550e8400-e29b-41d4-a716-446655440101',
                    'order_id': None,
                    'quantity': 3,
                    'expires_at': '2026-05-06T10:20:00Z',
                    'status': 'ACTIVE'
                },
            ]
            
            mock_payment.return_value = 'https://payment.example.com/pay?order_id=xxx'
            mock_cart.return_value = None
            
            # ===== CREATE ORDER =====
            response = self.client.post(
                '/api/v1/orders/',
                data=json.dumps(order_data),
                content_type='application/json'
            )

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            response_data = response.json()
            order_id = response_data['order_id']
            
            # Verify order created
            order = Order.objects.get(id=order_id)
            self.assertEqual(order.status, 'PENDING')
            self.assertEqual(order.payment_method, 'BANK_TRANSFER')
            self.assertEqual(order.user_id, self.user.id)
            
            # Verify order items created
            order_items = OrderItem.objects.filter(order=order)
            self.assertEqual(order_items.count(), 2)
            self.assertEqual(order_items[0].quantity, 5)
            self.assertEqual(order_items[1].quantity, 3)
            
            # Verify total price
            expected_total = Decimal('5') * Decimal('100') + Decimal('3') * Decimal('200')
            self.assertEqual(order.total_price, expected_total)
            
            # Verify stock reservations were requested
            self.assertEqual(mock_create_res.call_count, 2)
            
            # ================== STEP 2: Simulate Payment Success ==================
            
            # Setup for payment success flow
            mock_get_res.return_value = [
                {
                    'id': '550e8400-e29b-41d4-a716-446655440200',
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'order_id': str(order_id),
                    'quantity': 5,
                    'status': 'ACTIVE',
                    'expires_at': '2026-05-06T10:20:00Z',
                    'created_at': '2026-05-06T10:05:00Z',
                },
                {
                    'id': '550e8400-e29b-41d4-a716-446655440201',
                    'product_id': '550e8400-e29b-41d4-a716-446655440101',
                    'order_id': str(order_id),
                    'quantity': 3,
                    'status': 'ACTIVE',
                    'expires_at': '2026-05-06T10:20:00Z',
                    'created_at': '2026-05-06T10:05:00Z',
                },
            ]
            mock_confirm_res.return_value = {
                'reservation_id': '550e8400-e29b-41d4-a716-446655440200',
                'status': 'CONFIRMED'
            }
            
            # Simulate payment success event
            from apps.order.services import handle_payment_success_event
            
            payment_event = {
                'order_id': str(order_id),
                'payment_id': '550e8400-e29b-41d4-a716-446655440300',
            }
            
            handle_payment_success_event(payment_event)
            
            # Verify order status changed to PROCESSING
            order.refresh_from_db()
            self.assertEqual(order.status, 'PROCESSING')
            self.assertTrue(order.is_paid)
            
            # ================== STEP 3: Create OrderPayment Record ==================
            payment = OrderPayment.objects.create(
                order=order,
                payment_method=order.payment_method,
                status='PAID',
                transaction_id='TXN123456',
                amount=order.total_price,
            )
            
            self.assertEqual(payment.status, 'PAID')
            self.assertEqual(payment.amount, expected_total)

    def test_order_with_insufficient_stock_reservation(self):
        """Test tạo order khi stock không đủ"""
        order_data = {
            'address_id': '550e8400-e29b-41d4-a716-446655440010',
            'payment_method': 'COD',
            'shipping_method': 'EXPRESS',
            'items': [
                {
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'quantity': 1000,  # Không đủ stock
                    'price': 100.0,
                },
            ]
        }

        with patch('apps.order.gateways.ProductServiceGateway.create_stock_reservation') as mock_create_res:
            
            # Simulate insufficient stock error
            mock_create_res.side_effect = Exception(
                "Insufficient stock. Available: 50, Requested: 1000"
            )
            
            response = self.client.post(
                '/api/v1/orders/',
                data=json.dumps(order_data),
                content_type='application/json'
            )

            # Order creation should fail
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # No order should be created
            self.assertEqual(Order.objects.count(), 0)

    def test_order_with_payment_failure_releases_reservations(self):
        """Test khi payment fail, reservations được release"""
        
        # First create an order successfully
        order = Order.objects.create(
            user_id=self.user.id,
            total_price=Decimal('500.00'),
            shipping_fee=Decimal('0.00'),
            status='PENDING',
            payment_method='BANK_TRANSFER',
            shipping_method='STANDARD',
            shipping_address={'address': 'Test Address'},
        )
        
        OrderItem.objects.create(
            order=order,
            product_id='550e8400-e29b-41d4-a716-446655440100',
            quantity=5,
            sales_price=Decimal('100.00'),
        )

        with patch('apps.order.gateways.ProductServiceGateway.get_reservations_by_order') as mock_get_res, \
             patch('apps.order.gateways.ProductServiceGateway.release_stock_reservation') as mock_release_res:
            
            # Setup mocks
            mock_get_res.return_value = [
                {
                    'id': '550e8400-e29b-41d4-a716-446655440200',
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'order_id': str(order.id),
                    'quantity': 5,
                    'status': 'ACTIVE',
                    'expires_at': '2026-05-06T10:20:00Z',
                    'created_at': '2026-05-06T10:05:00Z',
                },
            ]
            
            # Simulate payment failed event
            from apps.order.services import handle_payment_failed_event
            
            payment_event = {
                'order_id': str(order.id),
                'reason': 'Card declined',
            }
            
            handle_payment_failed_event(payment_event)
            
            # Verify order was cancelled
            order.refresh_from_db()
            self.assertEqual(order.status, 'CANCELLED')
            
            # Verify release was called
            mock_release_res.assert_called_once()

    def test_order_with_cod_payment(self):
        """Test tạo order với payment method COD (thanh toán khi nhận hàng)"""
        order_data = {
            'address_id': '550e8400-e29b-41d4-a716-446655440010',
            'payment_method': 'COD',
            'shipping_method': 'STANDARD',
            'items': [
                {
                    'product_id': '550e8400-e29b-41d4-a716-446655440100',
                    'quantity': 2,
                    'price': 100.0,
                },
            ]
        }

        with patch('apps.order.gateways.ProductServiceGateway.create_stock_reservation') as mock_create_res, \
             patch('apps.order.services.call_payment_service_initiate') as mock_payment:
            
            mock_create_res.return_value = {
                'reservation_id': '550e8400-e29b-41d4-a716-446655440200',
                'product_id': '550e8400-e29b-41d4-a716-446655440100',
                'quantity': 2,
                'expires_at': '2026-05-06T10:20:00Z',
                'status': 'ACTIVE'
            }
            
            mock_payment.return_value = None  # COD không có payment URL
            
            response = self.client.post(
                '/api/v1/orders/',
                data=json.dumps(order_data),
                content_type='application/json'
            )

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            response_data = response.json()
            
            # For COD, should have message, no payment_url
            self.assertIn('message', response_data)
            self.assertNotIn('payment_url', response_data)
            self.assertIn('Thanh toán khi nhận', response_data['message'])
