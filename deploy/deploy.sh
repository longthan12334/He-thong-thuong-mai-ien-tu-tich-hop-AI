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
if [ -d .git ]; then
    echo "[1/5] Đang đồng bộ mã nguồn mới nhất từ Git..."
    git pull origin main || git pull origin master || git pull origin hoang || true
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
echo "[3/5] Đang kiểm tra trạng thái sức khỏe các dịch vụ..."
sleep 5
docker compose ps

echo "[4/5] Kiểm tra phản hồi Backend API..."
for i in {1..20}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/products?pageSize=1 || true)
    if [ "$STATUS" = "200" ]; then
        echo "✅ Backend API sẵn sàng (HTTP 200)!"
        break
    fi
    echo "Đang chờ Backend khởi động ($i/20)..."
    sleep 3
done

# 5. Dọn dẹp tài nguyên thừa
echo "[5/5] Đang dọn dẹp các Docker image cũ..."
docker image prune -f

echo ""
echo "======================================================================"
echo "  🎉 WEBSITE ĐÃ ĐƯỢC TRIỂN KHAI THÀNH CÔNG RỰC RỠ!"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend:  http://localhost:5000"
echo "======================================================================"
