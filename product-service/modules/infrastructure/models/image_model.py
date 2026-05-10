from django.db import models
from modules.infrastructure.models.product_model import ProductModel

class ProductImageModel(models.Model):
    product = models.ForeignKey(ProductModel, db_index=True, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    public_id = models.CharField(db_index=True, max_length=255, blank=True, null=True)
    is_avatar = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        verbose_name = 'product_image'
        verbose_name_plural = 'product_images'

    def __str__(self):
        return f"{self.product.name} - {self.image_url}"