# 1. Kiến trúc và tái cấu trúc

## 1.1. Vấn đề của cấu trúc cũ

Cấu trúc trước đây gom tệp **theo loại kỹ thuật**:

```
src/
├── controllers/     auth.controller.js
├── services/        auth.service.js, token.service.js, rbac.service.js, cache.service.js
├── models/          index.js          ← 7 bảng nhồi trong một tệp
├── routes/          auth.routes.js, demo.routes.js
├── validators/      auth.validator.js
├── middlewares/
└── utils/
```

Cách này chạy tốt khi hệ thống chỉ có một phân hệ. Khi thêm phân hệ đơn hàng và
báo cáo thì nó bộc lộ ba vấn đề:

1. **Sửa một nghiệp vụ phải mở sáu thư mục.** Thêm chức năng đơn hàng buộc phải
   đụng vào `controllers/`, `services/`, `routes/`, `validators/`, `models/` cùng lúc.
2. **Không có ranh giới.** Không nhìn được từ cây thư mục rằng hệ thống có những
   phân hệ nào; `services/` sớm muộn cũng thành một thư mục chứa hai chục tệp rời rạc.
3. **Tệp model khổng lồ.** Gom 7 bảng vào một tệp đã dài 120 dòng; với 23 bảng
   thì tệp đó trở nên không đọc nổi.

## 1.2. Cấu trúc mới — modular theo nghiệp vụ

Nguyên tắc: **gom theo thứ cùng thay đổi với nhau**. Khi sửa nghiệp vụ đơn hàng,
mọi tệp cần đụng tới đều nằm trong `modules/orders/`.

```
backend/src/
├── config/                     Cấu hình: biến môi trường, kết nối CSDL
│
├── database/models/            23 model, mỗi bảng một tệp
│   ├── index.js                ← nơi DUY NHẤT khai báo quan hệ
│   ├── order.model.js
│   └── ...
│
├── modules/                    ⬅ RANH GIỚI NGHIỆP VỤ
│   ├── auth/                   Đăng ký, đăng nhập, JWT
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   ├── auth.validator.js
│   │   └── token.service.js
│   ├── rbac/
│   │   └── rbac.service.js
│   ├── orders/                 HTTMDTTHA-68 + 69
│   │   ├── order.constants.js         máy trạng thái
│   │   ├── order.workflow.service.js  động cơ chuyển trạng thái
│   │   ├── inventory.service.js       tác động tồn kho
│   │   ├── order.query.js             include và bộ lọc dùng chung
│   │   ├── order.serializer.js        định dạng JSON trả ra
│   │   ├── order.validator.js
│   │   ├── customerOrder.{service,controller,routes}.js
│   │   └── sellerOrder.{service,controller,routes}.js
│   └── reports/                HTTMDTTHA-70
│
├── shared/                     Dùng chung, KHÔNG chứa nghiệp vụ
│   ├── constants/              permissions.js, enums.js
│   ├── errors/                 ApiError.js
│   ├── http/                   response.js
│   ├── middlewares/            authenticate, authorize, validate, rateLimiter, errorHandler
│   ├── services/               cache.service.js
│   └── utils/                  pagination, dateRange, sqlDialect, csv
│
├── routes/index.js             Gắn module vào tiền tố URL
├── app.js
└── server.js
```

### Quy tắc phụ thuộc

Chỉ có **một chiều** phụ thuộc, không bao giờ ngược lại:

```
routes → modules → shared → config
                 ↘ database/models
```

- Một module **được** dùng `shared/` và `database/models/`.
- Một module **không** được `require` trực tiếp tệp bên trong module khác, trừ
  khi đó là hằng số thuần (ví dụ `reports` đọc `order.constants` để lấy nhãn
  trạng thái — một tệp chỉ chứa dữ liệu, không có tác dụng phụ).
- `shared/` **không bao giờ** được biết tới `modules/`.

Nhờ quy tắc này, tách một phân hệ thành microservice về sau chỉ là việc bê nguyên
một thư mục trong `modules/` ra ngoài.

