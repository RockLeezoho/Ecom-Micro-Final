# E-Commerce Microservices Platform

Hệ thống thương mại điện tử theo kiến trúc microservices, gồm nhiều service độc lập cho người dùng, sản phẩm, giỏ hàng, đơn hàng, thanh toán, vận chuyển và giao diện frontend React. Dự án được triển khai theo hướng thực tế để phục vụ học tập, demo kỹ thuật và phỏng vấn.

## Tổng Quan Nhanh

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Django/DRF theo mô hình microservices
- Giao tiếp nội bộ: HTTP service-to-service, internal token
- Data: PostgreSQL, MySQL, Redis, Neo4j, Chroma/AI artifacts
- Chạy local bằng Docker Compose

## Kiến Trúc

Repo này là một monorepo, gồm:

- `frontend/`: Ứng dụng khách hàng và portal nội bộ
- `user-service/`: tài khoản, hồ sơ, địa chỉ giao hàng
- `product-service/`: danh mục, sản phẩm, tồn kho, reservation
- `cart-service/`: giỏ hàng
- `order-service/`: tạo đơn, quản lý trạng thái đơn hàng
- `payment-service/`: thanh toán
- `shipping-service/`: vận chuyển
- `ai-service/`: gợi ý sản phẩm / AI support
- `api-gateway/`: reverse proxy / gateway layer
- `infrastructure/`: docker compose, dữ liệu khởi tạo, test connectivity

## Những Gì Đã Hoàn Thành

Phần này là điểm nhấn để dùng khi phỏng vấn.

### 1. Checkout flow hoàn chỉnh
- Hiển thị địa chỉ giao hàng ngay trong checkout.
- Cho phép chọn từ địa chỉ đã lưu hoặc thêm mới địa chỉ.
- Tự động validate dữ liệu trước khi thanh toán.
- Đồng bộ shipping method, payment method và phí ship.

### 2. Chặn sản phẩm hết hàng ở nhiều lớp
- Chặn ở trang danh sách sản phẩm: nút “Thêm” bị disable khi `stock = 0`.
- Chặn ở trang chi tiết sản phẩm: không cho thêm vào giỏ hoặc mua ngay khi hết hàng.
- Chặn ở giỏ hàng và checkout: không cho đặt nếu số lượng vượt tồn kho.
- Backend order/product reservation cũng trả về lỗi rõ ràng thay vì 500 mơ hồ.

### 3. Quản lý địa chỉ giao hàng
- Trang quản lý địa chỉ riêng cho customer.
- Thêm / xóa địa chỉ.
- Đồng bộ với checkout để chọn nhanh địa chỉ đã lưu.

### 4. Lịch sử đơn hàng
- Có trang lịch sử đơn hàng cho customer.
- Có trang chi tiết đơn hàng và điều hướng sang review sản phẩm.
- Đã thêm mục “Lịch sử đơn hàng” vào dropdown tài khoản trong header.

### 5. Order reservation và internal auth
- Sửa luồng order-service gọi product-service reservation.
- Chuẩn hóa base URL service-to-service.
- Thêm internal service token (`X-Service-Token`) để chặn gọi trái phép.
- Xử lý lỗi hết tồn kho theo hướng business validation (HTTP 400).

### 6. Seed script và dữ liệu
- Làm cứng script seed để tránh fail hàng loạt khi một record lỗi.
- Tối ưu luồng seed để dễ rebuild môi trường local.
- Hỗ trợ chạy lại môi trường dev nhanh hơn cho demo / phỏng vấn.

## Điểm Nhấn Kỹ Thuật

- RBAC theo vai trò: customer / staff / admin
- Reservation kho trước khi tạo đơn để giảm oversell
- Xử lý JSON serialization cho UUID ở gateway
- Defensive error handling giữa các service
- UI chặn lỗi sớm ở client trước khi gọi backend
- Tách service rõ ràng, dễ scale và debug

## Chức Năng Theo Service

### user-service
- Đăng ký / đăng nhập
- Hồ sơ người dùng
- Địa chỉ giao hàng
- Phân quyền customer / staff / admin

### product-service
- Danh mục sản phẩm
- Chi tiết sản phẩm
- Tồn kho và giữ kho (reservation)
- Điều kiện hết hàng và xác thực stock

### cart-service
- Giỏ hàng người dùng
- Chọn / bỏ chọn sản phẩm

### order-service
- Tạo đơn hàng
- Điều phối reservation và payment
- Lịch sử đơn hàng và trạng thái đơn

### payment-service
- Khởi tạo thanh toán
- Đồng bộ kết quả thanh toán

### shipping-service
- Xử lý phí ship / carrier / handover

### ai-service
- Gợi ý sản phẩm theo ngữ cảnh
- Tích hợp AI hỗ trợ tìm sản phẩm

## Chạy Dự Án Local

### 1. Yêu cầu
- Docker
- Docker Compose
- Node.js (nếu muốn chạy frontend riêng)
- Python 3.11+ (nếu muốn chạy service ngoài Docker)

### 2. Chạy toàn bộ hệ thống

```bash
./run.sh up
```

Hoặc:

```bash
docker-compose -f infrastructure/docker-compose.yml up -d
```

### 3. Xem log

```bash
./run.sh logs
```

### 4. Dừng hệ thống

```bash
./run.sh down
```

## Một Số Route Hữu Ích

- Frontend: `http://localhost:3000`
- Gateway: `http://localhost:8080`
- user-service: `http://localhost:8001`
- product-service: `http://localhost:8003`
- cart-service: `http://localhost:8004`
- order-service: `http://localhost:8005`
- payment-service: `http://localhost:8006`

## Quy Trình Nghiệp Vụ Nổi Bật

### Checkout
1. Customer chọn sản phẩm ở danh sách hoặc chi tiết.
2. Sản phẩm hết hàng sẽ bị chặn ở UI.
3. Customer chọn địa chỉ giao hàng hoặc thêm mới.
4. Frontend gọi order-service.
5. Order-service giữ kho bên product-service.
6. Nếu hết hàng, API trả 400 và frontend hiển thị thông báo.

### Order history
1. Customer mở dropdown tài khoản.
2. Chọn “Lịch sử đơn hàng”.
3. Hệ thống điều hướng tới trang `/orders`.
4. Có thể xem chi tiết từng đơn và viết review.

## Gợi Ý Khi Phỏng Vấn

Bạn có thể nhấn mạnh các điểm sau:

- Đã xử lý bài toán xuyên service: order -> product reservation -> payment.
- Đã thiết kế chặn lỗi sớm ở frontend lẫn backend.
- Đã thêm internal authentication giữa các service để tránh gọi trái phép.
- Đã tách rõ các responsibility: checkout, address, order history, stock reservation.
- Đã debug các lỗi thực tế như route mismatch, UUID serialization, thiếu stock, thiếu token nội bộ.

## Ghi Chú

- Dự án đang được tối ưu theo hướng thực chiến, nên một số route / env / service name có thể thay đổi theo cấu hình Docker Compose.
- Khi demo, nên khởi động toàn bộ hệ thống bằng Docker để đảm bảo các service nội bộ nhìn thấy nhau.

## Tài Liệu Phụ

- `run.sh`: script điều khiển hệ thống local
- `infrastructure/docker-compose.yml`: cấu hình khởi động toàn bộ services
- `frontend/README.md`: README riêng của frontend

## Tác Giả

Dự án được xây dựng phục vụ học tập, trình diễn kỹ thuật và phỏng vấn.
