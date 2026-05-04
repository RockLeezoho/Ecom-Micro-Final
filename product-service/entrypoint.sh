#!/bin/sh
set -e

# ==========================================
# Product Service Entrypoint
# Enterprise Clean Version
# ==========================================

PGHOST=${POSTGRES_HOST:-product-db}
PGPORT=${POSTGRES_PORT:-5432}
APP_DB=${POSTGRES_DB:-product-db}
APP_USER=${POSTGRES_USER:-product-user}
APP_PASS=${POSTGRES_PASSWORD:-123456}

export PGPASSWORD="$APP_PASS"

echo "======================================"
echo " Product Service Booting..."
echo " HOST : $PGHOST"
echo " PORT : $PGPORT"
echo " DB   : $APP_DB"
echo " USER : $APP_USER"
echo "======================================"

# ==========================================
# Wait PostgreSQL Ready
# ==========================================
echo "--- Đang đợi PostgreSQL sẵn sàng ---"

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$APP_USER" >/dev/null 2>&1; do
  echo "PostgreSQL chưa sẵn sàng... đợi 2s"
  sleep 2
done

echo "--- PostgreSQL đã sẵn sàng ---"


# ==========================================
# Test Connection
# ==========================================
echo "--- Kiểm tra kết nối DB ---"
until psql -h "$PGHOST" -p "$PGPORT" -U "$APP_USER" -d "$APP_DB" -c "SELECT 1;" >/dev/null 2>&1; do
  echo "Đăng nhập DB thất bại... thử lại sau 2s"
  sleep 2
done
echo "--- Kết nối DB thành công ---"

# ==========================================
# Skip auto migrate for utility commands
# ==========================================
if [ "$1" = "python" ] && [ "$2" = "manage.py" ]; then
    case "$3" in
        makemigrations|shell|dbshell|createsuperuser|collectstatic)
            echo "--- Utility mode: bỏ qua auto migrate ---"
            exec "$@"
            ;;
    esac
fi

# ==========================================
# Auto Migrate
# ==========================================
echo "--- Đang migrate database ---"
python manage.py migrate --noinput

# ==========================================
# Seed Data
# ==========================================
echo "--- Đang seed dữ liệu sản phẩm ---"
python manage.py seed_products || true

# ==========================================
# Start Application
# ==========================================
echo "--- Khởi động Product Service ---"
exec "$@"