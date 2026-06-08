#!/bin/sh
set -e

# Helper to run product-service seed via docker compose
# Usage: ./scripts/seed_products.sh [--refresh]

docker compose -f infrastructure/docker-compose.yml exec -T product-service python manage.py seed_products "$@"
