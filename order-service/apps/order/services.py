import pika
import grpc
import uuid
import json
import os
import requests
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from .models import Order, OrderItem
from .gateways import ProductServiceGateway, PaymentServiceGateway


# ============================================================================
# Product Service Gateway - Stock Reservation
# ============================================================================

def call_product_service_create_reservation(order_id: str, items: list) -> list:
    """
    Gọi Product Service để tạo stock reservations cho các items của đơn hàng.
    
    Args:
        order_id: UUID của order
        items: List[{product_id, quantity, price}]
    
    Returns:
        List[{reservation_id, product_id, quantity, expires_at, status}]
    """
    gateway = ProductServiceGateway()
    reservations = []
    
    for item in items:
        try:
            reservation = gateway.create_stock_reservation(
                product_id=item['product_id'],
                order_id=order_id,
                quantity=item['quantity'],
                reservation_duration_minutes=15,  # 15 phút để customer thanh toán
            )
            reservations.append(reservation)
        except Exception as e:
            # Nếu tạo reservation thất bại, release tất cả reservations đã tạo
            print(f"[ERROR] Failed to reserve product {item['product_id']}: {str(e)}")
            for res in reservations:
                try:
                    gateway.release_stock_reservation(
                        res['reservation_id'],
                        reason="Rollback: Failed to reserve all items"
                    )
                except:
                    pass
            raise Exception(f"Stock reservation failed for product {item['product_id']}: {str(e)}")
    
    return reservations


def call_product_service_release_reservations(order_id: str, reason: str = "Order cancelled") -> bool:
    """
    Gọi Product Service để hủy tất cả stock reservations của đơn hàng.
    """
    gateway = ProductServiceGateway()
    
    try:
        reservations = gateway.get_reservations_by_order(order_id)
        
        for reservation in reservations:
            if reservation['status'] == 'ACTIVE':
                gateway.release_stock_reservation(
                    reservation['id'],
                    reason=reason
                )
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to release reservations for order {order_id}: {str(e)}")
        return False


def call_payment_service_initiate(order, payment_method, total_price):
    """Tạo payment transaction ở Payment Service cho các phương thức online."""
    gateway = PaymentServiceGateway()
    return gateway.create_payment(
        order_id=str(order.id),
        user_id=str(order.user_id),
        amount=float(total_price),
        payment_method=payment_method,
    )

# --- RabbitMQ Publisher Stub (pseudo-code) ---
def publish_cart_remove(user_id, product_ids):
    cart_service_url = os.getenv('CART_SERVICE_URL', 'http://cart-service:8004/api/cart')
    internal_token = os.getenv('CART_SERVICE_INTERNAL_TOKEN', '')

    if not internal_token:
        raise Exception('CART_SERVICE_INTERNAL_TOKEN is not configured')

    headers = {
        'Content-Type': 'application/json',
        'X-Service-Token': internal_token,
        'X-User-Id': str(user_id),
    }
    payload = {'product_ids': product_ids}
    response = requests.delete(f"{cart_service_url}/remove/", json=payload, headers=headers, timeout=8)
    response.raise_for_status()


# ============================================================================
# Shipping Service Gateway
# ============================================================================

def call_shipping_service_create_shipment(order_id, user_id, address, weight, length, width, height):
    """Mock implementation - replace with real gRPC call"""
    return {
        'shipment_id': 'shp_123456',
        'tracking_number': 'GHN123456789',
        'label_url': 'https://carrier.com/label/123456'
    }


# ============================================================================
# Event Handlers
# ============================================================================

def handle_shipment_created_event(event):
    order_id = event.get('order_id')
    tracking_number = event.get('tracking_number')
    with transaction.atomic():
        order = Order.objects.select_for_update().get(id=order_id)
        order.tracking_number = tracking_number
        order.save(update_fields=['tracking_number', 'updated_at'])


