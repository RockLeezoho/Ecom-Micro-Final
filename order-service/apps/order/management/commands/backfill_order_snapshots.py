from __future__ import annotations

import json
import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import requests
from django.core.management.base import BaseCommand, CommandError

from apps.order.models import Order


def _normalize_base_url(value: str, default: str) -> str:
    base_url = (value or default).strip().rstrip("/")
    return base_url or default.rstrip("/")


def _first_text(*values: Any) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def _unwrap_response_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        if "data" in payload:
            return payload["data"]
        if "results" in payload:
            return payload["results"]
    return payload


def _flatten_categories(categories: Any) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    if not isinstance(categories, list):
        return flattened

    for category in categories:
        if not isinstance(category, dict):
            continue
        flattened.append(category)
        children = category.get("children")
        if isinstance(children, list):
            flattened.extend(_flatten_categories(children))
    return flattened


@dataclass
class ProductSnapshot:
    name: str | None = None
    category_id: str | None = None
    category_slug: str | None = None


class OrderSnapshotBackfillClient:
    def __init__(self, user_service_url: str, product_service_url: str):
        self.user_service_url = _normalize_base_url(user_service_url, "http://user-service:8001/api")
        self.product_service_url = _normalize_base_url(product_service_url, "http://product-service:8003/api")
        self.session = requests.Session()
        self._access_token: str | None = None
        self._category_slug_map: dict[str, str] | None = None
        self._product_cache: dict[str, ProductSnapshot | None] = {}

    def set_access_token(self, access_token: str) -> None:
        token = (access_token or "").strip()
        self._access_token = token or None

    def login_admin(self, username: str, password: str) -> None:
        if self._access_token:
            return

        response = self.session.post(
            f"{self.user_service_url}/management/auth/login/admin/",
            json={"username": username, "password": password},
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        token = payload.get("access_token") or _unwrap_response_payload(payload).get("access_token")
        if not token:
            raise CommandError("Unable to obtain admin access token from user-service")
        self._access_token = str(token)

    def _auth_headers(self) -> dict[str, str]:
        if not self._access_token:
            return {}
        return {"Authorization": f"Bearer {self._access_token}"}

    def get_customer_profile(self, user_id: str) -> dict[str, Any] | None:
        response = self.session.get(
            f"{self.user_service_url}/management/users/{user_id}/",
            headers=self._auth_headers(),
            timeout=20,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        payload = _unwrap_response_payload(response.json())
        return payload if isinstance(payload, dict) else None

    def _load_category_slug_map(self) -> dict[str, str]:
        if self._category_slug_map is not None:
            return self._category_slug_map

        response = self.session.get(f"{self.product_service_url}/categories/?all=true", timeout=20)
        response.raise_for_status()
        payload = _unwrap_response_payload(response.json())
        category_rows = _flatten_categories(payload)
        category_slug_map: dict[str, str] = {}
        for category in category_rows:
            category_id = _first_text(category.get("id"))
            category_slug = _first_text(category.get("slug"))
            if category_id and category_slug:
                category_slug_map[category_id] = category_slug

        self._category_slug_map = category_slug_map
        return category_slug_map

    def get_product_snapshot(self, product_id: str) -> ProductSnapshot | None:
        product_key = _first_text(product_id)
        if not product_key:
            return None

        if product_key in self._product_cache:
            return self._product_cache[product_key]

        response = self.session.get(f"{self.product_service_url}/products/{product_key}/", timeout=20)
        if response.status_code == 404:
            self._product_cache[product_key] = None
            return None
        response.raise_for_status()

        payload = _unwrap_response_payload(response.json())
        if not isinstance(payload, dict):
            self._product_cache[product_key] = None
            return None

        category_value = payload.get("category")
        category_id = None
        category_slug = None
        if isinstance(category_value, dict):
            category_id = _first_text(category_value.get("id"))
            category_slug = _first_text(category_value.get("slug"))
        else:
            category_id = _first_text(category_value)

        if category_id and not category_slug:
            category_slug = self._load_category_slug_map().get(category_id)

        snapshot = ProductSnapshot(
            name=_first_text(payload.get("name")),
            category_id=category_id,
            category_slug=category_slug,
        )
        self._product_cache[product_key] = snapshot
        return snapshot


class Command(BaseCommand):
    help = "Backfill historical order snapshots from user-service and product-service"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Simulate updates without writing to the database")
        parser.add_argument(
            "--replace-existing",
            action="store_true",
            help="Overwrite existing snapshot fields instead of only filling missing values",
        )
        parser.add_argument("--order-id", dest="order_id", help="Backfill a single order by ID")
        parser.add_argument("--limit", type=int, default=0, help="Process at most N orders")

    def handle(self, *args, **options):
        dry_run = bool(options.get("dry_run"))
        replace_existing = bool(options.get("replace_existing"))
        order_id = options.get("order_id")
        limit = int(options.get("limit") or 0)

        user_service_url = os.getenv("USER_SERVICE_URL", "http://user-service:8001/api")
        product_service_url = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8003/api")
        admin_username = os.getenv("USER_SERVICE_ADMIN_USERNAME") or os.getenv("ORDER_BACKFILL_ADMIN_USERNAME")
        admin_password = os.getenv("USER_SERVICE_ADMIN_PASSWORD") or os.getenv("ORDER_BACKFILL_ADMIN_PASSWORD")
        access_token = os.getenv("USER_SERVICE_ACCESS_TOKEN") or os.getenv("ORDER_BACKFILL_ACCESS_TOKEN")

        client = OrderSnapshotBackfillClient(
            user_service_url=user_service_url,
            product_service_url=product_service_url,
        )
        if access_token:
            client.set_access_token(access_token)
        elif admin_username and admin_password:
            try:
                client.login_admin(admin_username, admin_password)
            except requests.RequestException as exc:
                raise CommandError(f"Failed to authenticate with user-service: {exc}") from exc
        else:
            raise CommandError(
                "Missing credentials. Set USER_SERVICE_ACCESS_TOKEN or USER_SERVICE_ADMIN_USERNAME/USER_SERVICE_ADMIN_PASSWORD"
            )

        queryset = Order.objects.prefetch_related("items").all().order_by("created_at", "id")
        if order_id:
            queryset = queryset.filter(id=order_id)
        if limit > 0:
            queryset = queryset[:limit]

        processed_orders = 0
        updated_orders = 0
        updated_items = 0
        skipped_orders = 0
        skipped_items = 0
        missing_customers = 0
        missing_products = 0

        for order in queryset.iterator(chunk_size=100):
            processed_orders += 1
            order_changed = False
            shipping_address = order.shipping_address if isinstance(order.shipping_address, dict) else {}
            original_shipping_address = dict(shipping_address)

            customer_name = _first_text(shipping_address.get("recipient_name"), shipping_address.get("username"))
            customer_phone = _first_text(
                shipping_address.get("recipient_phone"),
                shipping_address.get("phone_number"),
                shipping_address.get("phone"),
            )

            if replace_existing or not customer_name or not customer_phone:
                customer_profile = client.get_customer_profile(str(order.user_id))
                if customer_profile:
                    profile_name = _first_text(customer_profile.get("username"), customer_profile.get("first_name"))
                    profile_phone = _first_text(customer_profile.get("phone_number"))
                    if profile_name and (replace_existing or not shipping_address.get("recipient_name")):
                        shipping_address["recipient_name"] = profile_name
                        shipping_address.setdefault("username", profile_name)
                        order_changed = True
                    if profile_phone and (replace_existing or not shipping_address.get("recipient_phone")):
                        shipping_address["recipient_phone"] = profile_phone
                        shipping_address.setdefault("phone_number", profile_phone)
                        order_changed = True
                else:
                    missing_customers += 1

            for order_item in order.items.all():
                item_changed = False
                product_snapshot = None

                if replace_existing or not order_item.name_product or not order_item.category_slug or not order_item.category_id:
                    product_snapshot = client.get_product_snapshot(str(order_item.product_id))
                    if product_snapshot is None:
                        missing_products += 1
                    else:
                        if product_snapshot.name and (replace_existing or not order_item.name_product):
                            order_item.name_product = product_snapshot.name
                            item_changed = True
                        if product_snapshot.category_id and (replace_existing or not order_item.category_id):
                            order_item.category_id = product_snapshot.category_id
                            item_changed = True
                        if product_snapshot.category_slug and (replace_existing or not order_item.category_slug):
                            order_item.category_slug = product_snapshot.category_slug
                            item_changed = True

                if item_changed:
                    updated_items += 1
                    if not dry_run:
                        order_item.save(update_fields=["name_product", "category_id", "category_slug"])
                else:
                    skipped_items += 1

            if shipping_address != original_shipping_address:
                order.shipping_address = shipping_address
                order_changed = True

            if order_changed:
                updated_orders += 1
                if not dry_run:
                    order.save(update_fields=["shipping_address", "updated_at"])
            else:
                skipped_orders += 1

        summary = {
            "processed_orders": processed_orders,
            "updated_orders": updated_orders,
            "updated_items": updated_items,
            "skipped_orders": skipped_orders,
            "skipped_items": skipped_items,
            "missing_customers": missing_customers,
            "missing_products": missing_products,
            "dry_run": dry_run,
            "replace_existing": replace_existing,
        }

        self.stdout.write(self.style.SUCCESS(json.dumps(summary, ensure_ascii=False, indent=2)))
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run only: no changes were written to the database."))