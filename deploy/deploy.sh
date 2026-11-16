#!/usr/bin/env bash
# ==============================================================================
# Aethelgard Mall - Kịch bản 1-Click Triển Khai / Cập Nhật Container (deploy.sh)
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "======================================================================"
echo "    BẮT ĐẦU TRIỂN KHAI / CẬP NHẬT AETHELGARD SHOPPING MALL"
echo "======================================================================"

# 1. Kéo mã nguồn mới nhất (nếu là git repo)
if [ -e .git ]; then
    echo "[1/5] Đang đồng bộ mã nguồn mới nhất từ Git..."
    git pull --ff-only
fi

# 2. Kiểm tra tệp cấu hình môi trường
if [ ! -f .env.production ]; then
    echo "[!] CẢNH BÁO: Không tìm thấy .env.production. Đang tạo từ .env.production.example..."
    if [ -f deploy/.env.production.example ]; then
        cp deploy/.env.production.example .env.production
    fi
fi

# 3. Đóng gói và khởi chạy Docker Compose
echo "[2/5] Đang build và khởi động các Container qua Docker Compose..."
docker compose --env-file .env.production up --build -d

# 4. Kiểm tra sức khỏe hệ thống (Health Check)
echo "[3/5] Đang kiểm tra trạng thái các dịch vụ..."
docker compose --env-file .env.production ps
backend_binding=$(docker compose --env-file .env.production port backend 5000)
frontend_binding=$(docker compose --env-file .env.production port frontend 3001)
backend_port=${backend_binding##*:}
frontend_port=${frontend_binding##*:}

echo "[4/5] Đang chờ API và giao diện phản hồi..."
if ! python3 scripts/check-compose-smoke.py --backend-port "$backend_port" --frontend-port "$frontend_port"; then
    docker compose --env-file .env.production logs --tail=100 || true
    exit 1
fi

# 5. Dọn dẹp tài nguyên thừa
echo "[5/5] Đang dọn dẹp các Docker image cũ..."
docker image prune -f

echo ""
echo "======================================================================"
echo "  🎉 WEBSITE ĐÃ ĐƯỢC TRIỂN KHAI THÀNH CÔNG RỰC RỠ!"
echo "  - Frontend: http://localhost:$frontend_port"
echo "  - Backend:  http://localhost:$backend_port"
echo "======================================================================"
