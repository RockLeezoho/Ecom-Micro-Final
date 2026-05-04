from modules.infrastructure.models.product_model import ProductModel
from django.shortcuts import get_object_or_404

class GetProductDetailQuery:
	@staticmethod
	def by_slug(slug: str):
		return get_object_or_404(ProductModel.objects.select_related('category', 'brand', 'author'), slug=slug)

	@staticmethod
	def by_id(product_id):
		return get_object_or_404(ProductModel.objects.select_related('category', 'brand', 'author'), id=product_id)
