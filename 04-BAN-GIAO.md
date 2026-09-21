# 4. Báo cáo bàn giao

Tài liệu này đối chiếu từng ticket trên Jira với sản phẩm thực tế đã bàn giao.

---

## HTTMDTTHA-68 — [Backend] API Lịch sử đơn hàng cho Khách hàng

**Vị trí:** `backend/src/modules/orders/customerOrder.{service,controller,routes}.js`

| Endpoint | Chức năng |
|---|---|
| `GET /orders` | Danh sách có phân trang, lọc trạng thái, lọc khoảng ngày, tìm kiếm, sắp xếp |
| `GET /orders/summary` | Số đơn theo từng trạng thái (dựng tab) + tổng chi tiêu |
| `GET /orders/:id` | Chi tiết: dòng hàng, lịch sử trạng thái, thanh toán, vận đơn kèm hành trình |
| `POST /orders/:id/cancel` | Khách tự hủy khi hàng chưa rời kho |
| `POST /orders/:id/confirm-received` | Xác nhận đã nhận hàng |

**Điểm đáng chú ý**

- Phạm vi dữ liệu gắn cứng theo `user_id` trong mọi truy vấn. Truy cập đơn của
  người khác trả **404 chứ không phải 403**, để không lộ việc đơn đó có tồn tại.
- Hủy đơn nhả đúng phần tồn kho đang giữ chỗ, trong cùng giao dịch với việc đổi
  trạng thái.
- API trả sẵn `canCancel` và `canConfirmReceived`, nên giao diện không phải mã
  hóa cứng luật nghiệp vụ.

**Kiểm thử:** `backend/tests/orders.customer.test.js` — **14/14 ca đạt**, gồm
phân tách dữ liệu giữa hai khách, chặn tham số lọc sai, hủy đơn hai lần, hủy đơn
đã rời kho, và đối chiếu số tồn kho trước/sau khi hủy.

---

## HTTMDTTHA-69 — [Backend] API Cập nhật trạng thái đơn (Seller)

**Vị trí:** `backend/src/modules/orders/sellerOrder.*`, `order.workflow.service.js`,
`order.constants.js`, `inventory.service.js`

| Endpoint | Chức năng |
|---|---|
| `GET /seller/orders` | Danh sách đơn của gian hàng, kèm `nextStatuses` hợp lệ |
| `GET /seller/orders/stats` | Số đếm theo trạng thái, doanh thu, số liệu hôm nay |
| `GET /seller/orders/:id` | Chi tiết đơn |
| `PATCH /seller/orders/:id/status` | Chuyển trạng thái một đơn |
| `PATCH /seller/orders/bulk-status` | Chuyển trạng thái tối đa 50 đơn |

**Máy trạng thái**

```
PENDING ─┬─> CONFIRMED ─┬─> PACKING ─┬─> SHIPPING ─┬─> DELIVERED ─┬─> COMPLETED
         │              │            │             │              │
         └──> CANCELLED ┴────────────┘             └──> RETURNED <─┘
```

Khai báo dưới dạng dữ liệu trong `order.constants.js`, không phải chuỗi `if`.
Người bán được phép chuyển sang 6 trạng thái; **`COMPLETED` không nằm trong đó**
— chỉ khách xác nhận đã nhận hàng mới chuyển được, tránh việc người bán tự đánh
dấu đơn hoàn thành thay khách.

**Tác động phụ, tất cả trong cùng một giao dịch**

| Bước chuyển | Tồn kho | Vận đơn | Thanh toán |
|---|---|---|---|
| → `SHIPPING` | trừ cả tồn thực lẫn giữ chỗ | tạo vận đơn, sinh mã tra cứu | — |
| → `DELIVERED` | — | đánh dấu đã giao | đơn COD chuyển sang đã thu tiền |
| → `CANCELLED` | nhả giữ chỗ | đánh dấu thất bại | hủy giao dịch chưa hoàn tất |
| → `RETURNED` | nhập lại kho | đánh dấu hoàn hàng | — |

**Kiểm thử:** `backend/tests/orders.seller.test.js` — **21/21 ca đạt**, gồm chuỗi
chuyển trạng thái trọn vẹn, chặn nhảy cóc, chặn hồi sinh đơn đã kết thúc, phân
tách dữ liệu giữa hai gian hàng, và **đối chiếu số tồn kho trước/sau cho cả ba
kịch bản xuất kho, hủy đơn và trả hàng**.

