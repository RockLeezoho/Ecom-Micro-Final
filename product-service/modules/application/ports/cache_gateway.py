from __future__ import annotations

from typing import Protocol, Any


class CacheGateway(Protocol):
    def get(self, key: str, default: Any = None) -> Any:
        ...

    def set(self, key: str, value: Any, timeout: int | None = None) -> None:
        ...
