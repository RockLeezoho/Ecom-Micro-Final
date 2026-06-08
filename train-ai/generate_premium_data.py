import pandas as pd
import random
import uuid
import os
import sys
from datetime import datetime, timedelta

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')

# Tự động xác định thư mục gốc của dự án (ecom-final-micro)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_ARTIFACTS_DIR = os.path.join(BASE_DIR, "train-ai", "artifacts")
PRODUCT_SEEDS_DIR = os.path.join(BASE_DIR, "product-service", "modules", "seeds", "data_raw")
USER_SEEDS_DIR = os.path.join(BASE_DIR, "user-service", "seeds", "data_raw")

# Tạo các thư mục nếu chưa tồn tại
os.makedirs(AI_ARTIFACTS_DIR, exist_ok=True)
os.makedirs(PRODUCT_SEEDS_DIR, exist_ok=True)
os.makedirs(USER_SEEDS_DIR, exist_ok=True)

# ==========================================
# 1. DANH SÁCH TÊN SẢN PHẨM THỰC TẾ (REALISTIC DATA)
# ==========================================
books = {
    "giao-trinh": [
        ("Giáo Trình Kiến Trúc Thiết Kế Phần Mềm", "Nhà Xuất Bản Bách Khoa", "Nguyễn Đức An"),
        ("Giáo Trình Cấu Trúc Dữ Liệu Và Giải Thuật", "Nhà Xuất Bản Giáo Dục", "Đặng Huy Ruận"),
        ("Giáo Trình Lập Trình Hướng Đối Tượng Java", "Nhà Xuất Bản Giáo Dục", "Đại Học Công Nghệ"),
        ("Giáo Trình Cơ Sở Dữ Liệu", "Nhà Xuất Bản Thông Tin Truyền Thông", "Nguyễn Kim Anh"),
        ("Giáo Trình Mạng Máy Tính Căn Bản", "Nhà Xuất Bản Giáo Dục", "Đại Học Bách Khoa"),
        ("Giáo Trình Phân Tích Thiết Kế Hệ Thống", "Nhà Xuất Bản Bách Khoa", "Trần Đình Quế"),
        ("Giáo Trình Trí Tuệ Nhân Tạo", "Nhà Xuất Bản Giáo Dục", "Bạch Hưng Khang"),
        ("Giáo Trình Lập Trình Web Nâng Cao", "Nhà Xuất Bản Thông Tin Truyền Thông", "Khoa Công Nghệ Thông Tin"),
        ("Giáo Trình Hệ Điều Hành", "Nhà Xuất Bản Bách Khoa", "Nguyễn Thanh Thủy"),
        ("Giáo Trình An Toàn Bảo Mật Thông Tin", "Nhà Xuất Bản Giáo Dục", "Đại Học Quốc Gia")
    ],
    "tieu-thuyet": [
        ("Số Đỏ", "Nhà Xuất Bản Văn Học", "Vũ Trọng Phụng"),
        ("Tắt Đèn", "Nhà Xuất Bản Văn Học", "Ngô Tất Tố"),
        ("Lão Hạc", "Nhà Xuất Bản Kim Đồng", "Nam Cao"),
        ("Tuổi Trẻ Đáng Giá Bao Nhiêu", "Nhà Xuất Bản Hội Nhà Văn", "Rosie Nguyễn"),
        ("Tôi Thấy Hoa Vàng Trên Cỏ Xanh", "Nhà Xuất Bản Trẻ", "Nguyễn Nhật Ánh"),
        ("Cho Tôi Xin Một Vé Đi Tuổi Thơ", "Nhà Xuất Bản Trẻ", "Nguyễn Nhật Ánh"),
        ("Sapiens: Lược Sử Loài Người", "Nhà Xuất Bản Thế Giới", "Yuval Noah Harari"),
        ("Nhà Giả Kim", "Nhà Xuất Bản Hội Nhà Văn", "Paulo Coelho"),
        ("Đắc Nhân Tâm", "Nhà Xuất Bản Tổng Hợp TP.HCM", "Dale Carnegie"),
        ("Bố Già (The Godfather)", "Nhà Xuất Bản Văn Học", "Mario Puzo")
    ],
    "truyen-tranh": [
        ("Doraemon Tập 1", "Nhà Xuất Bản Kim Đồng", "Fujiko F. Fujio"),
        ("Conan Thám Tử Lừng Danh Tập 100", "Nhà Xuất Bản Kim Đồng", "Gosho Aoyama"),
        ("One Piece Kỷ Nguyên Hải Tặc Tập 1", "Nhà Xuất Bản Kim Đồng", "Eiichiro Oda"),
        ("Naruto Hành Trình Ninja Tập 5", "Nhà Xuất Bản Kim Đồng", "Masashi Kishimoto"),
        ("Dragon Ball 7 Viên Ngọc Rồng Tập 1", "Nhà Xuất Bản Kim Đồng", "Akira Toriyama"),
        ("Thần Đồng Đất Việt Tập 10", "Nhà Xuất Bản Trẻ", "Phan Thị"),
        ("Attack on Titan Đại Chiến Titan Tập 12", "Nhà Xuất Bản Kim Đồng", "Hajime Isayama"),
        ("Demon Slayer Thanh Gươm Diệt Quỷ Tập 3", "Nhà Xuất Bản Kim Đồng", "Koyoharu Gotouge"),
        ("Jujutsu Kaisen Chú Thuật Hồi Chiến Tập 1", "Nhà Xuất Bản Kim Đồng", "Gege Akutami"),
        ("Slam Dunk Cao Thủ Bóng Rổ Tập 2", "Nhà Xuất Bản Kim Đồng", "Takehiko Inoue")
    ]
}

