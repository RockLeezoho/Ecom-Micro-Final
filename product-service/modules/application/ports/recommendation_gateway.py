from __future__ import annotations

from typing import Protocol


class RecommendationGateway(Protocol):
    def get_recommended_product_ids(self, category_id: str) -> list[str]:
        ...

    def get_related_product_ids(self, product_id: str) -> list[str]:
        ...
