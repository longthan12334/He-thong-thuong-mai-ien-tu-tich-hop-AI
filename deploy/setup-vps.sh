#!/usr/bin/env bash
# ==============================================================================
# Aethelgard Mall - Kịch bản cài đặt tự động máy chủ Ubuntu VPS (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
set -e

echo "======================================================================"
echo "    BẮT ĐẦU CÀI ĐẶT MÔI TRƯỜNG MÁY CHỦ SẢN XUẤT CHO AETHELGARD MALL"
echo "======================================================================"

# 1. Cập nhật hệ thống
echo "[1/6] Đang cập nhật gói hệ thống APT..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop ca-certificates gnupg lsb-release

# 2. Cài đặt Docker Engine & Docker Compose chính thức
echo "[2/6] Đang cài đặt Docker Engine và Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    sudo systemctl enable docker
    sudo systemctl start docker
    rm -f get-docker.sh
    echo "[v] Docker đã cài đặt thành công!"
else
    echo "[v] Docker đã tồn tại trên hệ thống."
fi

# 3. Cài đặt Nginx và Certbot (SSL)
echo "[3/6] Đang cài đặt Nginx và Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 4. Cấu hình tường lửa UFW
echo "[4/6] Đang cấu hình tường lửa UFW an toàn..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# 5. Tạo Swap 2GB chống tràn RAM
echo "[5/6] Đang kiểm tra và cấu hình bộ nhớ ảo Swap 2GB..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "[v] Swap 2GB đã được kích hoạt!"
else
    echo "[v] Swap đã tồn tại."
fi

# 6. Tạo thư mục sao lưu CSDL tự động
echo "[6/6] Tạo thư mục sao lưu /var/backups/aethelgard..."
sudo mkdir -p /var/backups/aethelgard
sudo chmod 700 /var/backups/aethelgard

echo ""
echo "======================================================================"
echo "  🎉 THIẾT LẬP MÁY CHỦ VPS HOÀN TẤT THÀNH CÔNG!"
echo "  Tiếp theo: Hãy clone mã nguồn dự án và chạy kịch bản deploy.sh"
echo "======================================================================"
