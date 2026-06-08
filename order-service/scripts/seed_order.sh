#!/bin/sh
set -e

# Helper to run order-service seeding via docker compose from repo root.
# Usage: ./scripts/seed_order.sh

docker compose -f infrastructure/docker-compose.yml exec -T order-service python manage.py seed_order "$@"
