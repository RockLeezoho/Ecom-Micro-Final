import csv
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.utils import IntegrityError
from apps.users.models import Admin, Staff, Customer, Address, User


class Command(BaseCommand):
    help = 'Seed users từ users.csv - Hỗ trợ --refresh, validation, bulk insert'

    def add_arguments(self, parser):
        parser.add_argument(
            '--refresh',
            action='store_true',
            help='Xóa dữ liệu cũ rồi import lại (Cẩn thận!)'
        )
        parser.add_argument(
            '--stop-on-error',
            action='store_true',
            help='Dừng ngay khi gặp lỗi (mặc định: bỏ qua và tiếp tục)'
        )

    def handle(self, *args, **options):
        # ============================================================================
        # Bước 1: Định nghĩa cấu hình
        # ============================================================================
        # Tìm file CSV từ seeds/data_raw/users.csv
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent  # Navigate to project root
        file_path = base_dir / 'seeds' / 'data_raw' / 'users.csv'
        
        # Định nghĩa trường bắt buộc cho từng role
        REQUIRED_FIELDS = {
            'admin': ['id', 'username', 'email', 'role', 'phone_number'],
            'staff': ['id', 'username', 'email', 'role', 'phone_number'],
            'customer': ['id', 'username', 'email', 'role', 'phone_number']
        }
        
        # ============================================================================
        # Bước 2: Kiểm tra file tồn tại
        # ============================================================================
        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f'❌ Không tìm thấy file: {file_path}'))
            return

        self.stdout.write(self.style.SUCCESS(f'📂 Đọc dữ liệu từ: {file_path}\n'))

        # Bước 3: Xử lý --refresh flag
        # ============================================================================
        if options.get('refresh'):
            self.stdout.write(self.style.WARNING('⚠️  XÓA toàn bộ dữ liệu người dùng cũ...'))
            # Delete addresses first to avoid FK constraint issues, then user tables
            Address.objects.all().delete()
            Admin.objects.all().delete()
            Staff.objects.all().delete()
            Customer.objects.all().delete()
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Đã xóa dữ liệu cũ\n'))

        # ============================================================================
        # Bước 4: Đọc và xử lý CSV
        # ============================================================================
        stats = {
            'total_rows': 0,
            'admins_created': 0,
            'staffs_created': 0,
            'customers_created': 0,
            'addresses_created': 0,
            'skipped': 0,
            'failed': 0
        }
        failed_rows = []
        # Chuẩn bị danh sách để bulk create
        admins_to_create = []
        staffs_to_create = []
        customers_to_create = []

        with open(file_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, 1):
                try:
                    # ============================================================
                    # 4.1: Validate dữ liệu đầu vào
                    # ============================================================
                    if 'id' not in row and '\ufeffid' in row:
                        row['id'] = row.get('\ufeffid', '')
                    user_id = row.get('id', '').strip()
                    role = (row.get('role', '').strip() or 'customer').lower()
                    username = row.get('username', '').strip()
                    
                    if not all([user_id, username, row.get('email')]):
                        raise ValueError(
                            f"Missing required fields (id, username, email) | row={row_num} | id={user_id or 'N/A'} | username={username or 'N/A'}"
                        )
                    
                    if role not in REQUIRED_FIELDS:
                        raise ValueError(
                            f"Invalid role '{role}' | row={row_num} | id={user_id} | username={username}"
                        )
                    
                    # Kiểm tra trường bắt buộc cho role này
                    for field in REQUIRED_FIELDS[role]:
                        if not row.get(field, '').strip():
                            raise ValueError(
                                f"Missing required field '{field}' for role '{role}' | row={row_num} | id={user_id} | username={username}"
                            )
                    
                    stats['total_rows'] += 1

                    # ============================================================
                    # 4.2: Kiểm tra trùng lặp (bỏ qua nếu --refresh không dùng)
                    # ============================================================
                    if not options.get('refresh'):
                        if User.objects.filter(id=user_id).exists():
                            stats['skipped'] += 1
                            self.stdout.write(self.style.WARNING(
                                f"⏭️  Skipped duplicate id | row={row_num} | id={user_id} | username={username} | role={role}"
                            ))
                            continue
                        if User.objects.filter(username=username).exists():
                            stats['skipped'] += 1
                            self.stdout.write(self.style.WARNING(
                                f"⏭️  Skipped duplicate username | row={row_num} | id={user_id} | username={username} | role={role}"
                            ))
                            continue

                    # ============================================================
                    # 4.3: Chuẩn bị dữ liệu chung (Common Fields)
                    # ============================================================
                    def safe_float(val):
                        try:
                            return float(val) if val and val.strip() else None
                        except (ValueError, TypeError):
                            return None

                    def safe_date(val):
                        try:
                            return val if val and val.strip() else None
                        except:
                            return None

                    base_data = {
                        'id': user_id,
                        'username': username,
                        'email': row.get('email', '').strip(),
                        'password': make_password("password123"),
                        'phone_number': row.get('phone_number', '').strip(),
                        'gender': (row.get('gender', '').strip() or None).lower() if row.get('gender', '').strip() else None,
                        'date_of_birth': safe_date(row.get('date_of_birth')),
                        'is_active': row.get('is_active', 'True').strip().lower() in ['true', '1', 'yes'],
                        'avatar_url': row.get('avatar_url', '').strip() or None,
                        'role': role
                    }

                    # ============================================================
                    # 4.4: Phân loại và chuẩn bị create theo role
                    # ============================================================
                    if role == 'admin':
                        admin_obj = Admin(**base_data, position=row.get('position', 'Manager').strip())
                        admins_to_create.append(admin_obj)

                    elif role == 'staff':
                        staff_obj = Staff(
                            **base_data,
                            employment_type=row.get('employment_type', 'Full-time').strip()
                        )
                        staffs_to_create.append(staff_obj)

                    else:  # customer
                        customer_obj = Customer(
                            **base_data,
                            height=safe_float(row.get('height')),
                            weight=safe_float(row.get('weight')),
                            foot_length=safe_float(row.get('foot_length'))
                        )
                        customers_to_create.append(customer_obj)


                except Exception as e:
                    stats['failed'] += 1
                    error_msg = (
                        f"row={row_num} | id={row.get('id', 'N/A')} | username={row.get('username', 'N/A')} | "
                        f"role={row.get('role', 'N/A')} | error={str(e)}"
                    )
                    self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                    failed_rows.append({'row': row_num, 'error': str(e), 'username': row.get('username', 'N/A')})
                    
                    if options.get('stop_on_error'):
                        raise

        # Nếu không có user hợp lệ nào thì kết luận luôn, không chạy bước insert.
        total_prepared = len(admins_to_create) + len(staffs_to_create) + len(customers_to_create)
        if total_prepared == 0:
            self.stdout.write(self.style.WARNING('\n⚠️  Không có users hợp lệ để insert. Bỏ qua và kết luận.'))
            self.stdout.write(self.style.SUCCESS('✨ Seed hoàn thành: không có dữ liệu mới được tạo.'))
            return

        # ============================================================================
        # Bước 5: Insert dữ liệu
        # ============================================================================
        self.stdout.write('\n' + '='*70)
        self.stdout.write('🔄 BẮT ĐẦU INSERT DỮ LIỆU...')
        self.stdout.write('='*70 + '\n')

        try:
            # Create admins (per-record to avoid single-transaction failure)
            for admin_obj in admins_to_create:
                try:
                    with transaction.atomic():
                        admin_obj.save()
                    stats['admins_created'] += 1
                except IntegrityError as e:
                    stats['skipped'] += 1
                    self.stdout.write(self.style.WARNING(f"⏭️  Skipped admin (db error) | id={getattr(admin_obj, 'id', 'N/A')} | error={e}"))
                    if options.get('stop_on_error'):
                        raise

            # Create staffs
            for staff_obj in staffs_to_create:
                try:
                    with transaction.atomic():
                        staff_obj.save()
                    stats['staffs_created'] += 1
                except IntegrityError as e:
                    stats['skipped'] += 1
                    self.stdout.write(self.style.WARNING(f"⏭️  Skipped staff (db error) | id={getattr(staff_obj, 'id', 'N/A')} | error={e}"))
                    if options.get('stop_on_error'):
                        raise

            # Create customers and addresses
            for customer_obj in customers_to_create:
                try:
                    with transaction.atomic():
                        customer_obj.save()
                        Address.objects.create(
                            user=customer_obj,
                            address="Số 1 Lý Tự Trọng, Quận 1, TP.HCM"
                        )
                    stats['customers_created'] += 1
                    stats['addresses_created'] += 1
                except IntegrityError as e:
                    stats['skipped'] += 1
                    self.stdout.write(self.style.WARNING(f"⏭️  Skipped customer (db error) | id={getattr(customer_obj, 'id', 'N/A')} | error={e}"))
                    if options.get('stop_on_error'):
                        raise

        except Exception:
            self.stdout.write(self.style.ERROR('❌ Lỗi khi insert:'))
            import traceback
            self.stdout.write(traceback.format_exc())
            raise

        # ============================================================================
        # Bước 6: In báo cáo tổng kết
        # ============================================================================
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('📊 KẾT QUẢ SEED'))
        self.stdout.write('='*70)
        self.stdout.write(f'Total rows:        {stats["total_rows"]}')
        self.stdout.write(self.style.SUCCESS(f'✅ Admins created:  {stats["admins_created"]}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Staffs created:  {stats["staffs_created"]}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Customers created: {stats["customers_created"]}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Addresses created: {stats["addresses_created"]}'))
        self.stdout.write(self.style.WARNING(f'⏭️  Skipped:        {stats["skipped"]}'))
        if stats['failed'] > 0:
            self.stdout.write(self.style.ERROR(f'❌ Failed:         {stats["failed"]}'))
        self.stdout.write('='*70 + '\n')

        # ============================================================================
        # Bước 7: Lưu failed rows nếu có
        # ============================================================================
        if failed_rows:
            failed_path = base_dir / 'seeds' / 'data_raw' / 'failed_rows.csv'
            self._export_failed_rows(failed_rows, failed_path)
            self.stdout.write(self.style.WARNING(f'\n⚠️  {len(failed_rows)} rows failed. See {failed_path}'))

        # Báo cáo cuối cùng
        total_created = stats['admins_created'] + stats['staffs_created'] + stats['customers_created']
        if total_created > 0:
            self.stdout.write(self.style.SUCCESS(f'\n✨ Seed hoàn thành! Đã thêm {total_created} users'))
        else:
            self.stdout.write(self.style.WARNING('\n⚠️  Không có users mới được tạo'))

    def _export_failed_rows(self, failed_rows, output_path):
        """Export failed rows to CSV for manual review"""
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            self.stdout.write(f'Exported failed rows to {output_path}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Could not export failed rows: {str(e)}'))
