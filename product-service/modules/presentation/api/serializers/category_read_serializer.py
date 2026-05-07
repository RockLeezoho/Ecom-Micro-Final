from rest_framework import serializers


class CategoryReadModelSerializer(serializers.Serializer):
    """Serializer for CategoryReadModel (flat representation)."""
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    parent_id = serializers.CharField(allow_null=True)


class CategoryReadModelNestedSerializer(serializers.Serializer):
    """Serializer for CategoryReadModel with nested children."""
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        if obj.children:
            return CategoryReadModelNestedSerializer(obj.children, many=True).data
        return []
