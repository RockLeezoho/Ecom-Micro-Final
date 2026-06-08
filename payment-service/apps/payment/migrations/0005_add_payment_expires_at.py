from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('payment', '0004_remove_payment_method_icon_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='expires_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