electronics = {
    "dien-thoai": [
        ("Điện thoại thông minh Thăng Long Pro 15", "Thương Hiệu Ánh Dương", "BLACK"),
        ("Điện thoại thông minh Hoàng Gia S24", "Thương Hiệu Sông Hồng", "BLUE"),
        ("Điện thoại thông minh Thiên Hà 14", "Thương Hiệu Trúc Mai", "WHITE"),
        ("Điện thoại thông minh Bình Minh X7", "Thương Hiệu Bạch Liên", "GREEN"),
        ("Điện thoại thông minh Hùng Vương 13", "Thương Hiệu Hồng Hà", "RED"),
        ("Điện thoại thông minh Đỉnh Cao A55", "Thương Hiệu Vạn Xuân", "GRAY"),
        ("Điện thoại thông minh Sóng Việt 11", "Thương Hiệu Đại Việt", "BLACK"),
        ("Điện thoại thông minh Mùa Xuân Note 13", "Thương Hiệu Phú Quý", "GREEN"),
        ("Điện thoại thông minh Ánh Trăng Reno 11", "Thương Hiệu Ngọc Lan", "PINK"),
        ("Điện thoại thông minh Trường Sơn 8", "Thương Hiệu An Lạc", "WHITE")
    ],
    "laptop": [
        ("Máy tính xách tay Học Tập 14", "Thương Hiệu Bình An", "GRAY"),
        ("Máy tính xách tay Doanh Nhân 13", "Thương Hiệu Minh Tâm", "BLACK"),
        ("Máy tính xách tay Đồ Họa 16", "Thương Hiệu Sơn Tùng", "BLUE"),
        ("Máy tính xách tay Siêu Nhẹ 13", "Thương Hiệu Trí Tuệ", "WHITE"),
        ("Máy tính xách tay Chuyên Nghiệp X1", "Thương Hiệu Hữu Nghị", "BLACK"),
        ("Máy tính xách tay Hiệu Suất Cao 16", "Thương Hiệu Bình Minh", "BLACK"),
        ("Máy tính xách tay Sáng Tạo 14", "Thương Hiệu Tuấn Phát", "BLACK"),
        ("Máy tính xách tay Văn Phòng 14", "Thương Hiệu Trường Thọ", "GRAY"),
        ("Máy tính xách tay Màn Hình Đẹp 14", "Thương Hiệu Thịnh Vượng", "BLUE"),
        ("Máy tính xách tay Chiến Lược 15", "Thương Hiệu An Bình", "GRAY")
    ],
    "tu-lanh": [
        ("Tủ lạnh Inverter Gia Đình 488L", "Thương Hiệu Thuận Phát", "WHITE"),
        ("Tủ lạnh Inverter Tiết Kiệm 325L", "Thương Hiệu Phúc An", "BLACK"),
        ("Tủ lạnh Cửa Lớn 635L", "Thương Hiệu Hoàng Gia", "GRAY"),
        ("Tủ lạnh Mini 180L", "Thương Hiệu Phú Cường", "BLUE"),
        ("Tủ lạnh Inverter 253L", "Thương Hiệu Đại Phát", "BLACK")
    ],
    "dieu-hoa": [
        ("Máy điều hòa Inverter 1 HP", "Thương Hiệu An Tâm", "WHITE"),
        ("Máy điều hòa Tiết Kiệm Điện 1.5 HP", "Thương Hiệu Lộc Phát", "WHITE"),
        ("Máy điều hòa Inverter 2 HP", "Thương Hiệu Minh Châu", "WHITE"),
        ("Máy điều hòa 1 HP Cao Cấp", "Thương Hiệu Phú Hưng", "WHITE"),
        ("Máy điều hòa 1 HP Siêu Êm", "Thương Hiệu An Phúc", "WHITE")
    ]
}