---

## HTTMDTTHA-70 — [Backend] API Báo cáo & Thống kê Doanh thu (Admin)

**Vị trí:** `backend/src/modules/reports/`

Chín endpoint: `dashboard` (gói tất cả), `overview`, `revenue`,
`orders-by-status`, `top-products`, `top-shops`, `revenue-by-category`,
`payment-methods`, `export`.

**Điểm đáng chú ý**

- **Định nghĩa doanh thu chặt chẽ:** chỉ cộng đơn ở `DELIVERED` hoặc `COMPLETED`.
  Có một ca kiểm thử riêng tạo đơn mới ở trạng thái chờ rồi xác nhận doanh thu
  **không** đổi.
- **Chạy được trên cả hai hệ quản trị.** MySQL dùng `DATE_FORMAT`, PostgreSQL
  dùng `TO_CHAR(DATE_TRUNC(...))`; khác biệt được che trong
  `shared/utils/sqlDialect.js`.
- **Chuỗi thời gian không đứt quãng:** những ngày không phát sinh đơn vẫn trả về
  với giá trị 0.
- **So sánh kỳ trước** có cùng độ dài, tính tự động.
- **Xuất CSV** có BOM UTF-8 để Excel trên Windows không lỗi font tiếng Việt, và
  thoát ô bắt đầu bằng `= + - @` để Excel không tự thực thi như công thức.
- **Endpoint gộp `dashboard`** để giao diện không phải bắn bảy request song song
  mỗi lần đổi khoảng thời gian.

**Kiểm thử:** `backend/tests/reports.admin.test.js` — **18/18 ca đạt**, trong đó
có ca đối chiếu doanh thu do API trả về với một truy vấn SQL tính tay độc lập.

> Bộ kiểm thử này bắt được một lỗi thật trong quá trình xây dựng: hàm tính số
> ngày của khoảng thời gian trả về 31 thay vì 30 do cộng dư 1 sau khi đã lấy tới
> cuối ngày. Đã sửa tại `shared/utils/dateRange.js`.

---

## HTTMDTTHA-71 — [Frontend] Màn hình Lịch sử & Chi tiết đơn (Customer)

**Vị trí:** `frontend/src/app/orders/page.jsx` và `orders/[id]/page.jsx`

**Màn hình danh sách**

- Dải 4 chỉ số: tổng đơn, đã mua thành công, tổng chi tiêu, trung bình mỗi đơn
- Hàng tab theo trạng thái kèm số đếm, chỉ hiện trạng thái thực sự có đơn
- Bộ lọc: tìm kiếm, khoảng ngày; nút xóa bộ lọc chỉ hiện khi đang có bộ lọc
- Thẻ đơn hàng kèm ảnh, tên sản phẩm, số lượng, tổng tiền
- Nút hành động hiện theo trạng thái: **Hủy đơn** hoặc **Đã nhận được hàng**
- Có trạng thái đang tải (khung xương cá), trạng thái rỗng và trạng thái lỗi kèm nút thử lại

**Màn hình chi tiết**

- Thanh tiến trình 6 bước kèm ngày đạt từng mốc; đơn hủy hoặc trả hàng hiển thị
  bằng dải cảnh báo riêng thay vì cố nhét vào các bước
- Danh sách sản phẩm, bảng tính tiền, địa chỉ nhận hàng, thông tin thanh toán
- Dòng thời gian xử lý đơn
- Hành trình vận đơn kèm mã tra cứu và ngày giao dự kiến

---

## HTTMDTTHA-72 — [Frontend] Màn hình Quản lý đơn hàng (Seller Dashboard)

**Vị trí:** `frontend/src/app/seller/orders/page.jsx`

- Dải 5 chỉ số; ô "Chờ xác nhận" đổi viền cảnh báo khi còn đơn tồn đọng
- Nút tắt "N đơn đang chờ bạn xử lý" nhảy thẳng vào bộ lọc tương ứng
- Bảng dày thông tin: mã đơn, khách hàng, sản phẩm, tổng tiền, thanh toán, trạng thái
- **Nút chuyển trạng thái ngay trên từng dòng**, dựng từ `nextStatuses` do API trả về
- **Chọn nhiều dòng để xử lý hàng loạt** — chỉ hiện những bước chuyển mà *tất cả*
  đơn đang chọn đều thực hiện được; kết quả báo rõ đơn nào hỏng và vì sao
