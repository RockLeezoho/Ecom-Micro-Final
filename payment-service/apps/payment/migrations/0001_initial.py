# Generated migration for Payment Service

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('order_id', models.UUIDField(db_index=True)),
                ('user_id', models.UUIDField(db_index=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('currency', models.CharField(default='VND', max_length=10)),
                ('method', models.CharField(choices=[('COD', 'Thanh toán khi nhận hàng'), ('BANK_TRANSFER', 'Chuyển khoản ngân hàng'), ('E_WALLET', 'Ví điện tử'), ('CREDIT_CARD', 'Thẻ tín dụng')], default='COD', max_length=30)),
                ('status', models.CharField(choices=[('PENDING', 'Đang chờ thanh toán'), ('AWAITING_PAYMENT', 'Đang chờ thanh toán COD'), ('PROCESSING', 'Đang xử lý'), ('COMPLETED', 'Thành công'), ('FAILED', 'Thất bại'), ('REFUNDED', 'Đã hoàn tiền')], db_index=True, default='PENDING', max_length=20)),
                ('reference_number', models.CharField(db_index=True, max_length=100, unique=True)),
                ('external_transaction_id', models.CharField(blank=True, db_index=True, max_length=100, null=True)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'payments',
            },
        ),
    ]
