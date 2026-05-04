from django.db import models
from django.db.models import Q

class ProductQuerySet(models.QuerySet):
    def search_by_keyword(self, keyword: str):
        if not keyword:
            return self
        return self.filter(
            Q(name__icontains=keyword) | 
            Q(category__icontains=keyword) |
            Q(subcategory__icontains=keyword)
        )

    def is_selling_and_high_rating(self):
        return self.filter(
            status='SELLING',
            rating__gte=4.0
        )