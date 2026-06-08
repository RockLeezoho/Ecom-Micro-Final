# Kế hoạch Triển khai Sinh dữ liệu huấn luyện và sản phẩm cao cấp (E-commerce AI Recommender System)

Để giải quyết triệt để tình trạng dữ liệu hỗn loạn hiện tại (tên sản phẩm không thực tế, mô tả sai lệch, hành vi người dùng ngẫu nhiên vô nghĩa), chúng tôi đề xuất triển khai một bộ sinh dữ liệu cao cấp có quy luật logic thực tế. Điều này sẽ đồng bộ hóa cơ sở dữ liệu sản phẩm của hệ thống với hành vi huấn luyện của mô hình AI, giúp mô hình `BehaviorLSTM` đạt hiệu quả hội tụ tối ưu nhất.

## 📌 Các bước triển khai cốt lõi

### Bước 1: Sinh Dữ Liệu Đồng Bộ
Mở terminal tại thư mục `train-ai` và chạy:
```bash
python generate_premium_data.py
```
Script này sẽ tự động sinh danh mục sản phẩm thực tế (iPhone, MacBook, Nike, sách thật...) và lịch sử hành vi của 500 người dùng theo đúng quy luật phễu chuyển đổi. File `products.csv` mới sẽ được ghi đè đồng bộ vào cả 2 service:
1. `product-service/modules/seeds/data_raw/products.csv` (Dùng để seed CSDL chính).
2. `train-ai/artifacts/products.csv` (Dùng để nạp vào Neo4j và ChromaDB).

---

### Bước 2: Huấn Luyện Mô Hình BehaviorLSTM
Tiến hành chạy huấn luyện mạng nơ-ron:
```bash
python train_lstm.py
```
- **Kết quả:** Mô hình sẽ tự động chia tập dữ liệu trượt cửa sổ (`window_size = 15`), mã hóa index đồng bộ, huấn luyện mô hình qua 15 epochs để đạt độ hội tụ tối ưu, rồi xuất các file trọng số `best_behavior_lstm.pth` và các bộ encoders `.pkl` vào thư mục `models/` của `train-ai`.

---

### Bước 3: Đồng Bộ Hóa Hệ Thống Microservices & Databases

1. **Seed lại MySQL chính:**
   Mở terminal tại thư mục `product-service` và chạy lệnh Django để làm sạch dữ liệu cũ và nạp sản phẩm mới:
   ```bash
   python manage.py seed_products --refresh
   ```

2. **Nạp dữ liệu đồ thị Neo4j:**
   Mở terminal tại thư mục `train-ai` và chạy lệnh import dữ liệu đồ thị:
   ```bash
   python create_kb_graph.py
   ```

3. **Khởi động lại Docker Compose:**
   Mở terminal tại thư mục `infrastructure` và khởi động lại các container:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 🔍 Kế Hoạch Xác Minh (Verification)

* **Trang web (Frontend):** Các sản phẩm hiển thị trên màn hình sẽ đổi thành các tên thương hiệu thật (e.g., *iPhone 15*, *MacBook Air*, *Giày Nike*, *Sách Số Đỏ*) với giá tiền và thuộc tính chuẩn xác.
* **Gợi ý AI & Chatbot:** Khi bạn chat với Chatbot hoặc xem chi tiết sản phẩm, hệ thống gợi ý hybrid (kết hợp LSTM + Graph + RAG) sẽ đưa ra các kết quả cực kỳ thông minh và chuẩn logic ngữ cảnh!
