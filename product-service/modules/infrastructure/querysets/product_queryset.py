from django.db import models
from django.db.models import Q

class ProductQuerySet(models.QuerySet):
    def search_by_keyword(self, keyword: str):
        if not keyword:
            return self
        # Search across product fields and related names/slugs to avoid invalid FK lookups
        return self.filter(
            Q(name__icontains=keyword) |
            Q(slug__icontains=keyword) |
            Q(category__name__icontains=keyword) |
            Q(category__slug__icontains=keyword) |
            Q(brand__name__icontains=keyword)
        )

    def is_selling_and_high_rating(self):
        return self.filter(
            status='SELLING',
            rating__gte=4.0
        )