fashion = {
    "ao": [
        ("Áo thun thể thao Năng Động", "Thương Hiệu Bình Minh", "COTTON"),
        ("Áo khoác gió Chống Nước", "Thương Hiệu Đại Lộc", "POLYESTER"),
        ("Áo sơ mi nam Lịch Lãm", "Thương Hiệu An Phú", "COTTON"),
        ("Áo phông trơn Cổ Tròn", "Thương Hiệu Minh Long", "COTTON"),
        ("Áo hoodie Nỉ Ấm Áp", "Thương Hiệu Trí Đức", "POLYESTER"),
        ("Áo polo thể thao Năng Động", "Thương Hiệu Bách Khoa", "COTTON"),
        ("Áo thun trẻ trung", "Thương Hiệu Hồng Đức", "COTTON")
    ],
    "quan": [
        ("Quần jeans bền bỉ", "Thương Hiệu Trường Sơn", "COTTON"),
        ("Quần tây công sở", "Thương Hiệu Minh Tâm", "POLYESTER"),
        ("Quần jogger thể thao", "Thương Hiệu Đại Nam", "POLYESTER"),
        ("Quần short năng động", "Thương Hiệu Vạn Phúc", "COTTON"),
        ("Quần kaki nam lịch lãm", "Thương Hiệu Phúc Lộc", "COTTON")
    ],
    "giay": [
        ("Giày thể thao năng động", "Thương Hiệu Thanh Bình", "LEATHER"),
        ("Giày chạy bộ êm ái", "Thương Hiệu Nhật Quang", "POLYESTER"),
        ("Giày chạy bộ bền bỉ", "Thương Hiệu Trường Hải", "POLYESTER"),
        ("Xăng đan nam chắc chắn", "Thương Hiệu Nam Phong", "LEATHER"),
        ("Giày da lịch lãm", "Thương Hiệu Hưng Thịnh", "LEATHER")
    ]
}

# ==========================================
# 2. KHỞI TẠO DANH SÁCH 90 SẢN PHẨM CAO CẤP
# ==========================================
products_list = []

# Hàm tạo slug gọn đẹp
def make_slug(name, uid_str):
    name_clean = name.lower()
    for char in ["(", ")", ":", "/", ".", ",", "+"]:
        name_clean = name_clean.replace(char, "")
    words = name_clean.split()
    base_slug = "-".join(words[:4])
    return f"{base_slug}-{uid_str[:4]}"

