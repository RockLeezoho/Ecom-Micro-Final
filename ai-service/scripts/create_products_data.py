import pandas as pd
import random

# ==========================
# Đọc file hành vi người dùng
# ==========================
df = pd.read_csv("data_user500.csv")

# Lấy product_id duy nhất
product_ids = df["product_id"].dropna().unique()

# ==========================
# Danh mục sản phẩm mới
# ==========================
catalog = {
    "Book": ["Giáo trình", "Tiểu thuyết"],
    "Electronics": ["Mobile", "Laptop", "Tủ lạnh", "Điều hòa"],
    "Fashion": ["Áo", "Quần", "Giày"]
}

# ==========================
# Brand theo từng loại
# ==========================
brands = {
    "Giáo trình": ["NXB Giáo Dục", "NXB Trẻ", "NXB Đại Học"],
    "Tiểu thuyết": ["NXB Kim Đồng", "NXB Văn Học", "NXB Trẻ"],
    "Truyện tranh": ["NXB Kim Đồng", "NXB Trẻ", "Shueisha", "Kodansha"],

    "Mobile": ["Apple", "Samsung", "Xiaomi", "Oppo"],
    "Laptop": ["Dell", "HP", "Asus", "Lenovo"],
    "Tủ lạnh": ["LG", "Samsung", "Panasonic"],
    "Điều hòa": ["Daikin", "Panasonic", "LG"],

    "Áo": ["Nike", "Adidas", "Uniqlo"],
    "Quần": ["Levis", "Uniqlo", "Routine"],
    "Giày": ["Nike", "Adidas", "Puma"]
}

# ==========================
# Xuất xứ
# ==========================
origins = {
    "NXB Giáo Dục": "Việt Nam",
    "NXB Trẻ": "Việt Nam",
    "NXB Đại Học": "Việt Nam",
    "NXB Kim Đồng": "Việt Nam",
    "NXB Văn Học": "Việt Nam",

    "Shueisha": "Japan",
    "Kodansha": "Japan",
    
    "Apple": "USA",
    "Samsung": "Korea",
    "Xiaomi": "China",
    "Oppo": "China",
    "Dell": "USA",
    "HP": "USA",
    "Asus": "Taiwan",
    "Lenovo": "China",
    "LG": "Korea",
    "Panasonic": "Japan",
    "Daikin": "Japan",

    "Nike": "USA",
    "Adidas": "Germany",
    "Uniqlo": "Japan",
    "Levis": "USA",
    "Routine": "Việt Nam",
    "Puma": "Germany"
}

# ==========================
# Tạo products.csv
# ==========================
products = []

for pid in product_ids:
    category = random.choice(list(catalog.keys()))
    subcategory = random.choice(catalog[category])

    brand = random.choice(brands[subcategory])
    origin = origins[brand]

    name = f"{brand} {subcategory} {pid}"

    # giá theo nhóm
    if category == "Book":
        price = random.randint(50, 300) * 1000
    elif category == "Electronics":
        price = random.randint(3000, 50000) * 1000
    else:
        price = random.randint(200, 3000) * 1000

    stock = random.randint(5, 100)
    rating = round(random.uniform(3.5, 5.0), 1)

    products.append({
        "product_id": pid,
        "name": name,
        "category": category,
        "subcategory": subcategory,
        "brand": brand,
        "origin": origin,
        "price": price,
        "stock": stock,
        "rating": rating
    })

# ==========================
# Xuất file
# ==========================
products_df = pd.DataFrame(products)
products_df.to_csv("products.csv", index=False, encoding="utf-8-sig")

print("Đã tạo products.csv thành công!")
print(products_df.head(10))