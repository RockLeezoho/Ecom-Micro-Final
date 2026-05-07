import pytest
from unittest.mock import Mock

from modules.application.services.category_service import CategoryService
from modules.domain.entities.category import Category


def make_category(cat_id: str, name: str, parent: Category = None) -> Category:
    return Category(
        id=cat_id,
        name=name,
        slug=name.lower(),
        description=f"{name} description",
        parent=parent,
        children=[],
    )


def test_get_homepage_categories_returns_nested_structure():
    # Arrange
    books = make_category("c1", "Books")
    electronics = make_category("c2", "Electronics")
    novels = make_category("c3", "Novels", parent=books)
    books.children.append(novels)

    repo = Mock()
    repo.get_all_parent_categories.return_value = [books, electronics]

    service = CategoryService(category_repository=repo)

    # Act
    result = service.get_homepage_categories()

    # Assert
    assert len(result) == 2
    assert result[0].name == "Books"
    assert len(result[0].children) == 1
    assert result[0].children[0].name == "Novels"
    assert result[1].name == "Electronics"
    repo.get_all_parent_categories.assert_called_once()


def test_get_all_categories_flat_returns_flat_list():
    # Arrange
    books = make_category("c1", "Books")
    novels = make_category("c3", "Novels", parent=books)
    electronics = make_category("c2", "Electronics")

    repo = Mock()
    repo.get_all_categories_flat.return_value = [books, novels, electronics]

    service = CategoryService(category_repository=repo)

    # Act
    result = service.get_all_categories_flat()

    # Assert
    assert len(result) == 3
    assert result[0].name == "Books"
    assert result[0].parent_id is None
    assert result[1].name == "Novels"
    assert result[1].parent_id == "c1"  # parent Books
    assert result[2].name == "Electronics"
    assert result[2].parent_id is None
    repo.get_all_categories_flat.assert_called_once()