# random.seed(42) # Đảm bảo sinh dữ liệu nhất quán

# A. Sinh Sách (sach-luu-tru)
for subcat, items in books.items():
    for idx, item in enumerate(items):
        name, publisher, author = item
        p_id = str(uuid.uuid4())
        slug = make_slug(name, p_id)
        price = random.randint(5, 30) * 10000
        products_list.append({
            "id": p_id,
            "name": name,
            "slug": slug,
            "category": subcat,
            "product_type": "sach-luu-tru",
            "price": price,
            "importPrice": float(price * 0.7),
            "stock": random.randint(20, 200),
        })
        stat = random.choice(["SELLING", "SELLING", "NEW"])
        products_list[-1].update({
            "status": stat,
            "rating": 0.0 if stat == "NEW" else round(random.uniform(4.5, 5.0), 1),
            "origin": random.choice(["VN", "US", "JP", "KR"]),
            "viewCount": random.randint(200, 4000),
            "createdAt": (datetime.now() - timedelta(days=random.randint(10, 300))).strftime("%Y-%m-%d"),
            "author": author,
            "publisher": publisher,
            "pageCount": random.randint(150, 600),
            "language": "vi",
            "brand": "Nhà Sách Minh Tâm",
            "model": "Phiên Bản Tiêu Chuẩn",
            "color": random.choice(["WHITE", "BLACK", "BLUE", "RED", "GREEN", "YELLOW", "PINK", "BROWN", "GRAY", "MULTI-COLOR"]),
            "condition": "NEW",
            "size": random.choice(["S", "M", "L", "XL"]),
            "material": random.choice(["COTTON", "LEATHER", "POLYESTER"]),
            "gender": "UNISEX",
            "season": random.choice(["SPRING", "SUMMER", "AUTUMN", "WINTER"])
        })

# B. Sinh Thiết bị điện tử (thiet-bi-dien-tu)
for subcat, items in electronics.items():
    for idx, item in enumerate(items):
        name, brand, color = item
        p_id = str(uuid.uuid4())
        slug = make_slug(name, p_id)
        
        if subcat in ["dien-thoai", "laptop"]:
            price = random.randint(8, 45) * 1000000
        else:
            price = random.randint(6, 25) * 1000000
            
        products_list.append({
            "id": p_id,
            "name": name,
            "slug": slug,
            "category": subcat,
            "product_type": "thiet-bi-dien-tu",
            "price": price,
            "importPrice": float(price * 0.7),
            "stock": random.randint(10, 100),
        })
        stat = random.choice(["SELLING", "SELLING", "NEW"])
        products_list[-1].update({
            "status": stat,
            "rating": 0.0 if stat == "NEW" else round(random.uniform(4.8, 5.0), 1),
            "origin": random.choice(["CN", "KR", "VN", "US", "JP"]),
            "viewCount": random.randint(500, 6000),
            "createdAt": (datetime.now() - timedelta(days=random.randint(10, 250))).strftime("%Y-%m-%d"),
            "author": "Không Áp Dụng",
            "publisher": "Không Áp Dụng",
            "pageCount": 0,
            "language": "vi",
            "brand": brand,
            "model": f"Phiên Bản {random.randint(100, 999)}",
            "color": color,
            "condition": random.choice(["NEW", "OPEN_BOX", "REFURBISHED"]),
            "size": random.choice(["S", "M", "L", "XL"]),
            "material": random.choice(["COTTON", "LEATHER", "POLYESTER"]),
            "gender": "UNISEX",
            "season": random.choice(["SPRING", "SUMMER", "AUTUMN", "WINTER"])
        })

