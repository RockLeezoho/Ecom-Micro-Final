import csv
from pathlib import Path
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.text import slugify
from django.db import transaction

# Import các models
from modules.infrastructure.models.product_model import (
    CategoryModel, ProductModel, BookModel, ElectronicModel, FashionModel
)
from modules.infrastructure.models.author_model import AuthorModel
from modules.infrastructure.models.brand_model import BrandModel
from modules.infrastructure.models.publisher_model import PublisherModel
from modules.infrastructure.models.image_model import ProductImageModel

class Command(BaseCommand):
    help = 'Seed products từ products.csv với cấu trúc Danh mục Cha-Con'

    # Cấu hình ánh xạ danh mục con -> danh mục cha
    PARENT_MAPPING = {
        'sach-luu-tru': ['giao-trinh', 'tieu-thuyet', 'truyen-tranh'],
        'thiet-bi-dien-tu': ['dien-thoai', 'laptop', 'tu-lanh', 'dieu-hoa'],
        'thoi-trang-may-mac': ['ao', 'quan', 'giay']
    }

    CATEGORY_NAMES = {
        'sach-luu-tru': 'Sách lưu trữ',
        'thiet-bi-dien-tu': 'Thiết bị điện tử',
        'thoi-trang-may-mac': 'Thời trang may mặc',
        'giao-trinh': 'Giáo trình',
        'tieu-thuyet': 'Tiểu thuyết',
        'truyen-tranh': 'Truyện tranh',
        'dien-thoai': 'Điện thoại',
        'laptop': 'Laptop',
        'tu-lanh': 'Tủ lạnh',
        'dieu-hoa': 'Điều hòa',
        'ao': 'Áo',
        'quan': 'Quần',
        'giay': 'Giày'
    }

    def add_arguments(self, parser):
        parser.add_argument('--refresh', action='store_true', help='Xóa toàn bộ dữ liệu cũ')
        parser.add_argument('--stop-on-error', action='store_true', help='Dừng nếu gặp lỗi')

    def handle(self, *args, **options):
        # 1. Tìm file CSV
        possible_paths = [
            Path(settings.BASE_DIR) / 'modules' / 'seeds' / 'data_raw' / 'products.csv',
            Path.cwd() / 'modules' / 'seeds' / 'data_raw' / 'products.csv',
        ]
        file_path = next((p for p in possible_paths if p.exists()), None)
        
        if not file_path:
            self.stdout.write(self.style.ERROR('❌ Không tìm thấy file products.csv'))
            return

        # 2. Làm sạch database nếu có --refresh
        if options.get('refresh'):
            self.stdout.write(self.style.WARNING('⚠️  Đang xóa dữ liệu cũ...'))
            ProductModel.objects.all().delete()
            CategoryModel.objects.all().delete()
            BrandModel.objects.all().delete()
            AuthorModel.objects.all().delete()

        # 3. Khởi tạo Danh mục Cha (Parent Categories)
        self.stdout.write('📂 Đang khởi tạo cấu trúc danh mục...')
        parent_objs = {}
        for p_slug in self.PARENT_MAPPING.keys():
            p_name = self.CATEGORY_NAMES.get(p_slug, p_slug.replace('-', ' ').title())
            obj, _ = CategoryModel.objects.get_or_create(
                slug=p_slug, 
                defaults={'name': p_name, 'parent': None}
            )
            parent_objs[p_slug] = obj

        # Ánh xạ ngược để tìm cha từ con cho nhanh: {'giao-trinh': parent_obj, ...}
        child_to_parent_map = {}
        for p_slug, children in self.PARENT_MAPPING.items():
            for c_slug in children:
                child_to_parent_map[c_slug] = parent_objs[p_slug]

        # 4. Biến đếm và cache
        stats = {'total': 0, 'books': 0, 'electronics': 0, 'fashion': 0, 'failed': 0}
        books_to_create, electronics_to_create, fashion_to_create, images_to_create = [], [], [], []

        def safe_float(val, default=0.0):
            try: return float(val) if val and val != 'nan' else default
            except: return default

        def safe_int(val, default=0):
            try: return int(float(val)) if val and val != 'nan' else default
            except: return default

        # 5. Đọc CSV và xử lý
        with open(file_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, 1):
                try:
                    if 'id' not in row and '\ufeffid' in row:
                        row['id'] = row.get('\ufeffid', '')
                    p_id = row['id']
                    cat_slug = row.get('category') # Lấy slug danh mục con (ví dụ: giao-trinh)
                    p_type = row.get('product_type')

                    # Tạo/Lấy danh mục con và gán vào cha
                    parent_obj = child_to_parent_map.get(cat_slug)
                    category, _ = CategoryModel.objects.get_or_create(
                        slug=cat_slug,
                        defaults={
                            'name': self.CATEGORY_NAMES.get(cat_slug, cat_slug.replace('-', ' ').title()),
                            'parent': parent_obj # Gán ID danh mục cha ở đây
                        }
                    )

                    # Dữ liệu chung
                    # Validate rating - luôn đảm bảo có giá trị, không bao giờ null
                    rating_val = safe_float(row.get('rating'), default=0.0)
                    if rating_val is None or (isinstance(rating_val, float) and rating_val < 0):
                        rating_val = 0.0
                    
                    common_data = {
                        'id': p_id,
                        'name': row['name'],
                        'slug': row.get('slug'),
                        'category': category,
                        'origin': row.get('origin'),
                        'price': safe_float(row.get('price')),
                        'import_price': safe_float(row.get('importPrice')),
                        'stock': safe_int(row.get('stock')),
                        'rating': rating_val,  # Đảm bảo luôn có giá trị, không null
                        'view_count': safe_int(row.get('viewCount')),
                        'status': row.get('status'),
                        'created_at': row.get('createdAt') or datetime.now()
                    }

                    # Phân loại model con
                    if p_type == 'sach-luu-tru':
                        author, _ = AuthorModel.objects.get_or_create(name=row.get('author', 'N/A'))
                        publisher, _ = PublisherModel.objects.get_or_create(name=row.get('publisher', 'N/A'))
                        book_data = {**common_data, 'author': author, 'publisher': publisher, 
                                     'page_count': safe_int(row.get('pageCount')), 'language': row.get('language')}
                        books_to_create.append(book_data)
                        stats['books'] += 1
                    
                    elif p_type == 'thiet-bi-dien-tu':
                        brand, _ = BrandModel.objects.get_or_create(name=row.get('brand', 'Generic'))
                        condition = row.get('condition', 'NEW').upper()  # Đảm bảo uppercase phù hợp enum
                        electronic_data = {**common_data, 'brand': brand, 'model': row.get('model'),
                                          'color': row.get('color'), 'condition': condition}
                        electronics_to_create.append(electronic_data)
                        stats['electronics'] += 1
                        
                    elif p_type == 'thoi-trang-may-mac':
                        brand, _ = BrandModel.objects.get_or_create(name=row.get('brand', 'Generic'))
                        gender = row.get('gender', 'UNISEX').upper()  # Đảm bảo uppercase phù hợp enum
                        fashion_data = {**common_data, 'brand': brand, 'size': row.get('size'),
                                       'material': row.get('material'), 'gender': gender,
                                       'color': row.get('color'), 'season': row.get('season')}
                        fashion_to_create.append(fashion_data)
                        stats['fashion'] += 1

                    # Ảnh mẫu
                    images_to_create.append(ProductImageModel(product_id=p_id, image_url=f"https://picsum.photos/seed/{p_id}/600/600", is_avatar=True))

                except Exception as e:
                    stats['failed'] += 1
                    self.stdout.write(self.style.ERROR(f"❌ Lỗi dòng {row_num}: {str(e)}"))
                    if options.get('stop_on_error'): raise

        # 6. Lưu vào DB theo từng record để skip lỗi mà không làm hỏng cả batch
        self.stdout.write('🚀 Đang thực hiện Bulk Create...')

        created_product_ids = set()

        def save_records(records, model_cls, label):
            created_count = 0
            for idx, payload in enumerate(records, 1):
                try:
                    # Mỗi record chạy trong 1 transaction riêng.
                    # Nếu record này lỗi, chỉ rollback record đó.
                    with transaction.atomic():
                        model_cls.objects.create(**payload)
                    created_count += 1
                    created_product_ids.add(str(payload.get('id')))
                except Exception as save_err:
                    stats['failed'] += 1
                    self.stdout.write(self.style.ERROR(
                        f"❌ Lỗi khi save {label} #{idx} (ID: {payload.get('id')}): {str(save_err)}"
                    ))
                    self.stdout.write(self.style.ERROR(
                        f"   Rating: {payload.get('rating')}, Status: {payload.get('status')}"
                    ))
                    if options.get('stop_on_error'):
                        raise

            self.stdout.write(self.style.SUCCESS(
                f'✅ Lưu {created_count}/{len(records)} {label} thành công!'
            ))

        if books_to_create:
            save_records(books_to_create, BookModel, 'Book')

        if electronics_to_create:
            save_records(electronics_to_create, ElectronicModel, 'Electronic')

        if fashion_to_create:
            save_records(fashion_to_create, FashionModel, 'Fashion')

        # Lưu Images chỉ cho các product đã được tạo thành công để tránh lỗi FK
        if images_to_create:
            valid_images = [img for img in images_to_create if str(img.product_id) in created_product_ids]
            try:
                with transaction.atomic():
                    ProductImageModel.objects.bulk_create(valid_images, batch_size=500)
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Lưu {len(valid_images)}/{len(images_to_create)} Images thành công!'
                ))
            except Exception as e:
                stats['failed'] += 1
                self.stdout.write(self.style.ERROR(f'❌ Lỗi khi lưu Images: {str(e)}'))

        # 7. Báo cáo
        self.stdout.write(f"\n--- KẾT QUẢ ---")
        self.stdout.write(f"Sách: {stats['books']} | Điện tử: {stats['electronics']} | Thời trang: {stats['fashion']}")
        self.stdout.write(f"Danh mục cha: {len(parent_objs)} | Thất bại: {stats['failed']}")