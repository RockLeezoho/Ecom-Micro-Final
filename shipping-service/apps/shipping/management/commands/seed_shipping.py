from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.shipping.models import Carrier, Shipment, ShipmentLog, ShipmentStatus, ShippingMethod


class Command(BaseCommand):
    help = "Seed sample carriers and shipments for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding shipping data...")

        sample_carriers = [
            {"code": "ghn", "name": "Giao Hàng Nhanh", "contact_number": "1900636779"},
            {"code": "ghtk", "name": "Giao Hàng Tiết Kiệm", "contact_number": "19006043"},
            {"code": "viettelpost", "name": "Viettel Post", "contact_number": "19008095"},
        ]

        sample_shipments = [
            {
                "id": "dddd1111-1111-1111-1111-111111111111",
                "order_id": "11111111-1111-1111-1111-111111111111",
                "user_id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                "carrier_code": "ghn",
                "carrier_shipment_id": "GHN111111",
                "method": ShippingMethod.STANDARD,
                "status": ShipmentStatus.PREPARING,
                "shipping_address_snapshot": {
                    "address": "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                    "recipient_name": "John Doe",
                    "recipient_phone": "0888999000",
                },
                "weight": 1.2,
                "length": 30.0,
                "width": 20.0,
                "height": 10.0,
                "tracking_number": "TRK111111",
            },
            {
                "id": "eeee2222-2222-2222-2222-222222222222",
                "order_id": "22222222-2222-2222-2222-222222222222",
                "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "carrier_code": "ghtk",
                "carrier_shipment_id": "GHTK222222",
                "method": ShippingMethod.EXPRESS,
                "status": ShipmentStatus.IN_TRANSIT,
                "shipping_address_snapshot": {
                    "address": "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
                    "recipient_name": "Lan Tran",
                    "recipient_phone": "0907778889",
                },
                "weight": 2.5,
                "length": 40.0,
                "width": 25.0,
                "height": 12.0,
                "tracking_number": "TRK222222",
            },
        ]

        with transaction.atomic():
            carrier_map = {}
            for carrier_data in sample_carriers:
                carrier, _ = Carrier.objects.update_or_create(
                    code=carrier_data["code"],
                    defaults={
                        "name": carrier_data["name"],
                        "contact_number": carrier_data["contact_number"],
                        "is_active": True,
                    },
                )
                carrier_map[carrier.code] = carrier

            for shipment_data in sample_shipments:
                carrier = carrier_map[shipment_data["carrier_code"]]
                shipment, _ = Shipment.objects.update_or_create(
                    id=shipment_data["id"],
                    defaults={
                        "order_id": shipment_data["order_id"],
                        "user_id": shipment_data["user_id"],
                        "carrier": carrier,
                        "carrier_shipment_id": shipment_data["carrier_shipment_id"],
                        "method": shipment_data["method"],
                        "status": shipment_data["status"],
                        "shipping_address_snapshot": shipment_data["shipping_address_snapshot"],
                        "weight": shipment_data["weight"],
                        "length": shipment_data["length"],
                        "width": shipment_data["width"],
                        "height": shipment_data["height"],
                        "shipping_fee": Decimal("0.00"),
                        "tracking_number": shipment_data["tracking_number"],
                    },
                )

                ShipmentLog.objects.get_or_create(
                    shipment=shipment,
                    status=shipment.status,
                    defaults={
                        "location": "Warehouse A",
                        "description": "Seeded shipment log",
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded shipping data!"))