# C. Sinh Thời trang may mặc (thoi-trang-may-mac)
for subcat, items in fashion.items():
    for idx, item in enumerate(items):
        name, brand, material = item
        p_id = str(uuid.uuid4())
        slug = make_slug(name, p_id)
        price = random.randint(18, 220) * 10000
        products_list.append({
            "id": p_id,
            "name": name,
            "slug": slug,
            "category": subcat,
            "product_type": "thoi-trang-may-mac",
            "price": price,
            "importPrice": float(price * 0.7),
            "stock": random.randint(30, 250),
        })
        stat = random.choice(["SELLING", "SELLING", "NEW"])
        products_list[-1].update({
            "status": stat,
            "rating": 0.0 if stat == "NEW" else round(random.uniform(4.5, 5.0), 1),
            "origin": random.choice(["VN", "CN", "BD", "VN"]),
            "viewCount": random.randint(300, 3500),
            "createdAt": (datetime.now() - timedelta(days=random.randint(10, 180))).strftime("%Y-%m-%d"),
            "author": "Không Áp Dụng",
            "publisher": "Không Áp Dụng",
            "pageCount": 0,
            "language": "vi",
            "brand": brand,
            "model": "Phiên Bản Cơ Bản",
            "color": random.choice(["WHITE", "BLACK", "BLUE", "RED", "GREEN", "YELLOW", "PINK", "BROWN", "GRAY", "MULTI-COLOR"]),
            "condition": "NEW",
            "size": random.choice(["S", "M", "L", "XL", "XXL", "XXXL"]),
            "material": material,
            "gender": random.choice(["MALE", "FEMALE", "UNISEX"]),
            "season": random.choice(["SPRING", "SUMMER", "AUTUMN", "WINTER"])
        })

df_products = pd.DataFrame(products_list)

# Ghi file sản phẩm ra các vị trí đích
path_ai_products = os.path.join(AI_ARTIFACTS_DIR, "products.csv")
path_service_products = os.path.join(PRODUCT_SEEDS_DIR, "products.csv")

df_products.to_csv(path_ai_products, index=False, encoding="utf-8-sig")
df_products.to_csv(path_service_products, index=False, encoding="utf-8-sig")
print(f"✅ Đã ghi products.csv tại AI service: {path_ai_products}")
print(f"✅ Đã ghi products.csv tại Product service: {path_service_products}")

# ==========================================
# 2.1 SINH USERS (UUID) + USERS.CSV
# ==========================================
first_names = [
    "Ân", "Bình", "Chi", "Dũng", "Hạnh", "Khánh", "Lâm", "Linh", "Minh", "Nam",
    "Ngọc", "Phương", "Quang", "Thành", "Thảo", "Trang", "Tuấn", "Vy"
]
last_names = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"
]


def random_phone() -> str:
    return "0" + "".join(str(random.randint(0, 9)) for _ in range(9))


def random_name() -> tuple[str, str]:
    return random.choice(first_names), random.choice(last_names)


def random_gender() -> str:
    return random.choice(["male", "female", "other"])


def random_dob() -> str:
    start_date = datetime.now() - timedelta(days=365 * 40)
    end_date = datetime.now() - timedelta(days=365 * 18)
    return (start_date + timedelta(days=random.randint(0, (end_date - start_date).days))).strftime("%Y-%m-%d")


users_list = []

admin_count = 5
staff_count = 10
customer_count = 500

def add_user(role: str) -> str:
    user_id = str(uuid.uuid4())
    first_name, last_name = random_name()
    username = f"{role.lower()}_{user_id[:6]}"
    email = f"{username}@example.com"
    base_data = {
        "id": user_id,
        "username": username,
        "email": email,
        "role": role,
        "phone_number": random_phone(),
        "gender": random_gender(),
        "is_active": True,
        "date_of_birth": random_dob(),
        "first_name": first_name,
        "last_name": last_name,
        "avatar_url": "https://images.example.com/chan-dung-mac-dinh.jpg",
        "height": round(random.uniform(145, 190), 1),
        "weight": round(random.uniform(40, 95), 1),
        "foot_length": round(random.uniform(21.5, 28.5), 1),
        "position": "Không Áp Dụng",
        "employment_type": "Không Áp Dụng",
    }

    if role == "ADMIN":
        base_data["position"] = random.choice(["Quản Lý", "Giám Đốc", "Giám Sát"])
    elif role == "STAFF":
        base_data["employment_type"] = random.choice(["Toàn Thời Gian", "Bán Thời Gian"])

    users_list.append(base_data)
    return user_id


