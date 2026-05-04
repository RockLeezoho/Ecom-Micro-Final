import pika
from django.db import transaction
def handle_shipment_created_event(event):
    order_id = event.get('order_id')
    tracking_number = event.get('tracking_number')
    with transaction.atomic():
        from apps.order.models import Order
        order = Order.objects.select_for_update().get(id=order_id)
        order.tracking_number = tracking_number
        order.shipping_status = 'READY_FOR_PICKUP'
        order.save(update_fields=['tracking_number', 'shipping_status', 'updated_at'])

def start_shipment_created_consumer():
    connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
    channel = connection.channel()
    channel.exchange_declare(exchange='shipping_events', exchange_type='fanout', durable=True)
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind(exchange='shipping_events', queue=queue_name)

    def callback(ch, method, properties, body):
        import json
        event = json.loads(body)
        if event.get('event') == 'ShipmentCreatedEvent':
            handle_shipment_created_event(event)

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    print(' [*] Waiting for ShipmentCreatedEvent. To exit press CTRL+C')
    channel.start_consuming()
import grpc
# from shipping_pb2_grpc import ShippingServiceStub
# from shipping_pb2 import CreateShipmentRequest
import json

def call_shipping_service_create_shipment(order_id, user_id, address, weight, length, width, height):
    # channel = grpc.insecure_channel('shipping_service:50051')
    # stub = ShippingServiceStub(channel)
    # request = CreateShipmentRequest(
    #     order_id=order_id,
    #     user_id=user_id,
    #     address_json=json.dumps(address),
    #     weight=weight,
    #     length=length,
    #     width=width,
    #     height=height,
    # )
    # response = stub.CreateShipment(request)
    # return {
    #     'shipment_id': response.shipment_id,
    #     'tracking_number': response.tracking_number,
    #     'label_url': response.label_url,
    # }
    # --- MOCK for demo ---
    return {
        'shipment_id': 'shp_123456',
        'tracking_number': 'GHN123456789',
        'label_url': 'https://carrier.com/label/123456'
    }
import pika
import json
from django.utils import timezone
# --- Orchestration Logic ---

# --- PaymentSuccessEvent Consumer ---
def handle_payment_success_event(event):
    order_id = event.get('order_id')
    payment_id = event.get('payment_id')
    try:
        order = Order.objects.get(id=order_id)
        order.status = 'PROCESSING'
        # If you have a payment_status field, set it to 'PAID' here
        order.save(update_fields=['status', 'updated_at'])
    except Order.DoesNotExist:
        # Log or handle missing order
        pass

def start_payment_success_consumer():
    connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
    channel = connection.channel()
    channel.exchange_declare(exchange='payment_events', exchange_type='fanout', durable=True)
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind(exchange='payment_events', queue=queue_name)

    def callback(ch, method, properties, body):
        event = json.loads(body)
        if event.get('event') == 'PaymentSuccessEvent':
            handle_payment_success_event(event)

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    print(' [*] Waiting for PaymentSuccessEvent. To exit press CTRL+C')
    channel.start_consuming()
import grpc
import uuid
from django.db import transaction
from .models import Order, OrderItem
from django.conf import settings
# from stock_pb2_grpc import StockServiceStub
# from payment_pb2_grpc import PaymentServiceStub
# from cart_publisher import CartPublisher


# --- gRPC Client Stubs (pseudo-code, replace with real stubs) ---
def call_product_service_deduct_inventory(items):
    # Connect to Product Service via gRPC and deduct inventory
    # Example: stub = ProductServiceStub(grpc.insecure_channel(settings.PRODUCT_GRPC_URL))
    # response = stub.DeductInventory(DeductInventoryRequest(items=...))
    # if not response.success: raise Exception('Inventory deduction failed')
    return True

def call_payment_service_initiate(order, payment_method, total_price):
    # Connect to Payment Service via gRPC and initiate payment
    # Example: stub = PaymentServiceStub(grpc.insecure_channel(settings.PAYMENT_GRPC_URL))
    # response = stub.InitiatePayment(...)
    # return response.payment_url
    if payment_method == 'COD':
        return None
    return f'https://bank.example.com/pay?order_id={order.id}'

# --- RabbitMQ Publisher Stub (pseudo-code) ---
def publish_cart_remove(user_id, product_ids):
    # publisher = CartPublisher(settings.RABBITMQ_URL)
    # publisher.remove_items(user_id, product_ids)
    pass

# --- Orchestration Logic ---
@transaction.atomic
def create_order_with_integrations(user_id, address_snapshot, payment_method, shipping_method, items):
    # 1. Deduct inventory via Product Service
    call_product_service_deduct_inventory(items)
    # 2. Create order & items
    order = Order.objects.create(
        user_id=user_id,
        total_price=sum([float(i['price']) * i['quantity'] for i in items]),
        shipping_fee=0,  # Should be calculated from shipping_method
        status='PENDING',
        payment_method=payment_method,
        shipping_method=shipping_method,
        shipping_address=address_snapshot,
    )
    product_ids = []
    for item in items:
        OrderItem.objects.create(
            order=order,
            product_id=item['product_id'],
            quantity=item['quantity'],
            sales_price=item['price'],
        )
        product_ids.append(str(item['product_id']))
    # 3. Remove items from cart
    publish_cart_remove(user_id, product_ids)
    # 4. Initiate payment
    payment_url = call_payment_service_initiate(order, payment_method, order.total_price)
    return order, payment_url
