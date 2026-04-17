#!/bin/bash

COMPOSE_FILE="infrastructure/docker-compose.yml"

echo "======================================================"
echo "          E-COMMERCE MICROSERVICES CONTROL"
echo "======================================================"
echo

case "$1" in
  up)
    echo "[INFO] Đang khởi động hệ thống..."
    docker-compose -f "$COMPOSE_FILE" up -d
    echo "[SUCCESS] Hệ thống đang chạy nền (Background)."
    ;;
  "up user_service")
    echo "[INFO] Đang khởi động user_service..."
    docker-compose -f "$COMPOSE_FILE" up -d user_service
    echo "[SUCCESS] user_service đang chạy nền (Background)."
    ;;
  build)
    echo "[INFO] Đang build lại và khởi động..."
    docker-compose -f "$COMPOSE_FILE" up --build -d
    ;;
  "build user_service")
    echo "[INFO] Đang build lại user_service..."
    docker-compose -f "$COMPOSE_FILE" build user_service
    ;;
  down)
    echo "[INFO] Đang dừng và xoá các containers..."
    docker-compose -f "$COMPOSE_FILE" down
    ;;
  logs)
    echo "[INFO] Đang xem log các service (Nhấn Ctrl+C để thoát)..."
    docker-compose -f "$COMPOSE_FILE" logs -f
    ;;
  ps)
    docker-compose -f "$COMPOSE_FILE" ps
    ;;
  *)
    echo "Cách sử dụng:"
    echo "  ./run.sh up                : Khởi động hệ thống (nền)"
    echo "  ./run.sh build             : Build lại code mới và khởi động"
    echo "  ./run.sh build user_service: Build lại code user_service"
    echo "  ./run.sh up user_service   : Khởi động dịch vụ user_service"
    echo "  ./run.sh down              : Dừng và xoá containers"
    echo "  ./run.sh logs              : Xem log thời gian thực"
    echo "  ./run.sh ps                : Kiểm tra trạng thái containers"
    echo
    echo "Hoặc dùng lệnh tuỳ chỉnh: ./run.sh [lệnh docker-compose]"
    ;;
esac