#!/usr/bin/env bash
set -e

echo "==============================================================================="
echo "         AETHELGARD SHOPPING MALL - CHẠY KIỂM THỬ CI CỤC BỘ (LOCAL CI)"
echo "==============================================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 1. Backend: Restore, Build, Test
echo "[1/3] Đang kiểm tra Backend (.NET 10 & Tests)..."
dotnet restore backend/Ecommerce.slnx
dotnet build backend/Ecommerce.slnx -c Release --no-restore
dotnet test backend/Ecommerce.slnx -c Release --no-build --verbosity normal
echo "✅ Toàn bộ bài test Backend (.NET 10) ĐÃ VƯỢT QUA (100%)!"
echo ""

# 2. Frontend: Type Check & Build
echo "[2/3] Đang kiểm tra Frontend (Next.js & TypeScript)..."
cd frontend
npx tsc --noEmit
npm run build
cd "$ROOT_DIR"
echo "✅ Frontend Next.js biên dịch hoàn hảo (0 Lỗi)!"
echo ""

# 3. Docker Compose Config Validation
echo "[3/3] Đang kiểm tra tính hợp lệ của cấu hình Docker Compose..."
if command -v docker &> /dev/null; then
    docker compose config > /dev/null
    echo "✅ File docker-compose.yml hoàn toàn hợp lệ!"
else
    echo "⚠️ Docker chưa được cài đặt hoặc không nằm trong PATH."
fi

echo ""
echo "==============================================================================="
echo "  🎉 TẤT CẢ KIỂM TRA CI ĐÃ THÀNH CÔNG RỰC RỠ! MÃ NGUỒN SẴN SÀNG ĐẨY LÊN GIT."
echo "==============================================================================="
