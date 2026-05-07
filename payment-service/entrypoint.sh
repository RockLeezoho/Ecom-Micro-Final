#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py seed_payment

exec gunicorn config.wsgi:application -b 0.0.0.0:8006 --timeout 120