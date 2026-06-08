from django.db import migrations, models

def forwards(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role__iexact='customer').update(role='CUSTOMER')
    User.objects.filter(role__iexact='admin').update(role='ADMIN')
    User.objects.filter(role__iexact='staff').update(role='STAFF')

def backwards(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='CUSTOMER').update(role='customer')
    User.objects.filter(role='ADMIN').update(role='admin')
    User.objects.filter(role='STAFF').update(role='staff')

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_gender_field'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(db_index=True, max_length=20, choices=[('CUSTOMER', 'CUSTOMER'), ('ADMIN', 'ADMIN'), ('STAFF', 'STAFF')], default='CUSTOMER'),
        ),
    ]
