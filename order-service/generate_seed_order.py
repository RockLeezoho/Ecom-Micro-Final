import csv
import random
import uuid

# Read products
products = []
with open("../train-ai/artifacts/products.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        products.append(row)

# Read users
users = []
with open("../train-ai/artifacts/users.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        users.append(row)

orders = []
statuses = ["OrderStatus.PENDING", "OrderStatus.PROCESSING", "OrderStatus.SHIPPED", "OrderStatus.COMPLETED"]
shipping_methods = ["ShippingMethod.STANDARD", "ShippingMethod.EXPRESS"]
payment_methods = ["PaymentMethod.COD", "PaymentMethod.BANK_TRANSFER"]

for i in range(15):
    order_id = str(uuid.uuid4())
    user = random.choice(users)
    status = random.choice(statuses)
    shipping_method = random.choice(shipping_methods)
    payment_method = random.choice(payment_methods)
    
    # ensure high status orders have paid status
    payment_status = "PaymentStatus.PAID" if status in ["OrderStatus.SHIPPED", "OrderStatus.COMPLETED"] else "PaymentStatus.AWAITING_PAYMENT"

    num_items = random.randint(1, 3)
    order_items = []
    selected_products = random.sample(products, num_items)
    for p in selected_products:
        order_items.append({
            "product_id": p["id"],
            "quantity": random.randint(1, 3),
            "sales_price": p["price"]
        })

    order = {
        "order_id": order_id,
        "user_id": user["id"],
        "status": status,
        "shipping_method": shipping_method,
        "shipping_address": {
            "address": "123 Random St",
            "recipient_name": user["username"],
            "recipient_phone": "0900000000"
        },
        "items": order_items,
        "payment_method": payment_method,
        "payment_status": payment_status
    }
    orders.append(order)

out_code = f"""from decimal import Decimal
import uuid
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.order.models import Order, OrderItem, OrderPayment, OrderStatus, PaymentMethod, PaymentStatus, ShippingMethod

class Command(BaseCommand):
    help = "Seed sample orders, order items, and order payments for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding order data...")

        sample_orders = {orders}

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
                    defaults={{
                        "user_id": order_data["user_id"],
                        "total_price": order_total + shipping_fee,
                        "shipping_fee": shipping_fee,
                        "status": status_str,
                        "shipping_method": shipping_method_str,
                        "shipping_address": order_data["shipping_address"],
                        "note": "Seeded order for testing",
                        "is_paid": payment_status_str in {{"PAID", "COMPLETED"}},
                    }},
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
                    defaults={{
                        "status": payment_status_str,
                        "transaction_id": f"TXN-{{str(order.id)[:10]}}",
                        "gateway_response": {{"seed": True}},
                        "amount": order_total + shipping_fee,
                    }},
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded order data!"))
"""

with open("apps/order/management/commands/seed_order.py", "w", encoding="utf-8") as f:
    # replace single quotes for enum representations to actual enum
    for enum in statuses + shipping_methods + payment_methods + ["PaymentStatus.PAID", "PaymentStatus.AWAITING_PAYMENT"]:
        out_code = out_code.replace(f"'{enum}'", enum)
    f.write(out_code)

print("Generated seed_order.py successfully.")
