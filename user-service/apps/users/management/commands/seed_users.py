import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from apps.users.models import Admin, Staff, Customer, Address


class Command(BaseCommand):
    help = 'Seeds the database with 3 specific users using UUIDs: Admin, Staff, and Customer'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding users...")
        
        ADMIN_UUID = "550e8400-e29b-41d4-a716-446655440000"
        STAFF_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
        CUSTOMER_UUID = "8d5b16e4-862d-4861-b4d2-79069d239c04"

        if not Admin.objects.filter(id=ADMIN_UUID).exists():
            admin_user = Admin.objects.create(
                id=ADMIN_UUID,
                username="admin_boss",
                email="admin@example.com",
                password=make_password("password123"),
                first_name="Hùng",
                last_name="Nguyễn",
                phone_number="0901234567",
                role="admin",
                position="System Director",
                gender="Male",
                date_of_birth=datetime.date(1985, 5, 20)
            )
            self.stdout.write(self.style.SUCCESS(f"Created Admin: {admin_user.username} (ID: {admin_user.id})"))

        if not Staff.objects.filter(id=STAFF_UUID).exists():
            staff_user = Staff.objects.create(
                id=STAFF_UUID,
                username="staff_kane",
                email="staff@example.com",
                password=make_password("password123"),
                first_name="Lan",
                last_name="Trần",
                phone_number="0907778889",
                role="staff",
                employment_type="Full-time",
                gender="Female",
                date_of_birth=datetime.date(1995, 10, 10)
            )
            self.stdout.write(self.style.SUCCESS(f"Created Staff: {staff_user.username} (ID: {staff_user.id})"))

        if not Customer.objects.filter(id=CUSTOMER_UUID).exists():
            customer_user = Customer.objects.create(
                id=CUSTOMER_UUID,
                username="customer_john",
                email="john@example.com",
                password=make_password("password123"),
                first_name="John",
                last_name="Doe",
                phone_number="0888999000",
                role="customer",
                height=175.5,
                weight=72.0,
                foot_length=26.5,
                gender="Male",
                date_of_birth=datetime.date(2000, 1, 1)
            )
            Address.objects.get_or_create(
                user=customer_user,
                defaults={'address': "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh"}
            )
            self.stdout.write(self.style.SUCCESS(f"Created Customer: {customer_user.username} (ID: {customer_user.id})"))

        self.stdout.write(self.style.SUCCESS('Successfully seeded 3 specific users with UUIDs!'))
