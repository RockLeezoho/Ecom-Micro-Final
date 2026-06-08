from decimal import Decimal
import uuid
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.order.models import Order, OrderItem, OrderPayment, OrderStatus, PaymentMethod, PaymentStatus, ShippingMethod

class Command(BaseCommand):
    help = "Seed sample orders, order items, and order payments for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding order data...")

        sample_orders = [{'order_id': '4fedaf99-7696-49c6-8f52-3256672c1690', 'user_id': 'cdbc5d48-8e72-4426-8eef-1bb10f9e7193', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'admin_cdbc5d', 'recipient_phone': '0900000000'}, 'items': [{'product_id': 'b1672f0b-5c06-4dff-9d0b-2af1660a0571', 'quantity': 2, 'sales_price': '100000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': 'ec2ca395-bcd6-42d3-a437-c16cb0bba65c', 'user_id': '2f6a79e8-ccb4-446f-8fe7-d8be439adffc', 'status': OrderStatus.SHIPPED, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_2f6a79', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '3f101785-7f72-4ce5-8acc-bc91a022d2b1', 'quantity': 1, 'sales_price': '1060000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.PAID}, {'order_id': 'fb61d777-5d77-44bc-82d7-66235b290583', 'user_id': 'f4587ea9-f097-4545-b3cb-da6e43b602bc', 'status': OrderStatus.SHIPPED, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_f4587e', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '72a53928-1c5f-4119-abb2-d58be06d9b32', 'quantity': 3, 'sales_price': '14000000'}, {'product_id': '4849ae5d-ed99-4b54-a38b-9dd0b5950217', 'quantity': 3, 'sales_price': '160000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.PAID}, {'order_id': '9b6d8a6b-6035-48cd-9eb4-327a1f5604a2', 'user_id': 'c1eb76d3-9cae-4364-a672-4c51213f8498', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_c1eb76', 'recipient_phone': '0900000000'}, 'items': [{'product_id': 'af1744cb-a130-45b9-bc3c-be4df877c846', 'quantity': 3, 'sales_price': '31000000'}, {'product_id': '845d8877-45eb-48b4-810e-bebb59b13c1a', 'quantity': 3, 'sales_price': '25000000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': '15a04f73-7bb1-45e6-8c2b-f447eac70ced', 'user_id': '1513254a-8fa1-452a-94a6-58ad0c9a6347', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_151325', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '1ddfe323-02bf-49ad-8491-73574402eac8', 'quantity': 2, 'sales_price': '180000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': 'f32a9a63-2644-4dfc-bf0d-c4c6ea54ded9', 'user_id': '40893f1d-01b3-4485-ab25-ed0fda6a1229', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_40893f', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '7c6e940c-1d07-449d-990d-cf0f7aff94e6', 'quantity': 2, 'sales_price': '1780000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': '73857850-ddd5-4cec-8e22-1a9ab4c46f66', 'user_id': 'b49eeb00-7ed0-4693-b502-2d569e78476d', 'status': OrderStatus.COMPLETED, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_b49eeb', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '845d8877-45eb-48b4-810e-bebb59b13c1a', 'quantity': 2, 'sales_price': '25000000'}, {'product_id': '0d06568b-f7db-4c32-be02-c13f4adf6bcc', 'quantity': 3, 'sales_price': '60000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.PAID}, {'order_id': 'cbe46b2f-6f33-4cfc-9847-5ea116d73f05', 'user_id': 'fbbf1f97-62e6-4362-9e34-e8b256fab07f', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_fbbf1f', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '50e48d9f-b6fc-4c0c-a4f0-bce9bf1e95af', 'quantity': 2, 'sales_price': '100000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': 'd09926c7-519c-4196-ae76-75878d24dec7', 'user_id': 'd1e8dc74-f6a7-42a6-8fd7-273a78b58e8c', 'status': OrderStatus.COMPLETED, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_d1e8dc', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '28d916f3-e990-4ea5-a0ed-d020ca5763b4', 'quantity': 1, 'sales_price': '39000000'}, {'product_id': '1fd34e92-5d98-46d7-b9eb-abd3b4a51a25', 'quantity': 2, 'sales_price': '13000000'}, {'product_id': '7886feab-d4f0-452f-9c80-3500e5065675', 'quantity': 2, 'sales_price': '19000000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.PAID}, {'order_id': 'a9fc8586-7c0e-489c-838c-e0e2d95b4fe2', 'user_id': 'bbea09d8-51ef-41b1-9f65-7bbafdd555ee', 'status': OrderStatus.SHIPPED, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_bbea09', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '0d08d3d8-eb46-4372-a1fa-226290bb9178', 'quantity': 2, 'sales_price': '220000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.PAID}, {'order_id': 'c182a2d5-22df-4961-ae16-240647b8be9c', 'user_id': 'b21de26b-5095-49ca-a507-9949b42bdb91', 'status': OrderStatus.PENDING, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_b21de2', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '7d71e102-da9a-40f4-9a77-d212bcdf473b', 'quantity': 3, 'sales_price': '290000'}, {'product_id': '08730013-332f-45b7-9d13-e26a78d29805', 'quantity': 2, 'sales_price': '11000000'}, {'product_id': 'bd2309cb-b88e-4f7f-a963-24fb13cabc9b', 'quantity': 3, 'sales_price': '43000000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': '233b7a9a-4e84-4935-a0a6-d5c644f98756', 'user_id': 'a61671b8-f944-4a27-95f8-81bef7cf02e8', 'status': OrderStatus.SHIPPED, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_a61671', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '712d2d84-4713-48e4-8cff-48ffa097c45e', 'quantity': 2, 'sales_price': '37000000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.PAID}, {'order_id': '2e5a30d3-ee3d-4bd6-b0db-74947e413bb4', 'user_id': '38febbd9-183c-4010-9691-7f151fd642a4', 'status': OrderStatus.SHIPPED, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_38febb', 'recipient_phone': '0900000000'}, 'items': [{'product_id': 'bd2309cb-b88e-4f7f-a963-24fb13cabc9b', 'quantity': 1, 'sales_price': '43000000'}, {'product_id': 'd2e575c2-b87e-4dfb-a52e-16276c3f86b3', 'quantity': 3, 'sales_price': '130000'}, {'product_id': 'df72d459-229e-4dd9-8616-3ba03c7cb92a', 'quantity': 3, 'sales_price': '190000'}], 'payment_method': PaymentMethod.COD, 'payment_status': PaymentStatus.PAID}, {'order_id': '5e597a9f-9413-4d37-92ef-d1438cd58e0b', 'user_id': 'ea8ed645-5b23-4a72-9dba-319418d079c6', 'status': OrderStatus.PROCESSING, 'shipping_method': ShippingMethod.STANDARD, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_ea8ed6', 'recipient_phone': '0900000000'}, 'items': [{'product_id': 'd4174a72-26a4-4ae5-94c2-29be6ec99073', 'quantity': 3, 'sales_price': '150000'}, {'product_id': '3d24a0d0-7ccd-49a7-aa3e-2da4aa2c3587', 'quantity': 3, 'sales_price': '290000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.AWAITING_PAYMENT}, {'order_id': 'b3ad986a-653a-49fd-8c3c-2a6227db1447', 'user_id': '8416660e-b6f8-4cad-a515-270e6a1815f9', 'status': OrderStatus.COMPLETED, 'shipping_method': ShippingMethod.EXPRESS, 'shipping_address': {'address': '123 Random St', 'recipient_name': 'customer_841666', 'recipient_phone': '0900000000'}, 'items': [{'product_id': '4f106ff4-dbbc-47d1-a809-dc200759178d', 'quantity': 3, 'sales_price': '140000'}], 'payment_method': PaymentMethod.BANK_TRANSFER, 'payment_status': PaymentStatus.PAID}]

        with transaction.atomic():
            Order.objects.all().delete()
            for order_data in sample_orders:
                order_total = sum(Decimal(str(item["sales_price"])) * item["quantity"] for item in order_data["items"])
                shipping_fee = Decimal("15000.00") if order_data["shipping_method"] == ShippingMethod.STANDARD else Decimal("30000.00")

                # Handle dynamic enum status mapping correctly for seeds
                status_str = str(order_data["status"]).split(".")[-1]
                shipping_method_str = str(order_data["shipping_method"]).split(".")[-1]
                payment_method_str = str(order_data["payment_method"]).split(".")[-1]
                payment_status_str = str(order_data["payment_status"]).split(".")[-1]

                order, _ = Order.objects.update_or_create(
                    id=order_data["order_id"],
                    defaults={
                        "user_id": order_data["user_id"],
                        "total_price": order_total + shipping_fee,
                        "shipping_fee": shipping_fee,
                        "status": status_str,
                        "shipping_method": shipping_method_str,
                        "shipping_address": order_data["shipping_address"],
                        "note": "Seeded order for testing",
                        "is_paid": payment_status_str in {"PAID", "COMPLETED"},
                    },
                )

                OrderItem.objects.filter(order=order).delete()
                for item_data in order_data["items"]:
                    OrderItem.objects.create(
                        order=order,
                        product_id=item_data["product_id"],
                        quantity=item_data["quantity"],
                        sales_price=Decimal(str(item_data["sales_price"])),
                    )

                OrderPayment.objects.update_or_create(
                    order=order,
                    payment_method=payment_method_str,
                    defaults={
                        "status": payment_status_str,
                        "transaction_id": f"TXN-{str(order.id)[:10]}",
                        "gateway_response": {"seed": True},
                        "amount": order_total + shipping_fee,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded order data!"))
