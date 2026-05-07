from __future__ import annotations

from modules.application.ports.category_repository import CategoryRepository
from modules.application.read_models.category_read_models import CategoryReadModel
from modules.domain.entities.category import Category


class CategoryService:
    """Application service for Category queries."""

    def __init__(self, category_repository: CategoryRepository):
        self.category_repository = category_repository

    def get_homepage_categories(self, limit: int = 100) -> list[CategoryReadModel]:
        """
        Get parent categories with nested children for homepage display.
        Returns categories in hierarchical structure.
        """
        categories = self.category_repository.get_all_parent_categories(limit=limit)
        return [self._to_read_model(cat) for cat in categories]

    def get_all_categories_flat(self, limit: int = 100) -> list[CategoryReadModel]:
        """
        Get all categories (parent + children) in flat list.
        Useful for navigation bars, dropdowns.
        """
        categories = self.category_repository.get_all_categories_flat(limit=limit)
        return [self._to_flat_read_model(cat) for cat in categories]

    def _to_read_model(self, category: Category) -> CategoryReadModel:
        """Map domain Category entity to read model (nested)."""
        children = [self._to_read_model(child) for child in category.children]
        return CategoryReadModel(
            id=str(category.id),
            name=category.name,
            slug=category.slug,
            description=category.description,
            parent_id=str(category.parent.id) if category.parent else None,
            children=children,
        )

    def _to_flat_read_model(self, category: Category) -> CategoryReadModel:
        """Map domain Category entity to read model (flat - no nested children)."""
        return CategoryReadModel(
            id=str(category.id),
            name=category.name,
            slug=category.slug,
            description=category.description,
            parent_id=str(category.parent.id) if category.parent else None,
            children=[],  # Empty for flat representation
        )

    def get_all_categories_nested(self, limit: int = 100) -> list[CategoryReadModel]:
        """
        Get all parent categories with nested children (hierarchical structure).
        Same as get_homepage_categories but with explicit naming.
        """
        return self.get_homepage_categories(limit=limit)
