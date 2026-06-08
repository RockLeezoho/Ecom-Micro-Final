import pika
import grpc
import uuid
import json
import os
import requests
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from .models import Order, OrderItem, OrderPayment, PaymentStatus
from django.db.models import Prefetch
from .gateways import ProductServiceGateway, PaymentServiceGateway


def _first_non_empty_string(*values):
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _extract_category_snapshot(snapshot: dict) -> tuple[str | None, str | None]:
    if not isinstance(snapshot, dict):
        return None, None

    category = snapshot.get('category')
    category_id = None
    category_slug = None

    if isinstance(category, dict):
        category_id = _first_non_empty_string(category.get('id'))
        category_slug = _first_non_empty_string(category.get('slug'))

    if not category_id:
        category_id = _first_non_empty_string(snapshot.get('category_id'))
    if not category_slug:
        category_slug = _first_non_empty_string(snapshot.get('category_slug'))

    return category_id, category_slug


def _extract_product_name(snapshot: dict) -> str | None:
    if not isinstance(snapshot, dict):
        return None

    return _first_non_empty_string(
        snapshot.get('name'),
        snapshot.get('product_name'),
        snapshot.get('title'),
    )


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
            # Đảm bảo product_id và order_id là string (UUID có thể được truyền dưới dạng object)
            product_id_str = str(item['product_id'])
            order_id_str = str(order_id)
            snapshot = gateway.get_product_snapshot(product_id_str)
            category_id, category_slug = _extract_category_snapshot(snapshot)
            item['category_id'] = category_id
            item['category_slug'] = category_slug
            item['name_product'] = _extract_product_name(snapshot)
            reservation = gateway.create_stock_reservation(
                product_id=product_id_str,
                order_id=order_id_str,
                quantity=item['quantity'],
                reservation_duration_minutes=15,  # 15 phút để customer thanh toán
            )
            reservations.append(reservation)
        except Exception as e:
            # Nếu tạo reservation thất bại, release tất cả reservations đã tạo
            product_id_str = str(item['product_id'])
            print(f"[ERROR] Failed to reserve product {product_id_str}: {str(e)}")
            for res in reservations:
                try:
                    gateway.release_stock_reservation(
                        res['reservation_id'],
                        reason="Rollback: Failed to reserve all items"
                    )
                except:
                    pass
            error_message = str(e)
            if "Insufficient stock" in error_message or "not found" in error_message.lower():
                raise ValueError(f"Stock reservation failed for product {product_id_str}: {error_message}")
            raise Exception(f"Stock reservation failed for product {product_id_str}: {error_message}")
    
    return reservations


def call_product_service_release_reservations(order_id: str, reason: str = "Order cancelled") -> bool:
    """
    Gọi Product Service để hủy tất cả stock reservations của đơn hàng.
    """
    gateway = ProductServiceGateway()
    
    try:
        # Đảm bảo order_id là string
        order_id_str = str(order_id)
        reservations = gateway.get_reservations_by_order(order_id_str)
        
        for reservation in reservations:
            if reservation['status'] == 'ACTIVE':
                gateway.release_stock_reservation(
                    reservation['id'],
                    reason=reason
                )
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to release reservations for order: {str(e)}")
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
    """
    Call the Shipping Service HTTP API to create a shipment.

    - Uses `SHIPPING_SERVICE_URL` env var (default: http://shipping-service:8007/api).
    - Sends a JSON payload to `/shipments/create/` and returns parsed response.
    - On any error or timeout, falls back to a local mock response so callers keep working.
    """
    shipping_url = os.getenv('SHIPPING_SERVICE_URL', 'http://shipping-service:8007/api')
    internal_token = os.getenv('SHIPPING_SERVICE_INTERNAL_TOKEN', '')

    payload = {
        'order_id': str(order_id),
        'user_id': str(user_id),
        'address': address,
        'weight': weight,
        'length': length,
        'width': width,
        'height': height,
    }

    headers = {'Content-Type': 'application/json'}
    if internal_token:
        headers['X-Service-Token'] = internal_token

    try:
        resp = requests.post(f"{shipping_url}/shipments/create/", json=payload, headers=headers, timeout=8)
        resp.raise_for_status()
        data = resp.json() if resp.content else {}

        return {
            'shipment_id': data.get('shipment_id') or data.get('id'),
            'tracking_number': data.get('tracking_number'),
            'label_url': data.get('label_url') or data.get('label'),
            **{k: v for k, v in data.items() if k not in {'shipment_id', 'tracking_number', 'label_url'}}
        }
    except Exception as exc:
        print(f"[WARN] Shipping service call failed: {exc}. Falling back to mock.")
        return {
            'shipment_id': f"mock_shp_{uuid.uuid4().hex[:8]}",
            'tracking_number': 'GHN123456789',
            'label_url': 'https://carrier.com/label/mock'
        }


# ============================================================================
# Event Handlers
# ============================================================================

