#!/bin/sh
set -e

python - <<'PY'
import os
import socket
import sys
import time

host = os.getenv("DB_HOST", "order-db")
port = int(os.getenv("DB_PORT", "3306"))

for attempt in range(30):
	try:
		with socket.create_connection((host, port), timeout=2):
			sys.exit(0)
	except OSError:
		time.sleep(2)

print(f"Database {host}:{port} is not reachable after waiting", file=sys.stderr)
sys.exit(1)
PY

python manage.py migrate --fake-initial --noinput

if [ "${ORDER_SEED_ON_STARTUP:-0}" = "1" ]; then
	echo "--- Seeding order data (background) ---"
	(python manage.py seed_order > /tmp/order-seed.log 2>&1 &)
else
	echo "[INFO] Skipping order seed on startup (ORDER_SEED_ON_STARTUP=${ORDER_SEED_ON_STARTUP:-0})"
fi

exec gunicorn config.wsgi:application -b 0.0.0.0:8005 --timeout 120