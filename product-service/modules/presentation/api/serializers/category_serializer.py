# from rest_framework import serializers
# from product_service.modules.infrastructure.models.category_model import CategoryModel
# from product_service.modules.infrastructure.models.subcategory_model import SubcategoryModel

from rest_framework import serializers
from modules.infrastructure.models.category_model import CategoryModel

class CategorySerializer(serializers.ModelSerializer):
	children = serializers.SerializerMethodField()

	class Meta:
		model = CategoryModel
		fields = ('id', 'name', 'slug', 'description', 'children')

	def get_children(self, obj):
		children = obj.children.all()
		return CategorySerializer(children, many=True).data

class CategoryFlatSerializer(serializers.ModelSerializer):
	"""Flat category serializer without nested children."""
	parent_id = serializers.SerializerMethodField()

	class Meta:
		model = CategoryModel
		fields = ('id', 'name', 'slug', 'description', 'parent_id')

	def get_parent_id(self, obj):
		return str(obj.parent_id) if obj.parent_id else None
