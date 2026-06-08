from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.payment.models import Payment, PaymentMethod as PaymentMethodModel, PaymentStatus


class Command(BaseCommand):
    help = "Seed sample payments for development/testing"

    payment_method_rows = [
        {
            "code": "COD",
            "name": "Thanh toán khi nhận hàng (COD)",
            "description": "Thanh toán tiền mặt khi nhận hàng",
            "provider": None,
            "sort_order": 1,
        },
        {
            "code": "BANK_TRANSFER",
            "name": "Chuyển khoản ngân hàng",
            "description": "Thanh toán qua chuyển khoản",
            "provider": "bank",
            "sort_order": 2,
        }
    ]

    def seed_payment_methods(self):
        for row in self.payment_method_rows:
            PaymentMethodModel.objects.update_or_create(
                code=row["code"],
                defaults={
                    "name": row["name"],
                    "description": row["description"],
                    "provider": row["provider"],
                    "is_active": True,
                    "sort_order": row["sort_order"],
                },
            )

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding payment data...")

        sample_payments = [
            {
                "id": "aaaa1111-1111-1111-1111-111111111111",
                "order_id": "11111111-1111-1111-1111-111111111111",
                "user_id": "8d5b16e4-862d-4861-b4d2-79069d239c04",
                "amount": Decimal("35998000.00"),
                "currency": "VND",
                "method": "BANK_TRANSFER",
                "status": PaymentStatus.PENDING,
                "reference_number": "REF-ORDER-111111",
            },
            {
                "id": "bbbb2222-2222-2222-2222-222222222222",
                "order_id": "22222222-2222-2222-2222-222222222222",
                "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "amount": Decimal("18489500.00"),
                "currency": "VND",
                "method": "COD",
                "status": PaymentStatus.AWAITING_PAYMENT,
                "reference_number": "REF-ORDER-222222",
            }
        ]

        with transaction.atomic():
            self.seed_payment_methods()
            for payment_data in sample_payments:
                method_code = payment_data.get("method")
                method_obj = PaymentMethodModel.objects.filter(code__iexact=(method_code or '')).first()
                if method_obj is None:
                    self.stdout.write(self.style.WARNING(f"PaymentMethod '{method_code}' not found; skipping payment {payment_data['id']}"))
                    continue
                Payment.objects.update_or_create(
                    id=payment_data["id"],
                    defaults={
                        "order_id": payment_data["order_id"],
                        "user_id": payment_data["user_id"],
                        "amount": payment_data["amount"],
                        "currency": payment_data["currency"],
                        "method": method_obj,
                        "status": payment_data["status"],
                        "reference_number": payment_data["reference_number"],
                        "external_transaction_id": payment_data.get("external_transaction_id"),
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded payment data!"))