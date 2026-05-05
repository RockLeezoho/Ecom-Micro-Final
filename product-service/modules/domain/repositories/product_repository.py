from abc import ABC, abstractmethod
from typing import List, Optional
from modules.domain.entities.product import Product

class ProductRepository(ABC):
	@abstractmethod
	def get_by_id(self, product_id: str) -> Optional[Product]:
		pass

	@abstractmethod
	def list(self, *, category_id: Optional[str] = None) -> List[Product]:
		pass

	@abstractmethod
	def create(self, product: Product) -> Product:
		pass

	@abstractmethod
	def update(self, product: Product) -> Product:
		pass

	@abstractmethod
	def delete(self, product_id: str) -> None:
		pass
