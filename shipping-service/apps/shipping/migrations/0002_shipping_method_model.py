from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('shipping', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ShippingMethod',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code', models.CharField(db_index=True, max_length=20, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('fee', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('sort_order', models.PositiveIntegerField(db_index=True, default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'shipping_methods',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.AlterField(
            model_name='shipment',
            name='method',
            field=models.CharField(default='STANDARD', max_length=20),
        ),
    ]
