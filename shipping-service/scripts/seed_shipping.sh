#!/bin/sh
set -e

# Helper to run shipping-service seeding via docker compose from repo root.
# Usage: ./scripts/seed_shipping.sh

docker compose -f infrastructure/docker-compose.yml exec -T shipping-service python manage.py seed_shipping "$@"
