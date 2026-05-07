from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.order.models import Order, OrderItem, OrderPayment, OrderStatus, PaymentMethod, PaymentStatus, ShippingMethod


class Command(BaseCommand):
    help = "Seed sample orders, order items, and order payments for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding order data...")

        sample_orders = [
            {
                "order_id": "11111111-1111-1111-1111-111111111111",
                "user_id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                "status": OrderStatus.PENDING,
                "shipping_method": ShippingMethod.STANDARD,
                "shipping_address": {
                    "address": "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                    "recipient_name": "John Doe",
                    "recipient_phone": "0888999000",
                },
                "items": [
                    {
                        "product_id": "7d469157-7988-4a0c-9961-895e2a03e5b3",
                        "quantity": 2,
                        "sales_price": "249000.00",
                    },
                    {
                        "product_id": "81e90485-1a01-4d64-b6cd-f47360fb7230",
                        "quantity": 1,
                        "sales_price": "35650000.00",
                    },
                ],
                "payment_method": PaymentMethod.BANK_TRANSFER,
                "payment_status": PaymentStatus.PENDING,
            },
            {
                "order_id": "22222222-2222-2222-2222-222222222222",
                "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "status": OrderStatus.PROCESSING,
                "shipping_method": ShippingMethod.EXPRESS,
                "shipping_address": {
                    "address": "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
                    "recipient_name": "Lan Tran",
                    "recipient_phone": "0907778889",
                },
                "items": [
                    {
                        "product_id": "0d0bf2be-d582-44b2-a581-c8d506f07601",
                        "quantity": 1,
                        "sales_price": "434000.00",
                    },
                    {
                        "product_id": "0a76aba1-b052-4964-a0ab-f4814d413271",
                        "quantity": 3,
                        "sales_price": "5995000.00",
                    },
                ],
                "payment_method": PaymentMethod.COD,
                "payment_status": PaymentStatus.AWAITING_PAYMENT,
            },
            {
                "order_id": "33333333-3333-3333-3333-333333333333",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": OrderStatus.SHIPPED,
                "shipping_method": ShippingMethod.STANDARD,
                "shipping_address": {
                    "address": "Số 1 Lý Tự Trọng, Quận 1, TP.HCM",
                    "recipient_name": "Hùng Nguyễn",
                    "recipient_phone": "0901234567",
                },
                "items": [
                    {
                        "product_id": "ea6a088c-49cd-4b4b-9219-cacdb21f1816",
                        "quantity": 4,
                        "sales_price": "404000.00",
                    },
                ],
                "payment_method": PaymentMethod.CREDIT_CARD,
                "payment_status": PaymentStatus.PAID,
            },
        ]

        with transaction.atomic():
            for order_data in sample_orders:
                order_total = sum(Decimal(item["sales_price"]) * item["quantity"] for item in order_data["items"])
                shipping_fee = Decimal("15000.00") if order_data["shipping_method"] == ShippingMethod.STANDARD else Decimal("30000.00")

                order, _ = Order.objects.update_or_create(
                    id=order_data["order_id"],
                    defaults={
                        "user_id": order_data["user_id"],
                        "total_price": order_total + shipping_fee,
                        "shipping_fee": shipping_fee,
                        "status": order_data["status"],
                        "shipping_method": order_data["shipping_method"],
                        "shipping_address": order_data["shipping_address"],
                        "note": "Seeded order for testing",
                        "is_paid": order_data["payment_status"] in {PaymentStatus.PAID, PaymentStatus.COMPLETED} if hasattr(PaymentStatus, "COMPLETED") else order_data["payment_status"] == PaymentStatus.PAID,
                    },
                )

                OrderItem.objects.filter(order=order).delete()
                for item_data in order_data["items"]:
                    OrderItem.objects.create(
                        order=order,
                        product_id=item_data["product_id"],
                        quantity=item_data["quantity"],
                        sales_price=item_data["sales_price"],
                    )

                OrderPayment.objects.update_or_create(
                    order=order,
                    payment_method=order_data["payment_method"],
                    defaults={
                        "status": order_data["payment_status"],
                            "transaction_id": f"TXN-{str(order.id)[:10]}",
                        "gateway_response": {"seed": True},
                        "amount": order_total + shipping_fee,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded order data!"))