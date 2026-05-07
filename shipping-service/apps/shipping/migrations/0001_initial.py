# Generated migration for Shipping Service

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Carrier',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, verbose_name='Tên đơn vị vận chuyển')),
                ('code', models.CharField(max_length=50, unique=True, verbose_name='Mã định danh (GHTK, GHN...)')),
                ('contact_number', models.CharField(blank=True, max_length=20, null=True)),
                ('is_active', models.BooleanField(default=True, verbose_name='Đang hoạt động')),
            ],
            options={
                'verbose_name': 'Đơn vị vận chuyển',
                'db_table': 'carriers',
            },
        ),
        migrations.CreateModel(
            name='Shipment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('order_id', models.UUIDField(db_index=True, verbose_name='ID đơn hàng')),
                ('user_id', models.UUIDField(db_index=True, verbose_name='ID khách hàng')),
                ('carrier_shipment_id', models.CharField(blank=True, max_length=100, null=True, verbose_name='ID vận đơn bên đối tác')),
                ('method', models.CharField(choices=[('STANDARD', 'Giao hàng tiêu chuẩn'), ('EXPRESS', 'Giao hàng hỏa tốc')], default='STANDARD', max_length=20)),
                ('status', models.CharField(choices=[('PREPARING', 'Đang chuẩn bị hàng'), ('READY_FOR_PICKUP', 'Sẵn sàng lấy hàng'), ('PICKED_UP', 'Đã lấy hàng'), ('IN_TRANSIT', 'Đang vận chuyển'), ('DELIVERED', 'Đã giao hàng thành công'), ('RETURNED', 'Đã trả hàng'), ('FAILED', 'Giao hàng thất bại')], db_index=True, default='PREPARING', max_length=20)),
                ('shipping_address_snapshot', models.JSONField(verbose_name='Địa chỉ giao hàng thực tế')),
                ('weight', models.FloatField(default=0.0, verbose_name='Trọng lượng (kg)')),
                ('length', models.FloatField(default=0.0, verbose_name='Chiều dài (cm)')),
                ('width', models.FloatField(default=0.0, verbose_name='Chiều rộng (cm)')),
                ('height', models.FloatField(default=0.0, verbose_name='Chiều cao (cm)')),
                ('shipping_fee', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('tracking_number', models.CharField(blank=True, db_index=True, max_length=100, null=True, unique=True)),
                ('estimated_delivery_at', models.DateTimeField(blank=True, null=True)),
                ('shipped_at', models.DateTimeField(blank=True, null=True)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('carrier', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='shipments', to='shipping.carrier', verbose_name='Đơn vị vận chuyển')),
            ],
            options={
                'db_table': 'shipments',
            },
        ),
        migrations.CreateModel(
            name='ShipmentLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(max_length=50)),
                ('location', models.CharField(blank=True, max_length=255, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('shipment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='shipping.shipment')),
            ],
            options={
                'db_table': 'shipment_logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
