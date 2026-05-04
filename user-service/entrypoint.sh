#!/bin/sh
set -e

# ==============================
# User Service Entrypoint
# Production Ready Version
# ==============================

MYSQL_HOST=${MYSQL_HOST:-user-db}
MYSQL_PORT=${MYSQL_PORT:-3306}

echo "--- Đang đợi MySQL ($MYSQL_HOST:$MYSQL_PORT) sẵn sàng... ---"

# chờ DB mở port
until nc -z "$MYSQL_HOST" "$MYSQL_PORT"; do
  echo "MySQL chưa sẵn sàng... đợi 2s"
  sleep 2
done

echo "--- MySQL đã sẵn sàng! ---"

# ==============================
# Nếu chạy makemigrations thì bỏ qua migrate auto
# ==============================
if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "makemigrations" ]; then
    echo "--- Chế độ makemigrations: bỏ qua migrate auto ---"
    exec "$@"
fi

# Nếu chạy shell thì bỏ qua migrate
if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "shell" ]; then
    echo "--- Chế độ shell: bỏ qua migrate auto ---"
    exec "$@"
fi

# Nếu chạy createsuperuser thì bỏ qua migrate
if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "createsuperuser" ]; then
    echo "--- Chế độ createsuperuser: bỏ qua migrate auto ---"
    exec "$@"
fi

# ==============================
# Auto migrate
# ==============================
echo "--- Đang migrate database... ---"
python manage.py migrate --noinput

# ==============================
# Seed data (không crash nếu lỗi)
# ==============================
echo "--- Đang seed dữ liệu mẫu... ---"
python manage.py seed_users || true

# ==============================
# Run main command
# ==============================
echo "--- Khởi động service... ---"
exec "$@"