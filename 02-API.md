# 2. Danh mục API

Tiền tố chung: `/api/v1` (đổi qua biến `API_PREFIX`).

Mọi phản hồi thành công có chung cấu trúc:

```jsonc
{ "success": true, "message": "Thành công", "data": { } }
```

Mọi phản hồi lỗi có chung cấu trúc:

```jsonc
{ "success": false,
  "error": { "code": "FORBIDDEN", "message": "...", "details": { } } }
```

---

## Xác thực — `/auth` (HTTMDTTHA-7)

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | — | Đăng ký, tự gán vai trò MEMBER |
| POST | `/auth/login` | — | Đăng nhập bằng email, tên đăng nhập hoặc số điện thoại |
| POST | `/auth/refresh` | — | Cấp cặp token mới, thu hồi token cũ |
| POST | `/auth/logout` | — | Thu hồi refresh token hiện tại |
| POST | `/auth/logout-all` | đăng nhập | Thu hồi mọi phiên |
| GET | `/auth/me` | đăng nhập | Thông tin phiên kèm vai trò và quyền |

---

## Lịch sử đơn hàng của khách — `/orders` (HTTMDTTHA-68)

Mọi endpoint đều yêu cầu đăng nhập. Phạm vi dữ liệu gắn cứng theo `user_id` của
người đang đăng nhập, nên không có đường nào xem được đơn của người khác — kể cả
khi đoán đúng mã đơn (trả về 404, không phải 403, để không lộ sự tồn tại).

### `GET /orders`

| Tham số | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `page` | số nguyên ≥ 1 | 1 | |
| `limit` | 1–100 | 20 | |
| `status` | mã trạng thái | — | Lặp lại được: `?status=PENDING&status=CONFIRMED` |
| `paymentStatus` | UNPAID / PAID / … | — | |
| `from`, `to` | `YYYY-MM-DD` | — | Lọc theo ngày đặt |
| `search` | chuỗi ≤ 100 | — | Khớp mã đơn, tên và số điện thoại người nhận |
| `sortBy` | `placed_at` · `total_amount` · `order_code` · `order_status` | `placed_at` | Danh sách trắng, chặn SQL injection |
| `sortDir` | `asc` · `desc` | `desc` | |

Quyền: `ORDER_VIEW_OWN`.

```jsonc
{ "items": [{
    "orderId": 1, "orderCode": "DH20260801001",
    "status": "COMPLETED", "statusLabel": "Hoàn thành",
    "paymentStatus": "PAID", "totalAmount": 61920000,
    "itemCount": 2, "totalQuantity": 3,
    "shop": { "shopId": 1, "shopName": "TechZone Official" },
    "preview": { "productName": "iPhone 15 Pro Max", "imageUrl": "...", "moreCount": 1 },
    "canCancel": false, "canConfirmReceived": false
  }],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1,
                  "hasPrev": false, "hasNext": false } }
```

### Các endpoint còn lại

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | `/orders/summary` | `ORDER_VIEW_OWN` | Số đơn theo từng trạng thái + tổng chi tiêu |
| GET | `/orders/:id` | `ORDER_VIEW_OWN` | Chi tiết: dòng hàng, lịch sử trạng thái, thanh toán, vận đơn |
| POST | `/orders/:id/cancel` | `ORDER_CANCEL` | Chỉ khi đơn ở `PENDING` hoặc `CONFIRMED`; nhả giữ chỗ tồn kho |
| POST | `/orders/:id/confirm-received` | `ORDER_VIEW_OWN` | Chỉ khi đơn ở `DELIVERED`; chuyển sang `COMPLETED` |

---

## Quản lý đơn của người bán — `/seller/orders` (HTTMDTTHA-69)

