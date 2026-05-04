from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from modules.infrastructure.models.product_model import ProductModel
from django.core.cache import cache
import requests
from django.conf import settings

def clear_product_cache(product_id):
    cache.delete(f"product_detail_{product_id}")
    cache.delete("homepage_data")

@receiver(post_save, sender=ProductModel)
def product_saved(sender, instance, **kwargs):
    clear_product_cache(instance.id)
    notify_ai_service(instance.id)

@receiver(post_delete, sender=ProductModel)
def product_deleted(sender, instance, **kwargs):
    clear_product_cache(instance.id)
    notify_ai_service(instance.id)

def notify_ai_service(product_id):
    # Example: HTTP call to AI service (replace with gRPC if needed)
    try:
        url = getattr(settings, 'AI_SERVICE_NOTIFY_URL', None)
        if url:
            requests.post(url, json={"product_id": str(product_id)})
    except Exception:
        pass
