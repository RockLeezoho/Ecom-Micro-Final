from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)),
                ('user_id', models.UUIDField(db_index=True, verbose_name='ID khách hàng')),
                ('total_price', models.DecimalField(db_index=True, max_digits=15, decimal_places=2, verbose_name='Tổng tiền đơn hàng')),
                ('shipping_fee', models.DecimalField(db_index=True, max_digits=12, decimal_places=2, default=0.0, verbose_name='Phí vận chuyển')),
                ('carrier', models.CharField(max_length=255, blank=True, null=True, db_index=True, verbose_name='Đơn vị vận chuyển')),
                ('status', models.CharField(db_index=True, max_length=20, default='PENDING')),
                ('shipping_method', models.CharField(db_index=True, max_length=30, default='STANDARD')),
                ('tracking_number', models.CharField(db_index=True, max_length=100, blank=True, null=True, verbose_name='Mã vận đơn hiển thị nhanh')),
                ('shipping_address', models.JSONField(verbose_name='Địa chỉ giao hàng snapshot')),
                ('note', models.TextField(blank=True, null=True, verbose_name='Ghi chú của khách hàng')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('confirmed_by', models.UUIDField(null=True, blank=True, verbose_name='ID nhân viên xác nhận')),
                ('confirmed_at', models.DateTimeField(null=True, blank=True)),
                ('is_paid', models.BooleanField(db_index=True, default=False)),
            ],
            options={
                'db_table': 'orders',
                'verbose_name': 'Đơn hàng',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)),
                ('product_id', models.UUIDField(db_index=True, verbose_name='ID sản phẩm')),
                ('name_product', models.CharField(max_length=255, null=True, blank=True, db_index=True, verbose_name='Snapshot tên sản phẩm')),
                ('category_id', models.UUIDField(db_index=True, null=True, blank=True, verbose_name='Snapshot ID danh mục')),
                ('category_slug', models.CharField(max_length=255, null=True, blank=True, db_index=True, verbose_name='Snapshot slug danh mục')),
                ('quantity', models.PositiveIntegerField(db_index=True, default=1, verbose_name='Số lượng')),
                ('sales_price', models.DecimalField(db_index=True, max_digits=12, decimal_places=2, verbose_name='Giá tại thời điểm mua')),
                ('order', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='items', to='order.order', db_index=True)),
            ],
            options={
                'db_table': 'order_items',
            },
        ),
        migrations.CreateModel(
            name='OrderPayment',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)),
                ('payment_method', models.CharField(db_index=True, max_length=30)),
                ('status', models.CharField(db_index=True, max_length=20, default='PENDING')),
                ('transaction_id', models.CharField(db_index=True, max_length=255, null=True, blank=True)),
                ('gateway_response', models.JSONField(null=True, blank=True)),
                ('amount', models.DecimalField(db_index=True, max_digits=15, decimal_places=2)),
                ('paid_at', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='payments', to='order.order', db_index=True)),
            ],
            options={
                'db_table': 'order_payments',
            },
        ),
        migrations.CreateModel(
            name='OrderTimeline',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)),
                ('previous_status', models.CharField(db_index=True, max_length=20)),
                ('current_status', models.CharField(db_index=True, max_length=20)),
                ('changed_by', models.UUIDField(verbose_name='ID người thực hiện (User/Staff)')),
                ('note', models.TextField(blank=True, null=True, verbose_name='Lý do thay đổi/Ghi chú của nhân viên')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='timeline', to='order.order', db_index=True)),
            ],
            options={
                'db_table': 'order_timeline',
            },
        ),
    ]