Ranh giới dữ liệu là **gian hàng**. Người bán chỉ thao tác được trên đơn của gian
hàng mình sở hữu; quản trị viên có `ORDER_VIEW_ALL` được truyền `?shopId=` bất kỳ.

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | `/seller/orders` | `ORDER_VIEW_SHOP` **hoặc** `ORDER_VIEW_ALL` | Danh sách, cùng bộ tham số lọc như trên, kèm `nextStatuses` |
| GET | `/seller/orders/stats` | như trên | Số đếm theo trạng thái, doanh thu, số liệu hôm nay |
| GET | `/seller/orders/:id` | như trên | Chi tiết đơn |
| PATCH | `/seller/orders/:id/status` | `ORDER_UPDATE_STATUS` | Chuyển trạng thái một đơn |
| PATCH | `/seller/orders/bulk-status` | `ORDER_UPDATE_STATUS` | Chuyển trạng thái tối đa 50 đơn |

### `PATCH /seller/orders/:id/status`

```jsonc
// Thân request
{ "toStatus": "SHIPPING", "note": "Đã giao cho GHN lúc 14h", "reason": null }
```

`toStatus` chỉ nhận: `CONFIRMED`, `PACKING`, `SHIPPING`, `DELIVERED`,
`CANCELLED`, `RETURNED`. Người bán **không** được tự đánh dấu `COMPLETED` — chỉ
khách hàng xác nhận đã nhận hàng mới chuyển được sang trạng thái đó.
`reason` bắt buộc khi hủy hoặc trả hàng.

Khi bước chuyển không hợp lệ, phản hồi 400 nêu rõ các bước hợp lệ:

```jsonc
{ "success": false,
  "error": { "code": "BAD_REQUEST",
             "message": "Không thể chuyển từ Chờ xác nhận sang Đã giao",
             "details": { "from": "PENDING", "to": "DELIVERED",
                          "allowed": ["CONFIRMED", "CANCELLED"] } } }
```

### Tác động phụ theo từng bước chuyển

| Trạng thái đích | Tồn kho | Vận đơn | Thanh toán |
|---|---|---|---|
| `CONFIRMED` | giữ nguyên | tạo vận đơn `CREATED` | — |
| `PACKING` | giữ nguyên | ghi mốc hành trình | — |
| `SHIPPING` | `EXPORT` — trừ cả tồn thực lẫn giữ chỗ | `IN_TRANSIT`, sinh mã tra cứu, đặt ngày giao dự kiến | — |
| `DELIVERED` | — | `DELIVERED` | Đơn COD chuyển sang đã thu tiền |
| `COMPLETED` | — | — | ghi `completed_at` |
| `CANCELLED` | `RELEASE` — nhả giữ chỗ | `FAILED` | hủy giao dịch chưa hoàn tất |
| `RETURNED` | `RETURN` — nhập lại kho | `RETURNED` | — |

### `PATCH /seller/orders/bulk-status`

```jsonc
{ "orderIds": [12, 13, 14], "toStatus": "CONFIRMED" }
```

Xử lý từng đơn độc lập và báo rõ đơn nào hỏng, thay vì đổ vỡ cả lô:

```jsonc
{ "total": 3, "successCount": 2, "failureCount": 1,
  "succeeded": [{ "orderId": 12, "fromStatus": "PENDING", "toStatus": "CONFIRMED" }],
  "failed": [{ "orderId": 14, "code": "BAD_REQUEST",
               "message": "Không thể chuyển từ Đang giao sang Đã xác nhận" }] }
```

---

## Báo cáo doanh thu — `/admin/reports` (HTTMDTTHA-70)

Toàn bộ nhóm này đòi **đồng thời** `REPORT_VIEW` và `ORDER_VIEW_ALL`. Người bán có
`REPORT_VIEW` nhưng thiếu `ORDER_VIEW_ALL` nên bị chặn.

