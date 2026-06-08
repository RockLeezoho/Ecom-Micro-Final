#!/bin/sh
set -e

# Read DB connection from env (pooler-first defaults)
DB_HOST=${DB_HOST:-proxysql}
DB_PORT=${DB_PORT:-6033}

echo "--- Waiting for database at $DB_HOST:$DB_PORT ... ---"

until python - <<PY
import socket
import os

host = os.getenv("DB_HOST", "proxysql")
port = int(os.getenv("DB_PORT", "6033"))

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2)
try:
		sock.connect((host, port))
		print("Database socket is reachable")
		raise SystemExit(0)
except Exception:
		raise SystemExit(1)
finally:
		sock.close()
PY
do
	echo "Database not ready yet... waiting 2s"
	sleep 2
done

echo "--- Database is ready! ($DB_HOST:$DB_PORT) ---"

# Skip auto migration in maintenance commands
if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "makemigrations" ]; then
	exec "$@"
fi

if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "shell" ]; then
	exec "$@"
fi

echo "[INFO] Running database migrations..."
python manage.py migrate --noinput

if [ "${CART_SEED_ON_STARTUP:-0}" = "1" ]; then
	echo "[INFO] Seeding cart data (background)..."
	(python manage.py seed_cart > /tmp/cart-seed.log 2>&1 &)
else
	echo "[INFO] Skipping cart seed on startup (CART_SEED_ON_STARTUP=${CART_SEED_ON_STARTUP:-0})"
fi

exec gunicorn config.wsgi:application -b 0.0.0.0:8004 --reload