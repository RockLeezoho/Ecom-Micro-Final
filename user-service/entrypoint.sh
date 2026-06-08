#!/bin/sh
set -e

# ==============================
# User Service Entrypoint
# Production Ready - ProxySQL Architecture
# ==============================

# Read database connection from env (from docker-compose or .env)
# Defaults follow deployment model: DB_HOST should be 'proxysql' (pooler) or 'user-db' (direct)
DB_HOST=${DB_HOST:-proxysql}
DB_PORT=${DB_PORT:-6033}

echo "--- Waiting for database at $DB_HOST:$DB_PORT ... ---"

# Wait until database (or pooler) responds
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Database not ready yet... waiting 2s"
  sleep 2
done

echo "--- Database is ready! ($DB_HOST:$DB_PORT) ---"

# ==============================
# Skip migrations for certain commands
# ==============================
if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "makemigrations" ]; then
    echo "[INFO] makemigrations mode: skipping auto-migrate"
    exec "$@"
fi

if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "shell" ]; then
    echo "[INFO] shell mode: skipping auto-migrate"
    exec "$@"
fi

if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "createsuperuser" ]; then
    echo "[INFO] createsuperuser mode: skipping auto-migrate"
    exec "$@"
fi

# ==============================
# Auto-migrate database schema
# ==============================
echo "[INFO] Running database migrations..."
python manage.py migrate --noinput

# ==============================
# Seed sample data on demand only.
# Default is off in compose so startup does not block api-gateway/frontend.
# ==============================
if [ "${USER_SEED_ON_STARTUP:-0}" = "1" ]; then
    echo "[INFO] Seeding sample user data in the background..."
    python manage.py seed_users --refresh >/tmp/user-seed.log 2>&1 &
    echo "[INFO] Seed started asynchronously; logs will be written to /tmp/user-seed.log"
else
    echo "[INFO] Skipping user seed on startup (USER_SEED_ON_STARTUP=0)"
fi

# ==============================
# Start main application
# ==============================
echo "[INFO] Starting user-service..."
exec "$@"