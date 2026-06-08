import os

from django.apps import AppConfig
from django.conf import settings


class OrderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.order"
    
    def ready(self):
        if os.environ.get("RUN_MAIN") == "true" or not settings.DEBUG:
            try:
                from .consumers import start_payment_event_consumer

                start_payment_event_consumer()
            except Exception as exc:
                print(f"[OrderConfig] Failed to start payment consumer: {exc}")
