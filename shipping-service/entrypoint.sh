#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py seed_shipping

exec gunicorn config.wsgi:application -b 0.0.0.0:8007 --timeout 120