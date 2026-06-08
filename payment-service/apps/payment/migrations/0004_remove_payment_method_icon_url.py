from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('payment', '0003_remove_payment_method_choices'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='paymentmethod',
            name='icon_url',
        ),
    ]
