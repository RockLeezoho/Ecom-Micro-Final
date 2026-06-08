from enum import Enum

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ROLE_CHOICES = (
        ("CUSTOMER", "CUSTOMER"),
        ("ADMIN", "ADMIN"),
        ("STAFF", "STAFF"),
    )

    GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    )
    
    phone_number = models.CharField(max_length=10)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True, null=True, choices=GENDER_CHOICES, default="other")
    is_active = models.BooleanField(default=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    role = models.CharField(db_index=True, max_length=20, choices=ROLE_CHOICES, default="CUSTOMER")

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

class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=500)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="id",
        db_column="user_id",
        on_delete=models.CASCADE,
        related_name="addresses"
    )

    def __str__(self):
        return f"Address: {self.address[:30]}... (User: {self.user.username})"

class ProductStatus(str, Enum):
    NEW = "NEW"
    SELLING = "SELLING"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    DISCONTINUED = "DISCONTINUED"
    
class FavoriteProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="id",
        db_column="customer_id",
        on_delete=models.CASCADE,
        related_name="favorite_products",
    )
    product_id = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    origin = models.CharField(max_length=255, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[(tag.value, tag.value) for tag in ProductStatus], default=ProductStatus.NEW.value)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["customer", "product_id"], name="unique_customer_favorite_product")
        ]

    def __str__(self):
        return f"{self.customer_id}:{self.product_id}"