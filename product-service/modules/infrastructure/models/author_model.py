# infrastructure/models/author_model.py
from django.db import models
import uuid

class AuthorModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'authors'
        verbose_name = 'author'
        verbose_name_plural = 'authors'

    def __str__(self):
        return self.name