for _ in range(admin_count):
    add_user("ADMIN")

for _ in range(staff_count):
    add_user("STAFF")

customer_ids = []
for _ in range(customer_count):
    customer_ids.append(add_user("CUSTOMER"))

users_columns = [
    "id",
    "username",
    "email",
    "role",
    "phone_number",
    "gender",
    "is_active",
    "date_of_birth",
    "first_name",
    "last_name",
    "avatar_url",
    "height",
    "weight",
    "foot_length",
    "position",
    "employment_type",
]

df_users = pd.DataFrame(users_list, columns=users_columns)

path_ai_users = os.path.join(AI_ARTIFACTS_DIR, "users.csv")
path_service_users = os.path.join(USER_SEEDS_DIR, "users.csv")

df_users.to_csv(path_ai_users, index=False, encoding="utf-8-sig")
df_users.to_csv(path_service_users, index=False, encoding="utf-8-sig")
print(f"✅ Đã ghi users.csv tại AI service: {path_ai_users}")
print(f"✅ Đã ghi users.csv tại User service: {path_service_users}")

# ==========================================
# 3. SINH LỊCH SỬ HÀNH VI CÓ LOGIC (data_user500.csv)
# ==========================================
categories = df_products["category"].unique()
prod_by_subcat = {subcat: df_products[df_products["category"] == subcat]["id"].tolist() for subcat in categories}

action_progressions = [
    ["search", "view_product", "view_product", "add_to_cart", "purchase"],
    ["search", "view_product", "wishlist_add", "view_product", "add_to_cart", "purchase"],
    ["view_product", "stay_duration", "view_product", "filter_sort", "add_to_cart"],
    ["search", "view_product", "stay_duration", "remove_from_cart"]
]

behavior_data = []
start_time = datetime.now() - timedelta(days=30)

for user_id in customer_ids:
    
    # Quyết định nhóm sở thích chính của user này
    favorite_subcats = random.sample(list(categories), k=2)
    other_subcats = [c for c in categories if c not in favorite_subcats]
    
    num_sessions = random.randint(2, 6)
    user_time = start_time + timedelta(hours=random.randint(1, 100))
    
    for session in range(num_sessions):
        # Chọn tiến trình hành động
        progression = random.choice(action_progressions)
        
        # Chọn danh mục sản phẩm chính cho phiên này
        if random.random() < 0.85:
            current_subcat = random.choice(favorite_subcats)
        else:
            current_subcat = random.choice(other_subcats)
            
        pids = prod_by_subcat[current_subcat]
        if not pids:
            continue
            
        selected_pid = random.choice(pids)
        
        # Một phiên mua sắm nhỏ xoay quanh sản phẩm chính và phụ
        for action in progression:
            user_time += timedelta(minutes=random.randint(1, 12))
            
            # Gợi ý bổ sung: Trong cùng phiên có thể chuyển sang sản phẩm liên quan
            pid = selected_pid
            if action in ["view_product", "stay_duration"] and random.random() < 0.4:
                pid = random.choice(pids)
                
            behavior_data.append({
                "user_id": user_id,
                "product_id": pid,
                "action": action,
                "timestamp": int(user_time.timestamp())
            })
            
        user_time += timedelta(hours=random.randint(4, 48))

df_behavior = pd.DataFrame(behavior_data)

# Ghi file hành vi ra các thư mục đích
path_ai_behavior = os.path.join(AI_ARTIFACTS_DIR, "data_user500.csv")
df_behavior.to_csv(path_ai_behavior, index=False)
print(f"✅ Đã ghi data_user500.csv tại: {path_ai_behavior}")
print(f"🚀 Hoàn tất đồng bộ sinh dữ liệu! Tổng số bản ghi tương tác: {len(df_behavior)}")
