from abc import ABC, abstractmethod
from typing import Optional
from modules.domain.entities.category import Category


class CategoryRepository(ABC):
    """Repository interface for Category domain entity."""

    @abstractmethod
    def get_all_parent_categories(self, limit: int = 100) -> list[Category]:
        """Get all parent categories with nested children."""
        pass

    @abstractmethod
    def get_all_categories_flat(self, limit: int = 100) -> list[Category]:
        """Get all categories (parent + children) in flat list."""
        pass

    @abstractmethod
    def get_category_by_id(self, category_id: str) -> Optional[Category]:
        """Get a single category by ID."""
        pass

    @abstractmethod
    def get_category_by_slug(self, slug: str) -> Optional[Category]:
        """Get a single category by slug."""
        pass