def handle_shipment_created_event(event):
    order_id = event.get('order_id')
    tracking_number = event.get('tracking_number')
    with transaction.atomic():
        order = (
            Order.objects.select_for_update().prefetch_related(
                "items",
                Prefetch("payments", queryset=OrderPayment.objects.order_by("created_at")),
                "timeline",
            ).get(id=order_id)
        )
        order.tracking_number = tracking_number
        order.save(update_fields=['tracking_number', 'updated_at'])


def handle_payment_success_event(event):
    """
    Khi thanh toán thành công:
    1. Keep order status at PENDING so staff can confirm it
    2. Confirm stock reservations
    3. Mark order payment as PAID and order as paid
    """
    order_id = event.get('order_id')
    payment_id = event.get('payment_id')
    
    try:
        with transaction.atomic():
            order = (
                Order.objects.select_for_update().prefetch_related(
                    "items",
                    Prefetch("payments", queryset=OrderPayment.objects.order_by("created_at")),
                    "timeline",
                ).get(id=order_id)
            )

            gateway = ProductServiceGateway()
            reservations = gateway.get_reservations_by_order(str(order_id))
            for res in reservations:
                if res.get('status') == 'ACTIVE':
                    gateway.confirm_stock_reservation(res['id'])

            payment = order.payments.order_by("created_at").first()
            if payment is not None:
                payment.status = PaymentStatus.PAID
                payment.paid_at = timezone.now()
                if payment_id:
                    payment.transaction_id = payment.transaction_id or str(payment_id)
                payment.save(update_fields=['status', 'paid_at', 'transaction_id'])

            order.status = 'PENDING'
            order.is_paid = True
            order.save(update_fields=['status', 'is_paid', 'updated_at'])

    except Order.DoesNotExist:
        print(f"[ERROR] Order {order_id} not found for payment success event")


def handle_payment_failed_event(event):
    """
    Khi thanh toán thất bại:
    1. Release stock reservations
    2. Update payment status -> FAILED
    3. Update order status -> CANCELLED
    """
    order_id = event.get('order_id')
    reason = event.get('reason', 'Payment failed')
    
    try:
        with transaction.atomic():
            order = (
                Order.objects.select_for_update().prefetch_related(
                    "items",
                    Prefetch("payments", queryset=OrderPayment.objects.order_by("created_at")),
                    "timeline",
                ).get(id=order_id)
            )
            
            # Release reservations
            call_product_service_release_reservations(str(order_id), reason)

            payment = order.payments.order_by("created_at").first()
            if payment is not None:
                payment.status = PaymentStatus.FAILED
                payment.save(update_fields=['status'])
            
            # Cancel order
            order.status = 'CANCELLED'
            order.save(update_fields=['status', 'updated_at'])
            
    except Order.DoesNotExist:
        print(f"[ERROR] Order {order_id} not found for payment failed event")


# ============================================================================
# Orchestration Logic - Create Order with Stock Reservation
# ============================================================================

@transaction.atomic
def create_order_with_integrations(user_id, address_snapshot, payment_method, shipping_method, items, shipping_fee=0, carrier_name=None):
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
        shipping_fee: Calculated fee from checkout
        carrier_name: Carrier display name chosen by customer
        items: List[{product_id, quantity, price}]
    
    Returns:
        (order, payment_data)
    """
    
    # 1. Tạo Order record
    order = Order.objects.create(
        user_id=user_id,
        total_price=sum([float(i['price']) * i['quantity'] for i in items]),
        shipping_fee=shipping_fee,
        status='PENDING',
        shipping_method=shipping_method,
        carrier=carrier_name or '',
        shipping_address=address_snapshot,
    )
    
    # 2. Tạo Stock Reservations (giữ kho)
    try:
        reservations = call_product_service_create_reservation(str(order.id), items)
        print(f"[Order] Stock reservations created for order {order.id}: {len(reservations)} items")
    except ValueError:
        # Re-raise business validation errors so the API can return HTTP 400
        order.delete()
        raise
    except Exception as e:
        # Nếu reservation thất bại, xóa order
        print(f"[ERROR] Stock reservation failed: {str(e)}")
        order.delete()
        raise Exception(f"Failed to create order: {str(e)}")

    # 3. Tạo OrderItems sau khi reservation đã gắn snapshot category vào items
    product_ids = []
    for item in items:
        category_id = item.get('category_id')
        category_slug = item.get('category_slug')
        name_product = item.get('name_product')
        OrderItem.objects.create(
            order=order,
            product_id=item['product_id'],
            name_product=name_product,
            category_id=category_id,
            category_slug=category_slug,
            quantity=item['quantity'],
            sales_price=item['price'],
        )
        product_ids.append(str(item['product_id']))
    
    # 4. Khởi tạo payment
    try:
        payment_data = call_payment_service_initiate(order, payment_method, order.total_price)
        OrderPayment.objects.create(
            order=order,
            payment_method=payment_method,
            status=PaymentStatus.AWAITING_PAYMENT if str(payment_method).upper() == 'COD' else PaymentStatus.PENDING,
            transaction_id=(payment_data or {}).get('payment_id') if isinstance(payment_data, dict) else None,
            gateway_response=payment_data if isinstance(payment_data, dict) else None,
            amount=order.total_price,
        )
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

