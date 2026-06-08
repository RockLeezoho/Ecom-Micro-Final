#!/bin/sh
set -e

# Helper to run payment-service seeding via docker compose from repo root.
# Usage: ./scripts/seed_payment.sh

docker compose -f infrastructure/docker-compose.yml exec -T payment-service python manage.py seed_payment "$@"
