# Kết quả kiểm thử — ShopAI

Sinh tự động bởi `node test/run-report.js` lúc 09:11:25 27/8/2026.

| Chỉ số | Giá trị |
|---|---|
| Tổng số ca kiểm thử | **42** |
| Đạt | **42** |
| Hỏng | **0** |
| Tỉ lệ đạt | **100.0%** |
| Thời gian chạy | 1.46s |
| Môi trường | Node v22.22.2, không phụ thuộc thư viện ngoài |


## HTTMDTTHA-48 · Hồ sơ cá nhân

10 ca · 10 đạt

- ✅ GET /api/profile trả về hồ sơ đầy đủ
- ✅ GET /api/profile không bao giờ lộ hash mật khẩu
- ✅ Thiếu token thì bị chặn 401
- ✅ PUT /api/profile cập nhật được thông tin và cấu hình AI
- ✅ Dữ liệu thay đổi được lưu bền, đọc lại vẫn đúng
- ✅ Email sai định dạng bị từ chối 422 kèm lỗi từng trường
- ✅ Họ tên quá ngắn và điện thoại thiếu số đều báo lỗi
- ✅ soNgayLuuTru ngoài khoảng 1–365 bị chặn
- ✅ Đổi email làm mất trạng thái đã xác minh
- ✅ Phương thức không hỗ trợ trả 405

## HTTMDTTHA-48 · Đổi mật khẩu

7 ca · 7 đạt

- ✅ Sai mật khẩu hiện tại bị từ chối 401
- ✅ Mật khẩu mới dưới 8 ký tự bị chặn
- ✅ Hai lần nhập không khớp bị chặn
- ✅ Đổi mật khẩu thành công và trả về độ mạnh 0–3
- ✅ Mật khẩu mới có hiệu lực ngay, mật khẩu cũ hết dùng được
- ✅ Không cho đặt lại đúng mật khẩu đang dùng
- ✅ Hash lưu trong kho không phải văn bản thuần

## HTTMDTTHA-49 · Ảnh đại diện

9 ca · 9 đạt

- ✅ POST ảnh PNG hợp lệ trả về đường dẫn công khai
- ✅ Tệp thật sự được ghi xuống đĩa
- ✅ Ảnh tải về được qua HTTP với đúng content-type
- ✅ Tải ảnh mới sẽ xóa ảnh cũ, không để rác trên đĩa
- ✅ Chuỗi không phải data URL bị từ chối 422
- ✅ Định dạng ngoài PNG/JPG/WEBP bị từ chối 415
- ✅ Khai mime là PNG nhưng nội dung không phải ảnh thì bị chặn
- ✅ DELETE gỡ ảnh đại diện thành công
- ✅ DELETE khi chưa có ảnh trả 404

## HTTMDTTHA-50 · Sổ địa chỉ

11 ca · 11 đạt

- ✅ GET trả về danh sách mẫu, mặc định đứng đầu
- ✅ POST thêm địa chỉ mới thành công
- ✅ Thiếu trường bắt buộc bị chặn 422
- ✅ PUT sửa được địa chỉ đã có
- ✅ Sửa địa chỉ không tồn tại trả 404
- ✅ Đặt mặc định chỉ giữ đúng một địa chỉ mặc định
- ✅ Xóa địa chỉ mặc định thì địa chỉ khác được nâng lên thay thế
- ✅ Xóa địa chỉ không tồn tại trả 404
- ✅ Chặn vượt quá 10 địa chỉ mỗi tài khoản
- ✅ Địa chỉ đầu tiên tự động trở thành mặc định
- ✅ Sổ địa chỉ cũng yêu cầu token

## HTTMDTTHA-52 · 53 · Giao diện

5 ca · 5 đạt

- ✅ GET / trả về index.html
- ✅ style.css và app.js được phục vụ đúng kiểu MIME
- ✅ Chặn path traversal ra ngoài thư mục frontend
- ✅ Endpoint API không tồn tại trả 404 dạng JSON
- ✅ /api/health báo đúng thuật toán băm đang dùng


## Ghi chú

- Bộ test khởi động máy chủ thật trên một cổng ngẫu nhiên rồi gọi HTTP thật, không dùng mock.
- Mỗi nhóm tự đặt lại dữ liệu mẫu qua `POST /api/_reset` nên có thể chạy lặp lại nhiều lần.
- Ca *"Tải ảnh mới sẽ xóa ảnh cũ"* từng phát hiện một lỗi thật: `fs.rm` bất đồng bộ khiến phản hồi
  trả về trước khi tệp cũ bị xóa, làm thư mục `uploads` đọng rác. Đã sửa sang `fs.rmSync`.
