# ========================================
# STAGE 1: BUILDER (Build environment)
# ========================================
# Môi trường build để cài đặt dependencies (gồm cả torch nặng)
FROM python:3.10-slim AS builder

WORKDIR /app

# Layer 1: Copy config files
COPY requirements.txt .

# Layer 2: Install build tools và Python dev libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Layer 3: Install pip tools
RUN pip install --upgrade pip setuptools wheel

# Layer 4: Install PyTorch (CPU-only to avoid CUDA wheels during build)
RUN pip install --no-cache-dir --timeout 1000 --retries 50 \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.2.2+cpu

# Layer 5: Install other dependencies
RUN pip install --no-cache-dir --timeout 1000 --retries 50 \
    -r requirements.txt

# ========================================
# STAGE 2: RUNTIME (Production runtime)
# ========================================
# Môi trường runtime sạch, chỉ copy file cần thiết
FROM python:3.10-slim AS runtime

WORKDIR /app

# Copy Python site-packages từ builder
# Điều này chứa tất cả pip packages (gồm torch, dependencies) đã cài từ stage 1
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Copy console scripts (gunicorn, etc.) so executables are available in runtime
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy requirements.txt (tùy chọn, cho reference)
COPY requirements.txt .

# Cài đặt runtime dependencies (không build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy source code ứng dụng
COPY . .

# ========================================
# RUNTIME CONFIGURATION
# ========================================
EXPOSE 8002
EXPOSE 50051

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8002"]