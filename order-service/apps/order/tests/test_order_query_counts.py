from django.test import TestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext
import uuid
from types import SimpleNamespace

from rest_framework.test import APIClient

from apps.order.models import Order, OrderItem, OrderPayment


class OrderListQueryCountTest(TestCase):
    def setUp(self):
        # create a user id to use for orders
        self.user_id = uuid.uuid4()
        # create several orders with related items/payments/timeline
        for i in range(3):
            order = Order.objects.create(
                user_id=self.user_id,
                total_price=100 + i,
                shipping_fee=0,
                status='PENDING',
                shipping_method='STANDARD',
                shipping_address={'address_text': f'addr {i}'},
            )
            # create 2 items each
            for j in range(2):
                OrderItem.objects.create(order=order, product_id=uuid.uuid4(), quantity=1, sales_price=50)
            # create a payment record
            OrderPayment.objects.create(order=order, payment_method='COD', status='PENDING', amount=order.total_price)

        self.client = APIClient()
        # force authenticate a lightweight user-like object with id attribute used by views
        self.client.force_authenticate(user=SimpleNamespace(id=self.user_id, is_authenticated=True))

    def test_order_list_query_count_for_user(self):
        url = '/api/orders/'
        # Run the view and capture queries
        with CaptureQueriesContext(connection) as ctx:
            resp = self.client.get(url)
        # Assert response 200
        self.assertEqual(resp.status_code, 200)
        # Allow a small number of queries: base query + prefetch for related sets should keep queries low
        # We expect <= 6 queries (orders + prefetch related sets)
        self.assertLessEqual(len(ctx.captured_queries), 6, msg=f"Too many queries: {len(ctx.captured_queries)}\nSQLs: {[q['sql'] for q in ctx.captured_queries]}")
