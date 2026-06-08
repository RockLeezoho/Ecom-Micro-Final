#!/bin/sh
set -e

# Pooler-first defaults. DB_* has priority, POSTGRES_* is backward-compatible.
PGHOST=${DB_HOST:-${POSTGRES_HOST:-pgbouncer}}
PGPORT=${DB_PORT:-${POSTGRES_PORT:-6432}}
APP_DB=${DB_NAME:-${POSTGRES_DB:-product-db}}
APP_USER=${DB_USER:-${POSTGRES_USER:-product-user}}
APP_PASS=${DB_PASSWORD:-${POSTGRES_PASSWORD:-product123456}}

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
echo "--- Waiting for PostgreSQL/Pooler ---"

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$APP_USER" >/dev/null 2>&1; do
  echo "Database not ready yet... waiting 2s"
  sleep 2
done

echo "--- Database is ready ---"


# ==========================================
# Test Connection
# ==========================================
echo "--- Testing DB connection ---"
until psql -h "$PGHOST" -p "$PGPORT" -U "$APP_USER" -d "$APP_DB" -c "SELECT 1;" >/dev/null 2>&1; do
  echo "DB login failed... retry in 2s"
  sleep 2
done
echo "--- DB connection OK ---"

# ==========================================
# Skip auto migrate for utility commands
# ==========================================
if [ "$1" = "python" ] && [ "$2" = "manage.py" ]; then
    case "$3" in
        makemigrations|shell|dbshell|createsuperuser|collectstatic)
            echo "--- Utility mode: skipping auto migrate ---"
            exec "$@"
            ;;
    esac
fi

# ==========================================
# Auto Migrate
# ==========================================
echo "--- Running database migrations ---"
python manage.py migrate --noinput

# ==========================================
# Seed Data (optional / non-blocking)
# Set PRODUCT_SEED_ON_STARTUP=1 to enable seeding at startup.
# When enabled, seeding runs in background and won't block the container.
# ==========================================
if [ "${PRODUCT_SEED_ON_STARTUP:-0}" = "1" ]; then
  echo "--- Seeding product data (background) ---"
  (python manage.py seed_products --refresh > /tmp/product-seed.log 2>&1 &)
else
  echo "[INFO] Skipping product seed on startup (PRODUCT_SEED_ON_STARTUP=${PRODUCT_SEED_ON_STARTUP:-0})"
fi

# ==========================================
# Start Application
# ==========================================
echo "--- Starting Product Service ---"
exec "$@"