from typing import Optional

from modules.application.ports.category_repository import CategoryRepository
from modules.domain.entities.category import Category
from modules.infrastructure.models.category_model import CategoryModel


class CategoryRepositoryImpl(CategoryRepository):
    """Concrete implementation of CategoryRepository using Django ORM."""

    def get_all_parent_categories(self, limit: int = 100) -> list[Category]:
        """
        Get all parent categories with nested children.
        Maps ORM models → domain entities.
        """
        models = CategoryModel.objects.filter(parent__isnull=True).prefetch_related('children')[:limit]
        return [self._to_entity(model) for model in models]

    def get_all_categories_flat(self, limit: int = 100) -> list[Category]:
        """
        Get all categories (parent + children) in flat list.
        Maps ORM models → domain entities.
        """
        models = CategoryModel.objects.all().order_by('parent_id', 'name')[:limit]
        return [self._to_entity(model) for model in models]

    def get_category_by_id(self, category_id: str) -> Optional[Category]:
        """Get a single category by ID."""
        try:
            model = CategoryModel.objects.prefetch_related('children').get(id=category_id)
            return self._to_entity(model)
        except CategoryModel.DoesNotExist:
            return None

    def get_category_by_slug(self, slug: str) -> Optional[Category]:
        """Get a single category by slug."""
        try:
            model = CategoryModel.objects.prefetch_related('children').get(slug=slug)
            return self._to_entity(model)
        except CategoryModel.DoesNotExist:
            return None

    def _to_entity(self, model: CategoryModel) -> Category:
        """Map ORM model → domain entity."""
        # Recursively map children
        children_entities = [self._to_entity(child) for child in model.children.all()]
        
        # Build parent reference (avoid infinite recursion by not loading full parent tree)
        parent_entity = None
        if model.parent:
            parent_entity = Category(
                id=str(model.parent.id),
                name=model.parent.name,
                slug=model.parent.slug,
                description=model.parent.description,
                parent=None,  # Don't load grandparent to avoid deep recursion
                children=[],
            )
        
        return Category(
            id=str(model.id),
            name=model.name,
            slug=model.slug,
            description=model.description,
            parent=parent_entity,
            children=children_entities,
        )
