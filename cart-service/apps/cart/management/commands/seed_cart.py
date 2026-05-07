import uuid

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cart.models import Cart, CartItem


class Command(BaseCommand):
    help = "Seed sample carts and cart items for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding cart data...")

        sample_carts = [
            {
                "user_id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                "items": [
                    {
                        "product_id": "7d469157-7988-4a0c-9961-895e2a03e5b3",
                        "sales_price": "249000.00",
                        "quantity": 2,
                    },
                    {
                        "product_id": "81e90485-1a01-4d64-b6cd-f47360fb7230",
                        "sales_price": "35650000.00",
                        "quantity": 1,
                    },
                ],
            },
            {
                "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "items": [
                    {
                        "product_id": "0d0bf2be-d582-44b2-a581-c8d506f07601",
                        "sales_price": "434000.00",
                        "quantity": 1,
                    },
                    {
                        "product_id": "0a76aba1-b052-4964-a0ab-f4814d413271",
                        "sales_price": "5995000.00",
                        "quantity": 3,
                    },
                ],
            },
            {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "items": [
                    {
                        "product_id": "ea6a088c-49cd-4b4b-9219-cacdb21f1816",
                        "sales_price": "404000.00",
                        "quantity": 4,
                    },
                ],
            },
        ]

        with transaction.atomic():
            for cart_data in sample_carts:
                cart, _ = Cart.objects.get_or_create(user_id=cart_data["user_id"])

                for item_data in cart_data["items"]:
                    CartItem.objects.update_or_create(
                        cart=cart,
                        product_id=uuid.UUID(item_data["product_id"]),
                        defaults={
                            "sales_price": item_data["sales_price"],
                            "quantity": item_data["quantity"],
                        },
                    )

        self.stdout.write(self.style.SUCCESS("Successfully seeded cart data!"))