- **Ngăn chi tiết trượt từ cạnh phải**, đóng bằng phím Esc, giữ nguyên ngữ cảnh
  danh sách phía sau
- Bắt buộc nhập lý do khi hủy hoặc trả hàng

---

## HTTMDTTHA-73 — [Frontend] Trang Thống kê Doanh thu & Đơn hàng (Admin)

**Vị trí:** `frontend/src/app/admin/reports/page.jsx`

- Bộ lọc thời gian một hàng ngay trên khu vực biểu đồ: 3 mốc dựng sẵn, nhập tay,
  chọn mức gom nhóm, nút xuất CSV
- **8 thẻ chỉ số** kèm mức tăng trưởng so với kỳ trước. Chỉ số "tỷ lệ hủy đơn"
  đảo chiều đánh giá — tăng là xấu
- **Biểu đồ đường doanh thu** có thanh dóng và chú thích nổi theo con trỏ; nút
  chuyển sang **xem dạng bảng** để đọc số liệu chính xác
- **Danh sách thanh** cho phân bố trạng thái và sản phẩm bán chạy
- **Biểu đồ vành khuyên** cho doanh thu theo danh mục và phương thức thanh toán
- Bảng xếp hạng gian hàng kèm tỉ trọng

**Về chất lượng trực quan hóa**

Bảng màu đã chạy qua công cụ kiểm định tự động và đạt toàn bộ ngưỡng ở **cả chế
độ sáng lẫn tối**: dải độ sáng, ngưỡng bão hòa, khoảng cách phân biệt cho người
mù màu (ΔE 9,1 sáng / 8,4 tối so với ngưỡng 8), và ngưỡng phân biệt thị lực bình
thường (19,6 / 19,3 so với ngưỡng 15).

Ba màu ở chế độ sáng nằm dưới ngưỡng tương phản 3:1, nên mọi biểu đồ dùng chúng
đều **in kèm nhãn giá trị bằng chữ** — màu không bao giờ tự gánh ý nghĩa. Thêm
vào đó: chỉ dùng **một trục y** (số đơn chỉ xuất hiện trong chú thích nổi, không
vẽ thành trục thứ hai); biểu đồ một chuỗi thì không có hộp chú giải thừa; biểu đồ
vành khuyên giới hạn 5 lát rồi gộp phần dư vào "Khác"; màu trạng thái là màu dành
riêng, không bao giờ dùng lại cho chuỗi dữ liệu.

---

## Tổng hợp kiểm thử

| Bộ kiểm thử | Số ca | Kết quả |
|---|:-:|---|
| `auth.rbac.test.js` | 18 | đạt |
| `orders.customer.test.js` | 14 | đạt |
| `orders.seller.test.js` | 21 | đạt |
| `reports.admin.test.js` | 18 | đạt |
| **Tổng** | **71** | **71/71 đạt** |

Chạy đầy đủ trên **cả PostgreSQL 16 và MySQL/MariaDB**, mỗi hệ quản trị đều dựng
lại cơ sở dữ liệu từ lược đồ và dữ liệu mẫu trước khi chạy.

Frontend đã build sạch (8 trang) và ba màn hình mới đã được mở thật trong trình
duyệt, đăng nhập bằng ba vai trò khác nhau và kiểm tra bằng ảnh chụp màn hình.

---

## Việc tiếp theo đề xuất

1. Đặc tả OpenAPI sinh tự động từ mã nguồn (`springdoc` tương đương cho Express
   là `swagger-jsdoc`)
2. Kiểm thử hiệu năng báo cáo trên tập dữ liệu lớn — hiện mới chạy trên 961 bản ghi
3. Thay bộ nhớ đệm trong tiến trình bằng Redis khi chạy nhiều bản sao container
4. Phân hệ 5 (khuyến mãi), 6 (đánh giá), 7 (AI) — lược đồ đã thiết kế sẵn ở Báo
   cáo Buổi 2, chỉ còn hiện thực API và giao diện
