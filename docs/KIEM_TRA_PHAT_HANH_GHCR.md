# Kiểm tra bản phát hành trên GHCR

Hướng dẫn này dùng để xác nhận hai Docker image của một lần chạy CD. Xem [tài liệu CI/CD](CI_CD_PIPELINE.md) để biết các điều kiện kích hoạt workflow.

## Xác định image cần kiểm tra

1. Mở **Actions** và chọn lần chạy **Aethelgard Mall CD** tương ứng với commit cần phát hành.
2. Mở job **Build & Publish Container Images**. Kiểm tra riêng kết quả hai bước **Build & Push Backend Container Image** và **Build & Push Frontend Container Image**. Workflow thử đẩy cả hai image và báo lỗi ở cuối job nếu một bước build/push thất bại hoặc bị bỏ qua.
3. Trong bước **Báo cáo Kết quả Triển khai**, sao chép tag `sha-…` tương ứng của từng image. Bước này chạy cả khi workflow gặp lỗi và danh sách tag là đầu ra của bước chuẩn bị metadata.

## Đối chiếu trên registry

Thay `sha-<id>` trong từng lệnh bằng tag lấy từ log. Chạy hai lệnh từ môi trường đã đăng nhập GHCR nếu package giới hạn quyền đọc.

```powershell
docker buildx imagetools inspect "ghcr.io/longthan12334/he-thong-thuong-mai-ien-tu-tich-hop-ai/backend:sha-<id>"
docker buildx imagetools inspect "ghcr.io/longthan12334/he-thong-thuong-mai-ien-tu-tich-hop-ai/frontend:sha-<id>"
```

Ghi lại digest của từng image. Chỉ xác nhận phát hành đủ hai image khi cả hai bước build/push thành công và cả hai lệnh trả về manifest. Nếu thiếu manifest, đối chiếu tag và quyền đọc package rồi xem log bước build/push tương ứng. Hai manifest xác nhận image đã có trên registry. Việc cập nhật container trên máy chủ cần xác minh ở môi trường chạy ứng dụng.
