# ========================================
# STAGE 1: BUILDER (Build environment)
# ========================================
# Môi trường build đầy đủ với các công cụ nặng nề
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Copy config files
COPY requirements.txt /app/

# Cài đặt thư viện hệ thống (gồm build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Python dependencies
# Tất cả packages sẽ được cài trong /usr/local/lib/python3.12/site-packages
RUN pip install --no-cache-dir -r requirements.txt

# ========================================
# STAGE 2: RUNTIME (Production runtime)
# ========================================
# Môi trường runtime sạch và nhẹ, chỉ copy file cần thiết
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Copy Python site-packages từ builder
# Điều này chứa tất cả pip packages đã cài từ stage 1
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# Copy requirements.txt (tùy chọn, cho reference)
COPY requirements.txt /app/

# Cài đặt chỉ runtime libraries (không build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy source code ứng dụng
COPY . /app/

# ========================================
# RUNTIME ENTRYPOINT
# ========================================
# Sử dụng entrypoint để quản lý khởi động (migrate + seed)
ENTRYPOINT ["/entrypoint.sh"]

# Lệnh mặc định để khởi chạy server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]