# Generated migration for Order Service

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.UUIDField(db_index=True, verbose_name='ID khách hàng')),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=15, verbose_name='Tổng tiền đơn hàng')),
                ('shipping_fee', models.DecimalField(decimal_places=2, default=0.0, max_digits=12, verbose_name='Phí vận chuyển')),
                ('status', models.CharField(choices=[('PENDING', 'Chờ xác nhận'), ('PROCESSING', 'Đang xử lý'), ('SHIPPED', 'Đang giao hàng'), ('COMPLETED', 'Hoàn thành'), ('CANCELLED', 'Đã hủy')], db_index=True, default='PENDING', max_length=20)),
                ('shipping_method', models.CharField(choices=[('STANDARD', 'Giao hàng tiêu chuẩn'), ('EXPRESS', 'Giao hàng hỏa tốc')], default='STANDARD', max_length=30)),
                ('tracking_number', models.CharField(blank=True, max_length=100, null=True, verbose_name='Mã vận đơn hiển thị nhanh')),
                ('shipping_address', models.JSONField(verbose_name='Địa chỉ giao hàng snapshot')),
                ('note', models.TextField(blank=True, null=True, verbose_name='Ghi chú của khách hàng')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('confirmed_by', models.UUIDField(blank=True, null=True, verbose_name='ID nhân viên xác nhận')),
                ('confirmed_at', models.DateTimeField(blank=True, null=True)),
                ('is_paid', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Đơn hàng',
                'db_table': 'orders',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('product_id', models.UUIDField(db_index=True, verbose_name='ID sản phẩm')),
                ('quantity', models.PositiveIntegerField(default=1, verbose_name='Số lượng')),
                ('sales_price', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Giá tại thời điểm mua')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='order.order')),
            ],
            options={
                'db_table': 'order_items',
            },
        ),
        migrations.CreateModel(
            name='OrderTimeline',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('previous_status', models.CharField(max_length=20)),
                ('current_status', models.CharField(max_length=20)),
                ('changed_by', models.UUIDField(verbose_name='ID người thực hiện (User/Staff)')),
                ('note', models.TextField(blank=True, null=True, verbose_name='Lý do thay đổi/Ghi chú của nhân viên')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timeline', to='order.order')),
            ],
            options={
                'db_table': 'order_timeline',
            },
        ),
        migrations.CreateModel(
            name='OrderPayment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('payment_method', models.CharField(choices=[('COD', 'Thanh toán khi nhận hàng'), ('BANK_TRANSFER', 'Chuyển khoản ngân hàng'), ('E_WALLET', 'Ví điện tử'), ('CREDIT_CARD', 'Thẻ tín dụng')], max_length=30)),
                ('status', models.CharField(choices=[('PENDING', 'Chờ thanh toán'), ('AWAITING_PAYMENT', 'Đang chờ thanh toán COD'), ('PAID', 'Đã thanh toán'), ('FAILED', 'Thanh toán thất bại')], default='PENDING', max_length=20)),
                ('transaction_id', models.CharField(blank=True, max_length=255, null=True)),
                ('gateway_response', models.JSONField(blank=True, null=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='order.order')),
            ],
            options={
                'db_table': 'order_payments',
            },
        ),
    ]
