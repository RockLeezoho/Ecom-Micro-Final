FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Cài đặt các dependencies hệ thống cần thiết
RUN apt-get update && apt-get install -y gcc libpq-dev postgresql-client

# Copy và cấp quyền thực thi cho entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Cấu hình Entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Use Django dev server in container for simplicity (gunicorn may not be installed in some build contexts)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8003"]
