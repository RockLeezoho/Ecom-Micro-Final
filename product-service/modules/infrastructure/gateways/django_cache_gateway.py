from __future__ import annotations

from django.core.cache import cache

from modules.application.ports.cache_gateway import CacheGateway


class DjangoCacheGateway(CacheGateway):
    def get(self, key: str, default=None):
        return cache.get(key, default)

    def set(self, key: str, value, timeout: int | None = None) -> None:
        cache.set(key, value, timeout=timeout)
