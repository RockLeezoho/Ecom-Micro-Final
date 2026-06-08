# ========================================
# STAGE 1: BUILDER (Build environment)
# ========================================
# Môi trường build đầy đủ với các công cụ nặng nề
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Layer 1: Copy config files
COPY requirements.txt .

# Layer 2: Cài đặt thư viện hệ thống (gồm build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Layer 3: Cài đặt Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ========================================
# STAGE 2: RUNTIME (Production runtime)
# ========================================
# Môi trường runtime sạch và nhẹ, chỉ copy file cần thiết
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy Python site-packages từ builder
# Điều này chứa tất cả pip packages đã cài từ stage 1
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy requirements.txt (tùy chọn, cho reference)
COPY requirements.txt .

# Cài đặt chỉ runtime libraries (không build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Copy source code ứng dụng
COPY . .

# ========================================
# RUNTIME CONFIGURATION
# ========================================
EXPOSE 8005

ENTRYPOINT ["/app/entrypoint.sh"]
