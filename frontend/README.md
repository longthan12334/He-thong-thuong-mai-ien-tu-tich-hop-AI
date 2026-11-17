# Frontend Aethelgard Mall

## Chạy cục bộ

Dùng Node.js 20 theo cấu hình CI. Chạy backend ở cổng 5000 trước khi kiểm tra đăng nhập.

```bash
npm ci
npm run dev
```

Mở http://localhost:3001/login. Mặc định frontend gọi http://localhost:5000/api. Đặt `NEXT_PUBLIC_API_URL` trong `.env.local` nếu dùng cổng khác. Khi build Docker, truyền URL này qua build argument. Image frontend trên GHCR dùng đường dẫn `/api` và cần [Nginx reverse proxy](../deploy/nginx/aethelgard.conf) chuyển tiếp API và SignalR đến backend.

## Màn hình xác thực

| Màn hình | Đường dẫn và hành vi |
| --- | --- |
| Đăng nhập, đăng ký | `/login` có bố cục form và ảnh bên cạnh trên màn hình rộng |
| Quên mật khẩu | Nhập email, xác thực OTP 6 số, nhập và xác nhận mật khẩu mới |
| Đổi mật khẩu | `/seller/account`, tab bảo mật, xác thực mật khẩu hiện tại |

Chỉ báo mật khẩu gồm bốn mức **Yếu**, **Trung bình**, **Khá**, **Mạnh**. Toast hiển thị khi gửi mã, xác thực, lưu hoặc gặp lỗi. Cấu hình SMTP theo [mẫu triển khai](../deploy/.env.production.example) để nhận OTP qua email.

## Kiểm tra trước PR

- Chạy `npm run lint` và `npm run build` từ thư mục này.
- Thử OTP đúng, OTP sai, gửi lại, nhập mã bằng clipboard và mật khẩu mới bỏ trống hoặc khác xác nhận. Sau khi reset thành công, đăng nhập lại bằng mật khẩu mới.
- Trong Chrome DevTools Performance, ghi luồng mở form quên mật khẩu, đổi bước và hiển thị Toast. Trên màn hình 60 Hz, kiểm tra khung hình vượt khoảng 16,7 ms và ghi lại thiết bị cùng kết quả. Thử lại với tùy chọn giảm chuyển động.
- Từ thư mục gốc, chạy `docker compose up --build --wait` và `python scripts/check-compose-smoke.py`. CI kiểm tra thêm API danh sách sản phẩm và trang đăng nhập.
