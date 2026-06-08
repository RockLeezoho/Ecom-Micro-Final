#!/bin/sh
set -e

python manage.py migrate --noinput --fake-initial

if [ "${SHIPPING_SEED_ON_STARTUP:-0}" = "1" ]; then
	echo "--- Seeding shipping data (background) ---"
	(python manage.py seed_shipping > /tmp/shipping-seed.log 2>&1 &)
else
	echo "[INFO] Skipping shipping seed on startup (SHIPPING_SEED_ON_STARTUP=${SHIPPING_SEED_ON_STARTUP:-0})"
fi

exec gunicorn config.wsgi:application -b 0.0.0.0:8007 --timeout 120