from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.payment.models import Payment, PaymentMethod, PaymentStatus


class Command(BaseCommand):
    help = "Seed sample payments for development/testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding payment data...")

        sample_payments = [
            {
                "id": "aaaa1111-1111-1111-1111-111111111111",
                "order_id": "11111111-1111-1111-1111-111111111111",
                "user_id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                "amount": Decimal("35998000.00"),
                "currency": "VND",
                "method": PaymentMethod.BANK_TRANSFER,
                "status": PaymentStatus.PENDING,
                "reference_number": "REF-ORDER-111111",
            },
            {
                "id": "bbbb2222-2222-2222-2222-222222222222",
                "order_id": "22222222-2222-2222-2222-222222222222",
                "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "amount": Decimal("18489500.00"),
                "currency": "VND",
                "method": PaymentMethod.COD,
                "status": PaymentStatus.AWAITING_PAYMENT,
                "reference_number": "REF-ORDER-222222",
            },
            {
                "id": "cccc3333-3333-3333-3333-333333333333",
                "order_id": "33333333-3333-3333-3333-333333333333",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "amount": Decimal("1616000.00"),
                "currency": "VND",
                "method": PaymentMethod.CREDIT_CARD,
                "status": PaymentStatus.COMPLETED,
                "reference_number": "REF-ORDER-333333",
                "external_transaction_id": "SIM-33333333",
            },
        ]

        with transaction.atomic():
            for payment_data in sample_payments:
                Payment.objects.update_or_create(
                    id=payment_data["id"],
                    defaults={
                        "order_id": payment_data["order_id"],
                        "user_id": payment_data["user_id"],
                        "amount": payment_data["amount"],
                        "currency": payment_data["currency"],
                        "method": payment_data["method"],
                        "status": payment_data["status"],
                        "reference_number": payment_data["reference_number"],
                        "external_transaction_id": payment_data.get("external_transaction_id"),
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded payment data!"))