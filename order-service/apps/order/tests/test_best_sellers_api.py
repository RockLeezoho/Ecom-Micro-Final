import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.order.models import Order, OrderItem, OrderPayment


class BestSellerProductsApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 11 paid orders with increasing quantities so the endpoint can be checked for
        # both sorting and the top-10 limit.
        for index in range(11):
            order = Order.objects.create(
                user_id=uuid.uuid4(),
                total_price=100 + index,
                shipping_fee=0,
                status="COMPLETED",
                shipping_method="STANDARD",
                shipping_address={"address_text": f"addr {index}"},
                is_paid=True,
            )
            category_id = uuid.UUID("11111111-1111-1111-1111-111111111111") if index < 10 else uuid.UUID("22222222-2222-2222-2222-222222222222")
            OrderItem.objects.create(
                order=order,
                product_id=uuid.UUID(int=index + 1),
                category_id=category_id,
                category_slug="cat-a" if index < 10 else "cat-b",
                quantity=index + 1,
                sales_price=100,
            )
            OrderPayment.objects.create(
                order=order,
                payment_method="BANK_TRANSFER",
                status="PAID",
                amount=order.total_price,
            )

        # Cancelled order with a very large quantity should not be counted.
        cancelled_order = Order.objects.create(
            user_id=uuid.uuid4(),
            total_price=999,
            shipping_fee=0,
            status="CANCELLED",
            shipping_method="STANDARD",
            shipping_address={"address_text": "cancelled"},
            is_paid=True,
        )
        self.cancelled_product_id = uuid.uuid4()
        OrderItem.objects.create(
            order=cancelled_order,
            product_id=self.cancelled_product_id,
            category_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            category_slug="cat-a",
            quantity=999,
            sales_price=1,
        )

    def test_returns_top_10_best_selling_products_for_category(self):
        response = self.client.get("/api/orders/best-sellers/", {"category_id": "11111111-1111-1111-1111-111111111111"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()

        expected_ids = [str(uuid.UUID(int=index)) for index in range(10, 0, -1)]
        self.assertEqual(payload["count"], 10)
        self.assertEqual(payload["product_ids"], expected_ids)
        self.assertNotIn(str(self.cancelled_product_id), payload["product_ids"])