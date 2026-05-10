# infrastructure/models/product_model.py
from django.db import models
import uuid
from modules.domain.entities.product import (
    ProductStatus as DomainStatus,
    Origin as DomainOrigin,
    Language as DomainLanguage,
    Gender as DomainGender,
    Size as DomainSize,
    Color as DomainColor,
    Material as DomainMaterial,
    Season as DomainSeason,
    Condition as DomainCondition
)
from modules.infrastructure.querysets.product_queryset import ProductQuerySet
from .category_model import CategoryModel
from .author_model import AuthorModel
from .publisher_model import PublisherModel
from .brand_model import BrandModel

# --- MAIN PRODUCT MODEL (Base) ---

class ProductModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(null=True, max_length=255)
    slug = models.SlugField(db_index=True, null=True, unique=True, blank=True) # THÊM SLUG
    category = models.ForeignKey(CategoryModel, db_index=True, on_delete=models.PROTECT, related_name='products')
    origin = models.CharField(db_index=True, null=True, max_length=50, choices=[(tag.value, tag.value) for tag in DomainOrigin])
    price = models.FloatField(db_index=True)
    import_price = models.FloatField(db_index=True) # Đổi tên cho chuẩn snake_case
    stock = models.BigIntegerField(db_index=True) 
    rating = models.FloatField(db_index=True, default=0.0)
    status = models.CharField(
        db_index=True,
        max_length=20, 
        choices=[(tag.value, tag.value) for tag in DomainStatus], 
        default=DomainStatus.NEW.value
    )
    view_count = models.BigIntegerField(db_index=True, default=0) # Đổi tên cho chuẩn
    created_at = models.DateTimeField(auto_now_add=True) # Đổi tên
    updated_at = models.DateTimeField(auto_now=True) # Đổi tên
    brand = models.ForeignKey(BrandModel, db_index=True, null=True, on_delete=models.PROTECT)
    color = models.CharField(db_index=True, null=True, max_length=50, choices=[(tag.value, tag.value) for tag in DomainColor])
    objects = ProductQuerySet.as_manager()
    # Thêm property để lấy avatar tương thích với Entity
    @property
    def avatar(self):
        return self.images.filter(is_avatar=True).first()
    class Meta:
        db_table = 'products'

# --- SUB-PRODUCT MODELS (Inheritance) ---

class BookModel(ProductModel):
    author = models.ForeignKey(AuthorModel, db_index=True, on_delete=models.PROTECT)
    publisher = models.ForeignKey(PublisherModel, db_index=True, on_delete=models.PROTECT)
    pub_date = models.CharField(null=True, max_length=50)
    # Cập nhật Language Enum
    LANGUAGE_CHOICES = [(tag.value, tag.value) for tag in DomainLanguage]
    language = models.CharField(db_index=True, null=True, max_length=50, choices=LANGUAGE_CHOICES)
    page_count = models.IntegerField(null=True)
    format = models.CharField(db_index=True, null=True, max_length=50)
    description = models.TextField(null=True, blank=True) # Thêm description riêng cho sách
    class Meta:
        db_table = 'books'
        verbose_name = 'book'
        verbose_name_plural = 'books'

class FashionModel(ProductModel):
    SIZE_CHOICES = [(tag.value, tag.value) for tag in DomainSize]
    size = models.CharField(db_index=True, null=True, max_length=20, choices=SIZE_CHOICES)
    COLOR_CHOICES = [(tag.value, tag.value) for tag in DomainColor]
    MATERIAL_CHOICES = [(tag.value, tag.value) for tag in DomainMaterial]
    material = models.CharField(db_index=True, null=True, max_length=100, choices=MATERIAL_CHOICES)
    SEASON_CHOICES = [(tag.value, tag.value) for tag in DomainSeason]
    season = models.CharField(db_index=True, null=True, max_length=50, choices=SEASON_CHOICES)
    # Cập nhật Gender Enum
    GENDER_CHOICES = [(tag.value, tag.value) for tag in DomainGender]
    gender = models.CharField(db_index=True, null=True, max_length=20, choices=GENDER_CHOICES)

    class Meta:
        db_table = 'fashion_products'
        verbose_name = 'fashion_product'
        verbose_name_plural = 'fashion_products'

class ElectronicModel(ProductModel):
    model = models.CharField(db_index=True, null=True, max_length=100)
    tech_spec = models.JSONField(null=True, blank=True) # Lưu thông số kỹ thuật dưới dạng JSON
    warranty_period = models.DateField(db_index=True, null=True)
    condition = models.CharField(db_index=True, null=True, max_length=50, choices=[(tag.value, tag.value) for tag in DomainCondition])
    voltage = models.FloatField(db_index=True, null=True)

    class Meta:
        db_table = 'electronic_products'
        verbose_name = 'electronic_product'
        verbose_name_plural = 'electronic_products'


