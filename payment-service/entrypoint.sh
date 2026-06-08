#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${PAYMENT_SEED_ON_STARTUP:-0}" = "1" ]; then
	echo "--- Seeding payment data (background) ---"
	(python manage.py seed_payment > /tmp/payment-seed.log 2>&1 &)
else
	echo "[INFO] Skipping payment seed on startup (PAYMENT_SEED_ON_STARTUP=${PAYMENT_SEED_ON_STARTUP:-0})"
fi

exec gunicorn config.wsgi:application -b 0.0.0.0:8006 --timeout 120