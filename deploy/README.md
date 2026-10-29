# 🚀 HƯỚNG DẪN TRIỂN KHAI NHANH TRÊN MÁY CHỦ VPS (UBUNTU)

Thư mục này chứa đầy đủ các công cụ tự động hóa để triển khai website **Aethelgard Shopping Mall** lên máy chủ VPS Linux (Ubuntu 22.04 / 24.04 LTS).

---

## 📁 DANH SÁCH CÔNG CỤ

1. **`setup-vps.sh`**: Kịch bản cài đặt tự động toàn bộ môi trường ban đầu trên VPS trắng (Docker, Compose, Nginx, Certbot SSL, UFW Firewall, Swap 2GB).
2. **`deploy.sh`**: Kịch bản 1-click build và khởi động hệ thống, tự động kiểm tra healthcheck và dọn dẹp images.
3. **`nginx/aethelgard.conf`**: Cấu hình Nginx Reverse Proxy tối ưu với HTTP/2, Gzip, bảo mật headers và WebSocket cho SignalR.
4. **`.env.production.example`**: Bản mẫu các biến môi trường cần thiết trên máy chủ sản xuất.

---

## ⚡ 4 BƯỚC TRIỂN KHAI THỰC TẾ

### Bước 1: Chuẩn bị máy chủ VPS & Tên miền
1. Tạo VPS Ubuntu (khuyến nghị RAM 4GB, 2 CPU).
2. Trỏ bản ghi DNS tên miền `your-domain.com` về địa chỉ IPv4 của VPS.

### Bước 2: Thiết lập môi trường VPS (Chạy 1 lần duy nhất)
Đăng nhập SSH vào VPS và chạy:
```bash
curl -fsSL https://raw.githubusercontent.com/longthan12334/He-thong-thuong-mai-ien-tu-tich-hop-AI/hoang/deploy/setup-vps.sh | bash
```

### Bước 3: Lấy mã nguồn & Cấu hình biến môi trường
```bash
git clone https://github.com/longthan12334/He-thong-thuong-mai-ien-tu-tich-hop-AI.git
cd He-thong-thuong-mai-ien-tu-tich-hop-AI
cp deploy/.env.production.example .env.production
nano .env.production # Cập nhật tên miền và GEMINI_API_KEY
```

### Bước 4: Khởi chạy và kích hoạt SSL
1. Khởi chạy website bằng Docker:
   ```bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh
   ```
2. Cài đặt tệp cấu hình Nginx:
   ```bash
   sudo cp deploy/nginx/aethelgard.conf /etc/nginx/sites-available/aethelgard.conf
   sudo sed -i 's/YOUR_DOMAIN/your-domain.com/g' /etc/nginx/sites-available/aethelgard.conf
   sudo ln -s /etc/nginx/sites-available/aethelgard.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Cấp phát chứng chỉ SSL miễn phí tự động:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

Website của bạn sẽ chính thức hoạt động tại địa chỉ: **`https://your-domain.com`**!