def handle_payment_success_event(event):
    """
    Khi thanh toán thành công:
    1. Update order status -> PROCESSING
    2. Confirm stock reservations
    3. Publish OrderConfirmedEvent
    """
    order_id = event.get('order_id')
    payment_id = event.get('payment_id')
    
    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)

            gateway = ProductServiceGateway()
            reservations = gateway.get_reservations_by_order(str(order_id))
            for res in reservations:
                if res.get('status') == 'ACTIVE':
                    gateway.confirm_stock_reservation(res['id'])

            order.status = 'PROCESSING'
            order.is_paid = True
            order.save(update_fields=['status', 'is_paid', 'updated_at'])

    except Order.DoesNotExist:
        print(f"[ERROR] Order {order_id} not found for payment success event")


def handle_payment_failed_event(event):
    """
    Khi thanh toán thất bại:
    1. Release stock reservations
    2. Update order status -> CANCELLED
    """
    order_id = event.get('order_id')
    reason = event.get('reason', 'Payment failed')
    
    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            
            # Release reservations
            call_product_service_release_reservations(str(order_id), reason)
            
            # Cancel order
            order.status = 'CANCELLED'
            order.save(update_fields=['status', 'updated_at'])
            
    except Order.DoesNotExist:
        print(f"[ERROR] Order {order_id} not found for payment failed event")


# ============================================================================
# Orchestration Logic - Create Order with Stock Reservation
# ============================================================================

@transaction.atomic
def create_order_with_integrations(user_id, address_snapshot, payment_method, shipping_method, items):
    """
    Tạo đơn hàng và reservations (giữ kho).
    
    Quy trình:
    1. Tạo Order record với status PENDING
    2. Tạo OrderItems
    3. Tạo Stock Reservations trên Product Service (giữ kho 15 phút)
    4. Nếu reservation thất bại, rollback (xóa order)
    5. Khởi tạo payment (nếu không COD)
    6. Publish RabbitMQ events
    
    Args:
        user_id: UUID của customer
        address_snapshot: Địa chỉ giao hàng (JSON snapshot)
        payment_method: COD, BANK_TRANSFER, E_WALLET, CREDIT_CARD
        shipping_method: STANDARD, EXPRESS
        items: List[{product_id, quantity, price}]
    
    Returns:
        (order, payment_data)
    """
    
    # 1. Tạo Order record
    order = Order.objects.create(
        user_id=user_id,
        total_price=sum([float(i['price']) * i['quantity'] for i in items]),
        shipping_fee=0,  # TODO: Calculate from shipping_method
        status='PENDING',
        payment_method=payment_method,
        shipping_method=shipping_method,
        shipping_address=address_snapshot,
    )
    
    # 2. Tạo OrderItems
    product_ids = []
    for item in items:
        OrderItem.objects.create(
            order=order,
            product_id=item['product_id'],
            quantity=item['quantity'],
            sales_price=item['price'],
        )
        product_ids.append(str(item['product_id']))
    
    # 3. Tạo Stock Reservations (giữ kho)
    try:
        reservations = call_product_service_create_reservation(str(order.id), items)
        print(f"[Order] Stock reservations created for order {order.id}: {len(reservations)} items")
    except Exception as e:
        # Nếu reservation thất bại, xóa order
        print(f"[ERROR] Stock reservation failed: {str(e)}")
        order.delete()
        raise Exception(f"Failed to create order: {str(e)}")
    
    # 4. Khởi tạo payment
    try:
        payment_data = call_payment_service_initiate(order, payment_method, order.total_price)
    except Exception as e:
        print(f"[ERROR] Payment initiation failed: {str(e)}")
        # Release reservations khi payment init thất bại
        call_product_service_release_reservations(str(order.id), "Payment initiation failed")
        order.delete()
        raise Exception(f"Failed to initiate payment: {str(e)}")
    
    # 5. Remove items from cart (best effort)
    try:
        publish_cart_remove(str(user_id), product_ids)
    except Exception as e:
        print(f"[WARN] Failed to remove items from cart: {str(e)}")
    
    return order, payment_data

