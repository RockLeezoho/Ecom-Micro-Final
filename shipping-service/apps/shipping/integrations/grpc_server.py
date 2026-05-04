import grpc
from concurrent import futures
import json
from django.conf import settings
from apps.shipping.models import Shipment, Carrier, ShipmentLog
from . import shipping_pb2, shipping_pb2_grpc
import pika

class ShippingServiceServicer(shipping_pb2_grpc.ShippingServiceServicer):
    def CreateShipment(self, request, context):
        address = json.loads(request.address_json)
        tracking_number = f"GHN{request.order_id[-6:]}"
        label_url = f"https://carrier.com/label/{tracking_number}"
        shipment = Shipment.objects.create(
            order_id=request.order_id,
            user_id=request.user_id,
            tracking_number=tracking_number,
            label_url=label_url,
            weight=request.weight,
            length=request.length,
            width=request.width,
            height=request.height,
            carrier=Carrier.objects.first(),
            status='CREATED'
        )
        ShipmentLog.objects.create(
            shipment=shipment,
            status='CREATED',
            note='Shipment created and label generated.'
        )
        publish_shipment_created_event(shipment)
        return shipping_pb2.CreateShipmentResponse(
            shipment_id=str(shipment.id),
            tracking_number=tracking_number,
            label_url=label_url
        )

def publish_shipment_created_event(shipment):
    connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
    channel = connection.channel()
    channel.exchange_declare(exchange='shipping_events', exchange_type='fanout', durable=True)
    event = {
        'event': 'ShipmentCreatedEvent',
        'order_id': str(shipment.order_id),
        'shipment_id': str(shipment.id),
        'tracking_number': shipment.tracking_number,
        'label_url': shipment.label_url,
    }
    channel.basic_publish(
        exchange='shipping_events', routing_key='',
        body=json.dumps(event),
        properties=pika.BasicProperties(content_type='application/json')
    )
    connection.close()

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    shipping_pb2_grpc.add_ShippingServiceServicer_to_server(ShippingServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print('ShippingService gRPC server started on port 50051')
    server.wait_for_termination()
