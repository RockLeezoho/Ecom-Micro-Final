from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('payment', '0002_payment_method_model'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='method',
            field=models.CharField(db_index=True, default='COD', max_length=30),
        ),
    ]
