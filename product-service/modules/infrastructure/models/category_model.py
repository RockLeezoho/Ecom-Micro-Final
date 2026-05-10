from django.db import models
from django.utils.text import slugify
import uuid

class CategoryModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(db_index=True, unique=True, blank=True) # Thêm slug
    description = models.TextField(blank=True, null=True)
    
    parent = models.ForeignKey(
        'self', 
        db_index=True,
        on_delete=models.SET_NULL,
        null=True, 
        blank=True, 
        related_name='children'
    )

    class Meta:
        db_table = 'categories'
        verbose_name = 'category'
        verbose_name_plural = 'categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)