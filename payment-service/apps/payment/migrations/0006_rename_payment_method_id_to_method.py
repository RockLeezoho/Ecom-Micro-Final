from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payment', '0005_add_payment_expires_at'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='payment',
            name='method',
        ),
        migrations.AddField(
            model_name='payment',
            name='method',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='payment.paymentmethod', db_index=True),
            preserve_default=False,
        ),
    ]
