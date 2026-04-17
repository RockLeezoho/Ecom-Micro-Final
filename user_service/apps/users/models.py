from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("admin", "Admin"),
        ("staff", "Staff"),
    )
    
    full_name = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=15)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")

    # Username, password, and email are already available in AbstractUser.

    def __str__(self):
        return f"{self.username} ({self.role})"

class Admin(User):
    position = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Admin"

class Staff(User):
    employment_type = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Staff"

class Customer(User):
    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    foot_length = models.FloatField(null=True, blank=True) 

    class Meta:
        verbose_name = "Customer"

class ShippingAddress(models.Model):
    address = models.CharField(max_length=500)
    
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name="shipping_addresses"
    )

    def __str__(self):
        return f"Address: {self.address[:30]}... (Customer: {self.customer.username})"