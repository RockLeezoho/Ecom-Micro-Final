FROM python:3.12-slim

# Ngăn Python tạo file .pyc và cho phép log hiển thị ngay lập tức
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết
# Dùng netcat-openbsd để có lệnh `nc` trong entrypoint.sh
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào container
COPY . /app/

# Copy script entrypoint và cấp quyền thực thi
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Sử dụng entrypoint để quản lý khởi động (migrate + seed)
ENTRYPOINT ["/entrypoint.sh"]

# Lệnh mặc định để khởi chạy server (sẽ được truyền vào cuối entrypoint.sh)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]