Tham số chung: `from`, `to` (`YYYY-MM-DD`; mặc định 30 ngày gần nhất, tối đa 3 năm).

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/admin/reports/dashboard` | Gói cả 7 khối dưới đây trong một lần gọi |
| GET | `/admin/reports/overview` | 8 chỉ số then chốt kèm so sánh kỳ liền trước |
| GET | `/admin/reports/revenue` | Chuỗi doanh thu; thêm `granularity=day\|week\|month` |
| GET | `/admin/reports/orders-by-status` | Phân bố 8 trạng thái |
| GET | `/admin/reports/top-products` | Sản phẩm bán chạy; `limit` 1–50 |
| GET | `/admin/reports/top-shops` | Gian hàng doanh thu cao |
| GET | `/admin/reports/revenue-by-category` | Doanh thu quy về danh mục gốc |
| GET | `/admin/reports/payment-methods` | Phân bố phương thức thanh toán |
| GET | `/admin/reports/export` | Xuất CSV; `type=orders\|revenue\|products` |

### Định nghĩa doanh thu

Chỉ cộng các đơn ở trạng thái **`DELIVERED`** hoặc **`COMPLETED`**. Đơn đang chờ
xử lý hoặc đã hủy không được tính, nên số liệu không bị phồng. Ca kiểm thử
*"Doanh thu trong báo cáo khớp với truy vấn tính tay trên CSDL"* đối chiếu trực
tiếp kết quả API với một truy vấn SQL độc lập.

### `GET /admin/reports/overview`

```jsonc
{ "range": { "from": "...", "to": "...", "days": 31 },
  "previousRange": { "from": "...", "to": "..." },
  "kpis": [
    { "key": "revenue", "label": "Tổng doanh thu", "format": "currency",
      "value": 114797000, "previousValue": 79000000, "growth": 45.31 }
  ],
  "current": { }, "previous": { } }
```

Tám chỉ số: tổng doanh thu, tổng đơn hàng, giá trị đơn trung bình, sản phẩm đã
bán, khách hàng mới, tỷ lệ hủy đơn, gian hàng có đơn, đơn đã giao thành công.

Kỳ so sánh là kỳ liền trước **có cùng độ dài**: kỳ hiện tại 01/09–30/09 thì kỳ
trước là 02/08–31/08.

### `GET /admin/reports/revenue`

Trả về **đủ mọi mốc trong khoảng, kể cả mốc không phát sinh đơn** (giá trị 0), để
biểu đồ đường không bị đứt quãng.

```jsonc
{ "granularity": "day",
  "series": [{ "bucket": "2026-08-01", "revenue": 61920000,
               "orderCount": 1, "paidCount": 1 }],
  "totals": { "revenue": 114797000, "orderCount": 8,
              "peak": { "bucket": "2026-08-01", "revenue": 61920000 } } }
```

### `GET /admin/reports/export`

Trả về `text/csv; charset=utf-8` kèm `Content-Disposition: attachment`. Tệp mở
đầu bằng **BOM UTF-8** để Microsoft Excel trên Windows không lỗi font tiếng Việt,
và ô bắt đầu bằng `= + - @` được thoát để Excel không tự thực thi như công thức.

---

## Mã lỗi

| Mã | HTTP | Nghĩa |
|---|---|---|
| `BAD_REQUEST` | 400 | Dữ liệu gửi lên không hợp lệ; `details` liệt kê từng trường |
| `UNAUTHORIZED` | 401 | Thiếu token hoặc token không hợp lệ |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn — giao diện nên gọi `/auth/refresh` |
| `REFRESH_TOKEN_REVOKED` | 401 | Refresh token đã dùng hoặc đã đăng xuất |
| `FORBIDDEN` | 403 | Thiếu quyền; `details.missing` nêu rõ quyền còn thiếu |
| `NOT_FOUND` | 404 | Không tìm thấy, hoặc nằm ngoài phạm vi dữ liệu của người dùng |
| `CONFLICT` | 409 | Xung đột trạng thái (hủy đơn hai lần, hết hàng…) |
| `TOO_MANY_REQUESTS` | 429 | Vượt giới hạn tần suất |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống |
