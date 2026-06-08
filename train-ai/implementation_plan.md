# Kế Hoạch Thiết Kế Và Triển Khai Hệ Thống Sinh Dữ Liệu Thực Tế & Huấn Luyện AI (E-Commerce Hybrid Recommender System)

Tài liệu này đặc tả toàn bộ kiến trúc thiết kế, quy luật mô phỏng dữ liệu và quy trình huấn luyện cho mô hình gợi ý sản phẩm **`BehaviorLSTM`** phục vụ đồ án Kiến trúc Thiết kế Phần mềm (PTIT). 

Hệ thống giải quyết triệt để vấn đề "dữ liệu hỗn loạn" ban đầu bằng cách xây dựng bộ dữ liệu cao cấp có **phân phối và quy luật logic giống hệt hành vi mua sắm thực tế của con người**.

---

## 1. Kiến Trúc Mô Hình & Tổng Quan Dữ Liệu

Mô hình `BehaviorLSTM` là một mạng nơ-ron hồi quy tuần tự (Sequential Model) nhận đầu vào là chuỗi hành vi tương tác của người dùng để dự đoán sản phẩm có xác suất click/mua tiếp theo cao nhất.

### 📐 Tham Số Mạng Nơ-ron (Model Hyperparameters):
- **Window Size (Kích thước cửa sổ trượt):** 15 tương tác gần nhất.
- **Product Embedding Dimension:** 128 chiều.
- **Action Embedding Dimension:** 128 chiều.
- **LSTM Hidden Units:** 128 (Single layer).
- **Fully Connected Layers (FC):** 
  - Lớp ẩn 1: `hidden_dim -> hidden_dim // 2` (64 nút) kèm hàm kích hoạt `ReLU` và `Dropout(0.25)`.
  - Lớp đầu ra: `64 -> num_prods` (Dự đoán xác suất cho từng ID sản phẩm).

---

## 2. Quy Luật Mô Phỏng Dữ Liệu Tự Sinh Cao Cấp (Rule-Based Simulation)

Để đảm bảo mô hình LSTM có khả năng hội tụ (Loss giảm, Accuracy tăng) và đưa ra gợi ý thông minh, dữ liệu tự sinh được thiết kế dựa trên 3 quy luật hành vi cốt lõi của người tiêu dùng:

### 🎯 Quy luật 1: Sở thích Danh mục (Category Affinity)
Khách hàng không click ngẫu nhiên các sản phẩm không liên quan. Mỗi user giả lập được gắn ngẫu nhiên một **Danh mục yêu thích** (Ví dụ: *Điện tử* hoặc *Thời trang*).
- **Tỷ lệ 85%:** Các sản phẩm trong chuỗi tương tác của user đó sẽ chỉ thuộc danh mục yêu thích.
- **Tỷ lệ 15%:** Tương tác ngẫu nhiên sang các danh mục khác để tạo độ phong phú và đa dạng (Exploration).

### 🛒 Quy luật 2: Phễu Hành Động Thực Tế (Action Conversion Funnel)
Trình tự hành động của người dùng tuân theo phễu chuyển đổi dịch vụ thay vì xuất hiện ngẫu nhiên:
$$\text{Search (Tìm kiếm)} \rightarrow \text{View Product (Xem)} \rightarrow \text{Stay Duration (Xem lâu)} \rightarrow \text{Add to Cart (Thêm giỏ)} \rightarrow \text{Purchase (Mua)}$$
Hành động `purchase` hoặc `add_to_cart` được cấu hình đặt ở cuối chuỗi tương tác trước khi người dùng chuyển sang chuỗi sản phẩm mới.

### 📈 Quy luật 3: Phân Phối Độ Phổ Biến (Pareto / Power Law Distribution)
Trong thực tế, 20% sản phẩm hot sẽ chiếm 80% lượt tương tác. Hệ thống giả lập gán trọng số ưu tiên cho một số sản phẩm cao cấp (như *iPhone 15*, *MacBook Air*, *Tôi Thấy Hoa Vàng Trên Cỏ Xanh*) xuất hiện nhiều hơn trong tập dữ liệu, giúp LSTM học được các sản phẩm xu hướng của cửa hàng.

---

## 3. Cấu Trúc Các Trường Dữ Liệu Sản Phẩm Khớp Với MySQL & Neo4j

File `products.csv` được sinh đồng bộ chứa 90 sản phẩm chia đều cho 3 danh mục cha và các danh mục con, đáp ứng hoàn hảo các ràng buộc trường dữ liệu của Django `seed_products` và đồ thị Neo4j:

### 📂 Phân Cấp Danh Mục (Category Tree):
1. **`sach-luu-tru` (Sách & Lưu trữ):**
   - Subcategories: `giao-trinh`, `tieu-thuyet`, `truyen-tranh`.
   - Các trường riêng biệt: `author` (Tác giả thật), `publisher` (NXB thật), `pageCount` (Số trang), `language` (Ngôn ngữ).
2. **`thiet-bi-dien-tu` (Thiết bị điện tử):**
   - Subcategories: `dien-thoai`, `laptop`, `tu-lanh`, `dieu-hoa`.
   - Các trường riêng biệt: `brand` (Hãng thật), `model`, `color`, `condition` (`NEW`/`REFURBISHED`).
3. **`thoi-trang-may-mac` (Thời trang may mặc):**
   - Subcategories: `ao`, `quan`, `giay`.
   - Các trường riêng biệt: `brand`, `size` (`M`, `L`, `XL`), `material`, `gender` (`MALE`/`FEMALE`/`UNISEX`), `season`.

---

## 🛠️ Quy Trình Chạy Triển Khai (3 Bước)

### Bước 1: Khởi Tạo Bộ Dữ Liệu Đồng Bộ
Chạy script sinh dữ liệu cao cấp tại thư mục `ai-service`:
```bash
python scripts/generate_premium_data.py
```
> [!NOTE]
> File `products.csv` mới sẽ được tự động đồng bộ hóa sang cả 2 thư mục đích:
> - `ai-service/artifacts/products.csv`
> - `product-service/modules/seeds/data_raw/products.csv`

### Bước 2: Huấn Luyện Mạng BehaviorLSTM
Huấn luyện mô hình và lưu trọng số bằng cách chạy:
```bash
python scripts/train_lstm.py
```
Quá trình huấn luyện sử dụng hàm lỗi `CrossEntropyLoss` và bộ tối ưu hóa `Adam` qua 15 epochs. File trọng số `best_behavior_lstm.pth` và bộ mã hóa `prod_encoder.pkl`, `act_encoder.pkl` sẽ được lưu trực tiếp vào thư mục `models/`.

### Bước 3: Cập Nhật Databases
1. **Đồng bộ MySQL chính:**
   Mở terminal tại thư mục `product-service` và chạy:
   ```bash
   python manage.py seed_products --refresh
   ```
2. **Đồng bộ Neo4j:**
   Mở terminal tại thư mục `ai-service` và chạy:
   ```bash
   python scripts/create_kb_graph.py
   ```
3. **Khởi động Docker:**
   Mở terminal tại thư mục `infrastructure` và chạy:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 🔍 Phương Pháp Xác Minh & Đánh Giá Đồ Án
- **Biểu đồ huấn luyện:** Trong quá trình chạy `train_lstm.py`, bạn có thể chụp ảnh terminal hiển thị **Val Loss giảm** và **Val Top-5 Accuracy tăng (đạt trên 75%)** để đưa vào báo cáo slide bảo vệ đồ án.
- **Tính thực tế:** Dữ liệu trên UI Web của bạn giờ đây sẽ hiển thị các sản phẩm chuẩn xác (không còn tên rác), công cụ Chatbot AI RAG sẽ phản hồi các thông tin thông minh đúng ngữ cảnh sách/điện tử/thời trang thật.