### Những thay đổi cụ thể

| Trước | Sau | Lý do |
|---|---|---|
| `src/models/index.js` gộp 7 bảng | `src/database/models/*.model.js` — 23 tệp | Mỗi bảng một tệp; `index.js` chỉ còn nạp model và khai quan hệ |
| `src/utils/ApiError.js` | `src/shared/errors/ApiError.js` | Phân loại đúng vai trò thay vì gom vào "utils" |
| `src/utils/response.js` | `src/shared/http/response.js` | |
| `USER_STATUS` định nghĩa trong `auth.service.js` | `shared/constants/enums.js` | `authenticate.js` từng phải `require` ngược vào service chỉ để lấy hằng số |
| `src/routes/demo.routes.js` | đã xóa | Router trình diễn không thuộc về mã nguồn thật; các ca kiểm thử RBAC nay chạy trên endpoint nghiệp vụ thật |
| Không có | `shared/utils/sqlDialect.js` | Che khác biệt cú pháp MySQL ↔ PostgreSQL cho truy vấn báo cáo |
| Không có | `shared/constants/enums.js` | Tập giá trị trạng thái khớp ràng buộc CHECK trong CSDL |

---

## 2. Các quyết định thiết kế đáng chú ý

### 2.1. Máy trạng thái đơn hàng là một tệp riêng

`modules/orders/order.constants.js` khai báo toàn bộ bước chuyển hợp lệ dưới
dạng dữ liệu, không phải chuỗi `if`:

```
PENDING ─┬─> CONFIRMED ─┬─> PACKING ─┬─> SHIPPING ─┬─> DELIVERED ─┬─> COMPLETED
         │              │            │             │              │
         └──> CANCELLED ┴────────────┘             └──> RETURNED <─┘
```

Hệ quả:

- Không thể nhảy cóc từ `PENDING` thẳng sang `DELIVERED`.
- Không thể hồi sinh đơn đã ở trạng thái kết thúc.
- Khi bị từ chối, phản hồi nêu rõ danh sách bước chuyển hợp lệ, nên giao diện
  dựng được nút bấm mà không cần mã hóa cứng luật nghiệp vụ.
- Giao diện lấy thẳng `nextStatuses` từ API — thêm một trạng thái mới về sau chỉ
  cần sửa bảng này, không phải sửa frontend.

### 2.2. Tác động phụ chạy trong cùng một giao dịch

`order.workflow.service.js` đặt việc đổi trạng thái **và** mọi hệ quả của nó
(trừ kho, ghi vận đơn, chốt thanh toán, cộng số đã bán) trong cùng một
`sequelize.transaction`. Nếu bất kỳ bước nào lỗi thì tất cả quay lui — không bao
giờ để lại đơn đã chuyển sang "Đang giao" mà kho chưa trừ.

### 2.3. Giữ chỗ tồn kho thay vì trừ thẳng

| Sự kiện | `qty_on_hand` | `qty_reserved` | Nhật ký |
|---|---|---|---|
| Khách đặt đơn | không đổi | **+n** | `RESERVE` |
| Đơn bị hủy trước khi xuất kho | không đổi | **−n** | `RELEASE` |
| Đơn chuyển sang Đang giao | **−n** | **−n** | `EXPORT` |
| Khách trả hàng sau khi đã giao | **+n** | không đổi | `RETURN` |

Nhờ tách hai cột, đơn hủy giữa chừng chỉ cần nhả giữ chỗ và tồn kho không bao giờ
sai lệch. Ràng buộc `qty_reserved <= qty_on_hand` ở mức cơ sở dữ liệu bắt lỗi
ngay cả khi mã nguồn có sai sót.

### 2.4. Một lớp che phương ngữ SQL

Báo cáo doanh thu phải gom nhóm theo ngày, tuần, tháng — nhưng MySQL dùng
`DATE_FORMAT` còn PostgreSQL dùng `TO_CHAR(DATE_TRUNC(...))`.
`shared/utils/sqlDialect.js` gom khác biệt đó về một chỗ, nên tầng service viết
truy vấn một lần và chạy được trên cả hai. Toàn bộ 71 ca kiểm thử đã chạy đạt
trên cả hai hệ quản trị.

