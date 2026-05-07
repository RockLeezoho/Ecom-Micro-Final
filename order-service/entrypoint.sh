#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py seed_order

exec gunicorn config.wsgi:application -b 0.0.0.0:8005 --timeout 120