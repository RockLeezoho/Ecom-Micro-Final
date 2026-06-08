#!/bin/bash

# Connection Pool Verification Script
# This script verifies pgbouncer and proxysql connectivity

set -e

echo "=========================================="
echo "Connection Pool Connectivity Check"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check port availability
check_port() {
    local host=$1
    local port=$2
    local name=$3
    
    echo -n "Checking $name ($host:$port)... "
    if nc -z $host $port 2>/dev/null; then
        echo -e "${GREEN}✓ Online${NC}"
        return 0
    else
        echo -e "${RED}✗ Offline${NC}"
        return 1
    fi
}

# Check PgBouncer
echo ""
echo "PostgreSQL Connection Pooling:"
check_port "pgbouncer" "6432" "PgBouncer" || true

# Check ProxySQL
echo ""
echo "MySQL Connection Pooling:"
check_port "proxysql" "6032" "ProxySQL Admin" || true
check_port "proxysql" "6033" "ProxySQL Client" || true

# Check Backend Databases
echo ""
echo "Backend Databases:"
check_port "product-db" "5432" "PostgreSQL" || true
check_port "user-db" "3306" "MySQL (User)" || true
check_port "cart-db" "3306" "MySQL (Cart)" || true
check_port "order-db" "3306" "MySQL (Order)" || true
check_port "payment-db" "3306" "MySQL (Payment)" || true
check_port "shipping-db" "3306" "MySQL (Shipping)" || true

# PgBouncer Stats (if available)
echo ""
echo "=========================================="
echo "PgBouncer Stats:"
echo "=========================================="
docker exec -it pgbouncer psql -h localhost -p 6432 -U admin -d pgbouncer -c "SHOW STATS;" 2>/dev/null || echo "Cannot connect to PgBouncer admin console"

# ProxySQL Stats (if available)
echo ""
echo "=========================================="
echo "ProxySQL Stats:"
echo "=========================================="
docker exec -it proxysql mysql -h 127.0.0.1 -P 6032 -u admin -padmin -e "SELECT * FROM stats_mysql_global;" 2>/dev/null || echo "Cannot connect to ProxySQL admin console"

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
