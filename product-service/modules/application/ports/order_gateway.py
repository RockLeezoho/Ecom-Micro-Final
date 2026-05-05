from __future__ import annotations

from typing import Protocol


class OrderGateway(Protocol):
    def get_best_seller_product_ids(self, category_id: str) -> list[str]:
        ...
