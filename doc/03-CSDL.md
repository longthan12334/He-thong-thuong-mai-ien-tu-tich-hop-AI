# 3. Cơ sở dữ liệu

## 3.1. Tệp lược đồ

| Tệp | Nội dung |
|---|---|
| `backend/database/01_schema_sprint2_mysql.sql` | Lược đồ cho MySQL 8.0+ |
| `backend/database/01_schema_sprint2_postgres.sql` | Lược đồ cho PostgreSQL 14+ |
| `backend/database/02_seed_data_mysql.sql` | Dữ liệu mẫu — MySQL |
| `backend/database/02_seed_data_postgres.sql` | Dữ liệu mẫu — PostgreSQL |
| `docs/diagrams/erd_sprint2.png` | Sơ đồ ERD 21 bảng nghiệp vụ Sprint 2 |
| `docs/diagrams/erd_auth_rbac.png` | Sơ đồ ERD phân hệ xác thực và phân quyền |

Hai tệp lược đồ sinh ra từ cùng một nguồn định nghĩa, nên nội dung nghiệp vụ
giống hệt nhau, chỉ khác cú pháp. Cả hai đã được chạy thật: **32 bảng, 45 khóa
ngoại, 19 ràng buộc duy nhất, 32 ràng buộc miền giá trị, 97 chỉ mục**, không lỗi.

Phân hệ 1 và 2 (nền tảng, đã có từ Sprint 1) dùng `CREATE TABLE IF NOT EXISTS`
nên chạy an toàn trên cơ sở dữ liệu đã có sẵn bảng tài khoản.

## 3.2. Bốn phân hệ trong phạm vi hiện tại

| Mã | Phân hệ | Số bảng |
|---|---|:-:|
| PH1 | Người dùng và phân quyền | 8 |
| PH2 | Gian hàng và kho | 3 |
| PH3 | Danh mục, sản phẩm, tồn kho | 11 |
| PH4 | Giỏ hàng, đơn hàng, thanh toán, vận chuyển | 10 |

## 3.3. Bảng dùng trong ba ticket vừa hoàn thành

| Bảng | Vai trò |
|---|---|
| `orders` | Đơn hàng, tách theo gian hàng |
| `order_items` | Dòng chi tiết, đóng băng tên và giá tại thời điểm mua |
| `order_status_histories` | Vết chuyển trạng thái, chỉ ghi thêm |
| `payments` | Giao dịch thanh toán; một đơn có thể nhiều lần thử |
| `shipments` · `shipment_tracking_logs` · `carriers` | Vận đơn và hành trình |
| `inventories` · `inventory_transactions` | Tồn kho và nhật ký biến động |
| `products` · `product_variants` · `product_images` | Sản phẩm và biến thể |
| `categories` · `brands` · `shops` · `warehouses` | Danh mục, thương hiệu, gian hàng, kho |

## 3.4. Nguyên tắc thiết kế then chốt

**Tách sản phẩm khỏi biến thể.** Mọi giao dịch mua bán và mọi bản ghi tồn kho
tham chiếu `variant_id`, không tham chiếu `product_id`. Nhờ vậy một sản phẩm có
nhiều màu và dung lượng vẫn quản lý được giá và tồn riêng cho từng tổ hợp.

**Giữ chỗ tồn kho.** `inventories` tách `qty_on_hand` (tồn thực) khỏi
`qty_reserved` (đã giữ chỗ cho đơn chưa hoàn tất), kèm ràng buộc
`qty_reserved <= qty_on_hand`. Khi khách đặt đơn, hệ thống tăng `qty_reserved`
chứ không trừ thẳng `qty_on_hand` — tránh bán vượt kho, và đơn hủy giữa chừng
chỉ cần nhả giữ chỗ.

**Đóng băng dữ liệu giao dịch.** `order_items` lưu bản sao tên sản phẩm, mã SKU
và đơn giá; `orders` lưu bản sao tên người nhận và địa chỉ dưới dạng văn bản.
Người bán đổi giá hay khách sửa sổ địa chỉ về sau đều không làm sai lệch đơn cũ.

**Nhật ký chỉ ghi thêm.** `order_status_histories`, `inventory_transactions`,
`login_histories` không cho sửa hay xóa bản ghi, bảo đảm truy vết đầy đủ.

**Hành vi xóa được quy định rõ.** `CASCADE` cho dữ liệu chi tiết phụ thuộc hoàn
toàn; `RESTRICT` cho chứng từ giao dịch (không cho xóa người dùng còn đơn hàng);
`SET NULL` cho nhật ký và tham chiếu tùy chọn.

## 3.5. Quy ước đặt tên

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Tên bảng | chữ thường, số nhiều, gạch dưới | `product_variants` |
| Khóa chính | tên bảng số ít + `_id` | `order_item_id` |
| Khóa ngoại | trùng tên khóa chính bảng đích | `shop_id` |
| Mốc thời gian | hậu tố `_at` | `delivered_at` |
| Ngày | hậu tố `_date` | `estimated_delivery_date` |
| Cờ | tiền tố `is_` | `is_default` |
| Đếm | hậu tố `_count` | `rating_count` |
| Chỉ mục | `idx_` + bảng + cột | `idx_orders_user_placed` |

## 3.6. Dữ liệu mẫu — 961 bản ghi

Hàng hóa Việt Nam thật với giá VND thực tế: 36 sản phẩm, 66 biến thể, cây danh
mục 3 cấp (34 danh mục), 15 thương hiệu, 3 gian hàng, 100 dòng tồn kho, và 8 đơn
hàng phủ đủ các trạng thái từ `PENDING` tới `COMPLETED` cùng cả `CANCELLED`.

Mật khẩu chung của 10 tài khoản mẫu: `Password@123` (băm BCrypt cost 12).

Tính nhất quán đã được đối chiếu bằng truy vấn kiểm tra: tổng tiền mọi đơn khớp
với chi tiết đơn, không tồn kho âm hay giữ chỗ vượt tồn, mọi biến thể đều có bản
ghi tồn kho, mọi đơn đều có lịch sử trạng thái và bản ghi thanh toán.

## 3.7. Chỉ mục phục vụ ba ticket mới

| Bảng | Chỉ mục | Truy vấn được tăng tốc |
|---|---|---|
| `orders` | `idx_orders_user_placed` | Lịch sử đơn của khách, sắp theo thời gian |
| `orders` | `idx_orders_shop_status` | Bảng quản lý đơn của người bán |
| `orders` | `idx_orders_status_placed` | Báo cáo doanh thu theo khoảng thời gian |
| `order_items` | `idx_orderitems_variant` | Thống kê sản phẩm bán chạy |
| `order_status_histories` | `idx_osh_order_time` | Dòng thời gian xử lý đơn |
| `payments` | `idx_payments_order_status` | Phân bố phương thức thanh toán |
| `inventories` | `uq_inventory_variant_warehouse` | Kiểm tra và cập nhật tồn kho |
