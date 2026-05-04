import random
import uuid
from datetime import date, datetime, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction

from infrastructure.models.product_model import (
    CategoryModel, SubcategoryModel, BrandModel, AuthorModel, 
    PublisherModel, BookModel, ElectronicModel, FashionModel
)
from modules.domain.entities.product import (
    ProductStatus, Origin, Color, Size, Condition, Material, Season
)

class Command(BaseCommand):
    help = 'Seed products into the product DB (default 100). Use --count to change.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of products to create (default: 100)'
        )

    def handle(self, *args, **kwargs):
        count = kwargs.get('count', 100)
        self.stdout.write(f"Starting to seed {count} products...")

        # --- CẤU CẤU HÌNH LOGIC ---
        catalog_map = {
            "Book": ["Giáo trình", "Tiểu thuyết"],
            "Electronics": ["Mobile", "Laptop", "Tủ lạnh", "Điều hòa"],
            "Fashion": ["Áo", "Quần", "Giày"]
        }

        brands_map = {
            "Giáo trình": ["NXB Giáo Dục", "NXB Trẻ", "NXB Đại Học"],
            "Tiểu thuyết": ["NXB Kim Đồng", "NXB Văn Học", "NXB Trẻ"],
            "Mobile": ["Apple", "Samsung", "Xiaomi", "Oppo"],
            "Laptop": ["Dell", "HP", "Asus", "Lenovo"],
            "Tủ lạnh": ["LG", "Samsung", "Panasonic"],
            "Điều hòa": ["Daikin", "Panasonic", "LG"],
            "Áo": ["Nike", "Adidas", "Uniqlo"],
            "Quần": ["Levis", "Uniqlo", "Routine"],
            "Giày": ["Nike", "Adidas", "Puma"]
        }

        # Ánh xạ tên nước sang Enum Origin trong Domain
        origin_enum_map = {
            "Việt Nam": Origin.VIETNAM,
            "USA": Origin.USA,
            "Japan": Origin.JAPAN,
            "Korea": Origin.KOREA,
            "China": Origin.CHINA,
            "Taiwan": Origin.CHINA,   # Tạm ánh xạ về China nếu Enum ko có Taiwan
            "Germany": Origin.FRANCE, # Tạm ánh xạ về France nếu Enum ko có Germany
        }

        origins_data = {
            "NXB Giáo Dục": "Việt Nam", "NXB Trẻ": "Việt Nam", "NXB Đại Học": "Việt Nam",
            "NXB Kim Đồng": "Việt Nam", "NXB Văn Học": "Việt Nam",
            "Apple": "USA", "Samsung": "Korea", "Xiaomi": "China", "Oppo": "China",
            "Dell": "USA", "HP": "USA", "Asus": "Taiwan", "Lenovo": "China",
            "LG": "Korea", "Panasonic": "Japan", "Daikin": "Japan",
            "Nike": "USA", "Adidas": "Germany", "Uniqlo": "Japan",
            "Levis": "USA", "Routine": "Việt Nam", "Puma": "Germany"
        }

        # Tạo sẵn Author giả lập cho sách
        default_author, _ = AuthorModel.objects.get_or_create(
            id="AUTH_GENERIC", name="Nhiều tác giả", bio="Thông tin đang cập nhật"
        )

        with transaction.atomic():
            product_ids = []
            for i in range(1, count + 1):
                p_id = str(uuid.uuid4())
                product_ids.append(p_id)
                
                # Chọn Category và Subcategory
                category_name = random.choice(list(catalog_map.keys()))
                subcategory_name = random.choice(catalog_map[category_name])
                
                # Đảm bảo Category/Subcategory tồn tại trong DB
                cat_obj, _ = CategoryModel.objects.get_or_create(
                    id=f"CAT_{category_name.upper()}", name=category_name
                )
                subcat_obj, _ = SubcategoryModel.objects.get_or_create(
                    id=f"SUB_{p_id[:8]}", name=subcategory_name, category=cat_obj
                )

                # Chọn Brand và Origin
                brand_name = random.choice(brands_map[subcategory_name])
                brand_country = origins_data.get(brand_name, "Việt Nam")
                brand_obj, _ = BrandModel.objects.get_or_create(
                    id=f"BRAND_{brand_name.replace(' ', '_')}", 
                    name=brand_name, 
                    country=brand_country
                )

                origin_enum = origin_enum_map.get(brand_country, Origin.VIETNAM)

                # Thông số chung
                common_data = {
                    "id": p_id,
                    "name": f"{brand_name} {subcategory_name} {p_id}",
                    "category": cat_obj,
                    "origin": origin_enum.value,
                    "stock": random.randint(5, 100),
                    "rating": round(random.uniform(3.5, 5.0), 1),
                    "status": ProductStatus.SELLING.value,
                }

                if category_name == "Book":
                    price = random.randint(50, 300) * 1000
                    pub_obj, _ = PublisherModel.objects.get_or_create(
                        id=f"PUB_{brand_name.replace(' ', '_')}", name=brand_name, address="Hà Nội, Việt Nam"
                    )
                    BookModel.objects.update_or_create(
                        id=p_id,
                        defaults={
                            **common_data,
                            "price": price,
                            "importPrice": price * 0.7,
                            "author": default_author,
                            "publisher": pub_obj,
                            "pubDate": str(random.randint(2010, 2024)),
                            "language": "Tiếng Việt",
                            "pageCount": random.randint(100, 500),
                            "format": "Bìa mềm",
                            "description": f"Mô tả cho cuốn sách {p_id}"
                        }
                    )

                elif category_name == "Electronics":
                    price = random.randint(3000, 50000) * 1000
                    ElectronicModel.objects.update_or_create(
                        id=p_id,
                        defaults={
                            **common_data,
                            "price": price,
                            "importPrice": price * 0.8,
                            "brand": brand_obj,
                            "model": f"Model-{random.randint(100, 999)}",
                            "techSpec": {
                                "screen": "AMOLED", 
                                "battery": "5000mAh", 
                                "warranty": "12 months"
                            },
                            "color": random.choice(list(Color)).value,
                            "warrantyPeriod": date.today() + timedelta(days=365),
                            "condition": Condition.NEW.value,
                            "voltage": random.choice([110.0, 220.0])
                        }
                    )

                elif category_name == "Fashion":
                    price = random.randint(200, 3000) * 1000
                    FashionModel.objects.update_or_create(
                        id=p_id,
                        defaults={
                            **common_data,
                            "price": price,
                            "importPrice": price * 0.6,
                            "brand": brand_obj,
                            "size": random.choice(list(Size)).value,
                            "color": random.choice(list(Color)).value,
                            "material": random.choice(list(Material)).value,
                            "gender": random.choice(["Nam", "Nữ", "Unisex"]),
                            "season": random.choice(list(Season)).value
                        }
                    )

                # Randomize view_count to simulate popularity
                ProductModel = None
                try:
                    # update_or_create above should have created the object; fetch and set view_count
                    from infrastructure.models.product_model import ProductModel as PM
                    ProductModel = PM
                    prod = ProductModel.objects.get(id=p_id)
                    prod.view_count = random.randint(0, 5000)
                    prod.save(update_fields=['view_count'])
                except Exception:
                    pass

                if i % 50 == 0:
                    self.stdout.write(f"Processed {i} products...")

        # --- Append simulated purchase events to AI artifact to represent sales history ---
        try:
            import os
            artifact_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'ai_service', 'artifacts', 'data_user500.csv'))
            users = [f"U{u:03}" for u in range(1, 51)]
            lines = []
            from datetime import datetime
            for p_id in product_ids:
                # assign between 0..20 purchases randomly
                purchases = random.randint(0, 20)
                for _ in range(purchases):
                    user = random.choice(users)
                    ts = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    lines.append(f"{user},{p_id},purchase,{ts}\n")
            if lines:
                # Append to file (create if missing)
                os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
                with open(artifact_path, 'a', encoding='utf-8') as f:
                    f.writelines(lines)
                self.stdout.write(self.style.SUCCESS(f'Appended simulated purchase events for {count} products to ai_service/artifacts/data_user500.csv'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not append purchase artifact: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} products!'))