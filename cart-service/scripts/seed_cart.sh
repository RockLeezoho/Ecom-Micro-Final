#!/bin/sh
set -e

# Helper to run cart-service seeding via docker compose from repo root.
# Usage: ./scripts/seed_cart.sh

docker compose -f infrastructure/docker-compose.yml exec -T cart-service python manage.py seed_cart "$@"
