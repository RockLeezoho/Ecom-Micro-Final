from django.db import migrations, models
import uuid


def seed_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payment', 'PaymentMethod')
    rows = [
        {
            'code': 'COD',
            'name': 'Thanh toán khi nhận hàng (COD)',
            'description': 'Thanh toán tiền mặt khi nhận hàng',
            'provider': None,
            'icon_url': None,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'code': 'BANK_TRANSFER',
            'name': 'Chuyển khoản ngân hàng',
            'description': 'Thanh toán qua chuyển khoản',
            'provider': 'bank',
            'icon_url': None,
            'is_active': True,
            'sort_order': 2,
        },
        {
            'code': 'E_WALLET',
            'name': 'Ví điện tử',
            'description': 'Thanh toán qua ví điện tử',
            'provider': 'wallet',
            'icon_url': None,
            'is_active': True,
            'sort_order': 3,
        },
        {
            'code': 'CREDIT_CARD',
            'name': 'Thẻ tín dụng',
            'description': 'Thanh toán bằng thẻ tín dụng',
            'provider': 'card',
            'icon_url': None,
            'is_active': True,
            'sort_order': 4,
        },
    ]

    for row in rows:
        PaymentMethod.objects.update_or_create(
            code=row['code'],
            defaults={
                'name': row['name'],
                'description': row['description'],
                'provider': row['provider'],
                'icon_url': row['icon_url'],
                'is_active': row['is_active'],
                'sort_order': row['sort_order'],
            },
        )


def unseed_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payment', 'PaymentMethod')
    PaymentMethod.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('payment', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentMethod',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code', models.CharField(db_index=True, max_length=30, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('provider', models.CharField(blank=True, max_length=50, null=True)),
                ('icon_url', models.URLField(blank=True, null=True)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('sort_order', models.PositiveIntegerField(db_index=True, default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'payment_methods',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.RunPython(seed_payment_methods, reverse_code=unseed_payment_methods),
    ]