### 2.5. Phân quyền dựa trên quyền, không dựa trên vai trò

Route khai báo quyền cần có, không khai báo vai trò:

```js
// Báo cáo đòi ĐỒNG THỜI hai quyền
router.use(requirePermissions([P.REPORT_VIEW, P.ORDER_VIEW_ALL], { mode: 'all' }));

// Xem đơn gian hàng: người bán HOẶC quản trị viên đều được
requirePermissions([P.ORDER_VIEW_SHOP, P.ORDER_VIEW_ALL], { mode: 'any' })
```

Người bán có `REPORT_VIEW` nhưng không có `ORDER_VIEW_ALL`, nên tự động bị chặn
khỏi báo cáo toàn sàn mà không cần một dòng mã đặc biệt nào. Thanh điều hướng
của frontend cũng dựng từ quyền, nên quản trị viên đổi bảng phân quyền thì menu
tự thay đổi theo.

---

## 3. Kiến trúc frontend

```
frontend/src/
├── app/                        Next.js App Router
│   ├── login/                  Đăng nhập
│   ├── orders/                 HTTMDTTHA-71 (danh sách + [id] chi tiết)
│   ├── seller/orders/          HTTMDTTHA-72
│   └── admin/reports/          HTTMDTTHA-73
├── components/
│   ├── ui/primitives.jsx       Card, Button, Input, Pagination, EmptyState...
│   ├── charts/                 RevenueLineChart, BarList, DonutChart, StatCard
│   ├── orders/                 OrderStatusBadge, OrderStatusStepper
│   ├── AppShell.jsx            Khung chung, điều hướng theo quyền, đổi giao diện sáng/tối
│   └── DateRangeFilter.jsx
└── lib/
    ├── api.js                  Gọi API, tự làm mới token khi hết hạn
    ├── useSession.js           Trạng thái phiên đăng nhập
    ├── format.js               Định dạng tiền, số, ngày theo quy ước Việt Nam
    └── orderStatus.js          Nhãn và màu trạng thái
```

### Tự làm mới phiên đăng nhập

`lib/api.js` bắt phản hồi 401, gọi `/auth/refresh` rồi **phát lại request đúng
một lần**. Nhiều request xảy ra đồng thời cùng chia sẻ một lượt làm mới thay vì
mỗi cái gọi refresh riêng — tránh việc cơ chế xoay vòng refresh token ở backend
thu hồi nhầm token của nhau.

### Biểu đồ không dùng thư viện ngoài

Bốn biểu đồ đều viết bằng SVG thuần. Lý do: toàn bộ nhu cầu chỉ là một đường,
một vành khuyên và hai danh sách thanh — kéo thêm 300 KB thư viện cho từng ấy
việc là không đáng.

Bảng màu đã được kiểm định bằng công cụ đo tự động, đạt cả ngưỡng phân biệt cho
người mù màu lẫn ngưỡng tương phản ở cả chế độ sáng và tối. Ba màu ở chế độ sáng
nằm dưới ngưỡng tương phản 3:1, nên mọi biểu đồ dùng chúng đều **in kèm nhãn giá
trị bằng chữ** — màu không bao giờ tự gánh ý nghĩa. Biểu đồ doanh thu còn có nút
"Xem dạng bảng" để đọc số liệu chính xác.

---

## 4. Việc còn lại

- Đặc tả OpenAPI sinh tự động cho toàn bộ endpoint
- Tầng repository giữa service và model, nếu truy vấn tiếp tục phức tạp thêm
- Thay `shared/services/cache.service.js` bằng Redis khi chạy nhiều bản sao container
- Phân hệ 5 (khuyến mãi), 6 (đánh giá), 7 (AI) — lược đồ đã thiết kế sẵn ở Báo cáo Buổi 2
