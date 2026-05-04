# infrastructure/models/publisher_model.py
from django.db import models
import uuid

class PublisherModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'publishers'
        verbose_name = 'publisher'
        verbose_name_plural = 'publishers'

    def __str__(self):
        return self.name