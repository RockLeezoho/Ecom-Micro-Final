import random
import uuid
from datetime import date, datetime, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from modules.infrastructure.models.product_model import (
    CategoryModel, ProductModel, BookModel, ElectronicModel, FashionModel
)
from modules.infrastructure.models.author_model import AuthorModel
from modules.infrastructure.models.publisher_model import PublisherModel
from modules.infrastructure.models.brand_model import BrandModel
from modules.infrastructure.models.image_model import ProductImageModel
from modules.domain.entities.product import (
    ProductStatus, Origin, Color, Size, Language, Gender, Material, Season, Condition
)

class Command(BaseCommand):
    help = 'Seed 100 sample products into the product DB'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting to seed 100 sample products...")

        with transaction.atomic():
            categories = self._create_categories()
            authors = self._create_authors()
            publishers = self._create_publishers()
            brands = self._create_brands()
            self._create_products(categories, authors, publishers, brands)

        self.stdout.write(self.style.SUCCESS('Successfully seeded 100 sample products!'))

    def _create_categories(self):
        """Create parent and child categories"""
        self.stdout.write("Creating categories...")
        categories = {}
        
        parent_categories_data = [
            {'name': 'Sách & Lưu trữ', 'description': 'Sách, báo, tạp chí và các sản phẩm lưu trữ'},
            {'name': 'Thiết bị điện tử', 'description': 'Điện thoại, laptop, phụ kiện công nghệ'},
            {'name': 'Thời trang & May mặc', 'description': 'Quần áo, giày dép, phụ kiện'},
        ]
        
        for parent_data in parent_categories_data:
            parent, _ = CategoryModel.objects.update_or_create(
                name=parent_data['name'],
                defaults={
                    'slug': slugify(parent_data['name']),
                    'description': parent_data['description'],
                    'parent': None
                }
            )
            categories[parent.name] = {'parent': parent, 'children': {}}
        
        child_categories_data = {
            'Sách & Lưu trữ': [
                {'name': 'Giáo trình', 'description': 'Sách giáo khoa và sách tham khảo học tập'},
                {'name': 'Tiểu thuyết', 'description': 'Truyện tranh, tiểu thuyết, văn học'},
                {'name': 'Truyện tranh', 'description': 'Manga, comic, truyện tranh các thể loại'},
            ],
            'Thiết bị điện tử': [
                {'name': 'Điện thoại', 'description': 'Smartphone, máy tính bảng, phụ kiện'},
                {'name': 'Laptop', 'description': 'Máy tính xách tay, bộ vi xử lý'},
                {'name': 'Tủ lạnh', 'description': 'Tủ lạnh, tủ đông'},
                {'name': 'Điều hòa', 'description': 'Máy điều hòa không khí'},
            ],
            'Thời trang & May mặc': [
                {'name': 'Áo', 'description': 'Áo phông, áo sơ mi, áo khoác'},
                {'name': 'Quần', 'description': 'Quần tây, quần jeans, quần khác'},
                {'name': 'Giày dép', 'description': 'Giày thể thao, giày da, dép'},
            ],
        }
        
        for parent_name, children_list in child_categories_data.items():
            parent = categories[parent_name]['parent']
            for child_data in children_list:
                child, _ = CategoryModel.objects.update_or_create(
                    name=child_data['name'],
                    parent=parent,
                    defaults={
                        'slug': slugify(child_data['name']),
                        'description': child_data['description'],
                    }
                )
                categories[parent_name]['children'][child.name] = child
        
        return categories

    def _create_authors(self):
        self.stdout.write("Creating authors...")
        authors_data = [
            {'name': 'Lê Anh Vinh', 'bio': 'Tác giả nổi tiếng về quản lý doanh nghiệp'},
            {'name': 'Nguyễn Văn A', 'bio': 'Chuyên gia về phát triển bản thân'},
            {'name': 'Trần Thị B', 'bio': 'Nhà văn viết tiểu thuyết lãng mạn'},
            {'name': 'Phạm Minh C', 'bio': 'Tác giả về khoa học tự nhiên'},
            {'name': 'Hoàng Văn D', 'bio': 'Chuyên gia về công nghệ thông tin'},
        ]
        authors = {}
        for author_data in authors_data:
            author, _ = AuthorModel.objects.update_or_create(
                name=author_data['name'],
                defaults={'bio': author_data['bio']}
            )
            authors[author.name] = author
        return authors

    def _create_publishers(self):
        self.stdout.write("Creating publishers...")
        publishers_data = [
            {'name': 'NXB Giáo Dục', 'address': 'Hà Nội, Việt Nam'},
            {'name': 'NXB Trẻ', 'address': 'Hà Nội, Việt Nam'},
            {'name': 'NXB Kim Đồng', 'address': 'Hà Nội, Việt Nam'},
        ]
        publishers = {}
        for pub_data in publishers_data:
            publisher, _ = PublisherModel.objects.update_or_create(
                name=pub_data['name'],
                defaults={'address': pub_data['address']}
            )
            publishers[publisher.name] = publisher
        return publishers

    def _create_brands(self):
        self.stdout.write("Creating brands...")
        brands_data = [
            {'name': 'Apple', 'country': 'USA', 'description': 'Công ty công nghệ'},
            {'name': 'Samsung', 'country': 'Hàn Quốc', 'description': 'Hãng điện tử'},
            {'name': 'Nike', 'country': 'USA', 'description': 'Thương hiệu thể thao'},
            {'name': 'Adidas', 'country': 'Đức', 'description': 'Hãng sản xuất giày'},
        ]
        brands = {}
        for brand_data in brands_data:
            brand, _ = BrandModel.objects.update_or_create(
                name=brand_data['name'],
                defaults={
                    'country': brand_data['country'],
                    'description': brand_data['description'],
                    'logoUrl': f'https://picsum.photos/seed/{slugify(brand_data["name"])}/100/100'
                }
            )
            brands[brand.name] = brand
        return brands

    def _create_products(self, categories, authors, publishers, brands):
        """Create 100 sample products using update_or_create"""
        self.stdout.write("Creating/Updating 100 sample products...")
        product_count = 0

        # --- BOOKS (34 products) ---
        book_names = ['Suy tư để thành công', 'Tư duy chiến lược', 'Nghệ thuật giao tiếp', 'Manga Nhật Bản']
        for i in range(34):
            product_count += 1
            cat = random.choice(list(categories['Sách & Lưu trữ']['children'].values()))
            name = f"{random.choice(book_names)} - {i+1}"
            slug = slugify(name)
            price = random.randint(50, 300) * 1000

            book, created = BookModel.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'category': cat,
                    'origin': random.choice([Origin.VIETNAM.value, Origin.JAPAN.value]),
                    'price': price,
                    'import_price': price * 0.6,
                    'stock': random.randint(10, 100),
                    'rating': round(random.uniform(3.5, 5.0), 1),
                    'status': ProductStatus.SELLING.value,
                    'view_count': random.randint(100, 5000),
                    'author': random.choice(list(authors.values())),
                    'publisher': random.choice(list(publishers.values())),
                    'pub_date': str(random.randint(2015, 2024)),
                    'language': Language.VIETNAMESE.value,
                    'page_count': random.randint(100, 500),
                    'format': 'Bìa mềm',
                    'description': f'Cuốn sách {name} cung cấp kiến thức giá trị.',
                }
            )
            self._create_product_images(book, "book")

        # --- ELECTRONICS (36 products) ---
        elec_names = ['iPhone 15', 'Samsung Galaxy S24', 'MacBook Pro', 'Dell XPS']
        for i in range(36):
            product_count += 1
            cat = random.choice(list(categories['Thiết bị điện tử']['children'].values()))
            name = f"{random.choice(elec_names)} - Model {i+1}"
            slug = slugify(name)
            price = random.randint(5000, 50000) * 1000

            elec, created = ElectronicModel.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'category': cat,
                    'origin': Origin.USA.value,
                    'price': price,
                    'import_price': price * 0.7,
                    'stock': random.randint(5, 50),
                    'status': ProductStatus.SELLING.value,
                    'brand': random.choice(list(brands.values())),
                    'model': f'M-{random.randint(100, 999)}',
                    'tech_spec': {'warranty': '12 months'},
                    'color': Color.BLACK.value,
                    'condition': Condition.NEW.value,
                }
            )
            self._create_product_images(elec, "elec")

        # --- FASHION (30 products) ---
        fashion_names = ['Áo phông cotton', 'Quần jeans nam', 'Giày thể thao']
        for i in range(30):
            product_count += 1
            cat = random.choice(list(categories['Thời trang & May mặc']['children'].values()))
            name = f"{random.choice(fashion_names)} - {i+1}"
            slug = slugify(name)
            price = random.randint(200, 2000) * 1000

            fashion, created = FashionModel.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'category': cat,
                    'origin': Origin.VIETNAM.value,
                    'price': price,
                    'import_price': price * 0.5,
                    'stock': random.randint(10, 100),
                    'status': ProductStatus.SELLING.value,
                    'brand': random.choice(list(brands.values())),
                    'size': Size.M.value,
                    'color': Color.WHITE.value,
                    'material': Material.COTTON.value,
                    'gender': Gender.UNISEX.value,
                    'season': Season.SUMMER.value,
                }
            )
            self._create_product_images(fashion, "fashion")

            if product_count % 10 == 0:
                self.stdout.write(f"Processed {product_count} products...")

    def _create_product_images(self, product, prefix):
        """Helper to create images and avoid duplicates"""
        # Xóa ảnh cũ của sản phẩm này để seed lại sạch sẽ
        ProductImageModel.objects.filter(product=product).delete()
        
        for j in range(1, 4):
            ProductImageModel.objects.create(
                product=product,
                image_url=f'https://picsum.photos/seed/{prefix}-{product.slug}-{j}/400/400',
                is_avatar=(j == 1)
            )