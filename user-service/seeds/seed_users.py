import csv
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from apps.users.models import Admin, Staff, Customer, Address

class Command(BaseCommand):
    help = 'Read users.csv and seed into Database'

    def handle(self, *args, **kwargs):
        file_path = 'data_raw/users.csv'
        self.stdout.write(f"Reading {file_path}...")

        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    role = row['role']
                    user_data = {
                        'id': row['id'],
                        'username': row['username'],
                        'email': row['email'],
                        'password': make_password("password123"), # Mật khẩu mặc định
                        'first_name': row['first_name'],
                        'last_name': row['last_name'],
                        'phone_number': row['phone'],
                        'gender': row['gender'],
                        'date_of_birth': row['dob'] if row['dob'] else None,
                        'role': role
                    }

                    if role == 'admin':
                        Admin.objects.update_or_create(id=row['id'], defaults=user_data)
                    elif role == 'staff':
                        Staff.objects.update_or_create(id=row['id'], defaults=user_data)
                    else: # customer
                        customer, created = Customer.objects.update_or_create(id=row['id'], defaults=user_data)
                        # Tạo địa chỉ mẫu cho khách hàng
                        Address.objects.get_or_create(user=customer, defaults={'address': "Số 1 Lý Tự Trọng, Quận 1, TP.HCM"})

                self.stdout.write(self.style.SUCCESS('Successfully seeded users from CSV!'))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR('File data_raw/users.csv not found!'))