# infrastructure/models/brand_model.py
from django.db import models
import uuid

class BrandModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    logoUrl = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'brands'
        verbose_name = 'brand'
        verbose_name_plural = 'brands'

    def __str__(self):
        return self.name