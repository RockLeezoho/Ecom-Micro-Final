import csv
import json
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from modules.infrastructure.models.product_model import (
    CategoryModel, ProductModel, BookModel, ElectronicModel, FashionModel
)
from modules.infrastructure.models.author_model import AuthorModel
from modules.infrastructure.models.brand_model import BrandModel
from modules.infrastructure.models.image_model import ProductImageModel
from modules.domain.entities.product import ProductStatus

class Command(BaseCommand):
    help = 'Read products.csv and seed into Database'

    def handle(self, *args, **kwargs):
        file_path = 'data_raw/products.csv'
        self.stdout.write(f"Reading {file_path}...")

        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    # 1. Xử lý Category (Parent & Child)
                    parent_cat, _ = CategoryModel.objects.get_or_create(
                        name=row['category'], 
                        defaults={'slug': slugify(row['category'])}
                    )
                    child_cat, _ = CategoryModel.objects.get_or_create(
                        name=row['subcategory'], 
                        parent=parent_cat,
                        defaults={'slug': slugify(row['subcategory'])}
                    )

                    # 2. Xử lý Brand
                    brand, _ = BrandModel.objects.get_or_create(
                        name=row['brand'],
                        defaults={'country': row['origin']}
                    )

                    # 3. Xử lý từng loại sản phẩm
                    p_type = row['product_type']
                    common_fields = {
                        'name': row['name'],
                        'slug': row['slug'],
                        'category': child_cat,
                        'origin': row['origin'],
                        'price': float(row['price']),
                        'import_price': float(row['import_price']),
                        'stock': int(row['stock']),
                        'rating': float(row['rating']),
                        'view_count': int(row['view_count']),
                        'status': ProductStatus.SELLING.value,
                    }

                    if p_type == 'book':
                        author, _ = AuthorModel.objects.get_or_create(name=row['author'])
                        BookModel.objects.update_or_create(
                            id=row['product_id'],
                            defaults={
                                **common_fields,
                                'author': author,
                                'pub_date': row['pub_date'],
                                'language': row['language'],
                                'page_count': int(row['page_count'])
                            }
                        )
                    elif p_type == 'electronic':
                        ElectronicModel.objects.update_or_create(
                            id=row['product_id'],
                            defaults={
                                **common_fields,
                                'brand': brand,
                                'model': row['model'],
                                'color': row['color'],
                                'tech_spec': json.loads(row['tech_spec'].replace("'", '"'))
                            }
                        )
                    elif p_type == 'fashion':
                        FashionModel.objects.update_or_create(
                            id=row['product_id'],
                            defaults={
                                **common_fields,
                                'brand': brand,
                                'size': row['size'],
                                'color': row['color'],
                                'material': row['material']
                            }
                        )

                    # 4. Tạo ảnh mẫu cho sản phẩm
                    self._create_images(row['product_id'], row['slug'])
                    
                    count += 1
                    if count % 100 == 0:
                        self.stdout.write(f"Processed {count} products...")

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} products!'))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR('File data_raw/products.csv not found!'))

    def _create_images(self, product_id, slug):
        # Lấy instance product vừa tạo
        product = ProductModel.objects.get(id=product_id)
        if not ProductImageModel.objects.filter(product=product).exists():
            ProductImageModel.objects.create(
                product=product,
                image_url=f"https://picsum.photos/seed/{slug}/600/600",
                is_avatar=True
            )