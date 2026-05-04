FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip setuptools wheel

# 👉 Cài full AI stack trong 1 lần để tránh conflict
RUN pip install --no-cache-dir --timeout 1000 --retries 50 \
    -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8002"]