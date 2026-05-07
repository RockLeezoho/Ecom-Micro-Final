from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class CategoryReadModel:
    """Read model for Category (for queries)."""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    children: list[CategoryReadModel] = None

    def __post_init__(self):
        if self.children is None:
            object.__setattr__(self, 'children', [])
