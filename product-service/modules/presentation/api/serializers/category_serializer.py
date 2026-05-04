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
