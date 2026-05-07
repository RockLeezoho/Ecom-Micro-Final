import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Cart',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.UUIDField(db_index=True, verbose_name='ID người dùng')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'carts',
                'verbose_name': 'Giỏ hàng',
            },
        ),
        migrations.CreateModel(
            name='CartItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('product_id', models.UUIDField(db_index=True, verbose_name='ID sản phẩm')),
                ('sales_price', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Giá bán')),
                ('quantity', models.PositiveIntegerField(default=1, verbose_name='Số lượng')),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='cart.cart')),
            ],
            options={
                'db_table': 'cart_items',
                'verbose_name': 'Vật phẩm giỏ hàng',
                'unique_together': {('cart', 'product_id')},
            },
        ),
    ]