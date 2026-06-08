from __future__ import annotations

import uuid
from decimal import Decimal
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from apps.order.models import Order, OrderItem


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class FakeSession:
    def __init__(self):
        self.calls = []

    def post(self, url, json=None, timeout=None):
        self.calls.append(("POST", url, json))
        return FakeResponse(
            {
                "status": "success",
                "data": {
                    "access_token": "admin-token",
                    "refresh_token": "refresh-token",
                },
            }
        )

    def get(self, url, headers=None, timeout=None):
        self.calls.append(("GET", url, headers))
        if "/management/users/" in url:
            return FakeResponse(
                {
                    "id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                    "username": "customer_john",
                    "phone_number": "0888999000",
                    "first_name": "John",
                    "last_name": "Doe",
                }
            )
        if "/categories/?all=true" in url:
            return FakeResponse(
                {
                    "status": "success",
                    "data": [
                        {"id": "11111111-1111-1111-1111-111111111111", "name": "Books", "slug": "books"},
                    ],
                }
            )
        if "/products/" in url:
            return FakeResponse(
                {
                    "id": "7d469157-7988-4a0c-9961-895e2a03e5b3",
                    "name": "Notebook A5",
                    "category": "11111111-1111-1111-1111-111111111111",
                }
            )
        return FakeResponse({}, status_code=404)


class BackfillOrderSnapshotsCommandTest(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            user_id=uuid.UUID("8d5b16e4-862d-4861-b4d2-79069d239c04"),
            total_price=Decimal("115000.00"),
            shipping_fee=Decimal("15000.00"),
            status="PENDING",
            shipping_method="STANDARD",
            shipping_address={"address": "123 Lê Lợi, Quận 1, TP.HCM"},
        )
        self.item = OrderItem.objects.create(
            order=self.order,
            product_id=uuid.UUID("7d469157-7988-4a0c-9961-895e2a03e5b3"),
            quantity=1,
            sales_price=Decimal("100000.00"),
        )

    @patch("apps.order.management.commands.backfill_order_snapshots.requests.Session", return_value=FakeSession())
    def test_backfill_updates_missing_snapshots(self, _session_mock):
        call_command(
            "backfill_order_snapshots",
            "--order-id",
            str(self.order.id),
            "--limit",
            "1",
        )

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.shipping_address["recipient_name"], "customer_john")
        self.assertEqual(self.order.shipping_address["recipient_phone"], "0888999000")
        self.assertEqual(self.order.shipping_address["username"], "customer_john")
        self.assertEqual(self.order.shipping_address["phone_number"], "0888999000")
        self.assertEqual(self.item.name_product, "Notebook A5")
        self.assertEqual(str(self.item.category_id), "11111111-1111-1111-1111-111111111111")
        self.assertEqual(self.item.category_slug, "books")

    @patch("apps.order.management.commands.backfill_order_snapshots.requests.Session", return_value=FakeSession())
    def test_backfill_dry_run_does_not_persist(self, _session_mock):
        call_command(
            "backfill_order_snapshots",
            "--order-id",
            str(self.order.id),
            "--dry-run",
        )

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertNotIn("recipient_name", self.order.shipping_address)
        self.assertIsNone(self.item.name_product)
        self.assertIsNone(self.item.category_id)
        self.assertIsNone(self.item.category_slug)