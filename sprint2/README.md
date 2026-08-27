# Sprint 2 — Nền tảng dữ liệu, Xác thực JWT và Phân quyền RBAC

Phần việc hoàn thành cho ba ticket đang ở trạng thái **To Do** trên Jira của dự án
*Hệ thống Thương mại Điện tử tích hợp AI* (Nhóm 2 — lớp 68CS3).

| Ticket | Nội dung | Sản phẩm bàn giao |
|---|---|---|
| **HTTMDTTHA-5** | Thiết kế CSDL cho Sprint 2, seed data cho các bảng | 32 bảng, 45 khóa ngoại, 961 bản ghi mẫu, 2 sơ đồ ERD |
| **HTTMDTTHA-7** | (BE) API đăng ký tài khoản, đăng nhập & cấp phát JWT | 6 endpoint, xoay vòng refresh token, ghi nhật ký đăng nhập |
| **HTTMDTTHA-8** | (BE) Middleware phân quyền RBAC | 5 middleware, 39 quyền, 4 vai trò |

---

## 1. Giả định về ngăn xếp công nghệ

Repo chưa được chia sẻ nên ngăn xếp được suy ra từ cách đặt tên task trên Jira —
*"middleware phân quyền"*, *"protected routes"*, *"cấu hình mail service"* đều là thuật ngữ
của hệ sinh thái Node. Mã nguồn vì vậy viết bằng **Node.js + Express + Sequelize**.

Để giảm rủi ro nếu nhóm đang dùng ngăn xếp khác, phần cơ sở dữ liệu được xuất ra **SQL thuần
cho cả MySQL 8 lẫn PostgreSQL 14+**, không phụ thuộc ORM. Toàn bộ script đã được chạy thử
thật trên cả hai hệ quản trị.

---

## 2. Cấu trúc thư mục

```
sprint2/
├── database/
│   ├── 01_schema_sprint2_mysql.sql       # DDL — MySQL 8
│   ├── 01_schema_sprint2_postgres.sql    # DDL — PostgreSQL 14+
│   ├── 02_seed_data_mysql.sql            # Dữ liệu mẫu — MySQL
│   ├── 02_seed_data_postgres.sql         # Dữ liệu mẫu — PostgreSQL
│   ├── erd_auth_rbac.png                 # ERD phân hệ xác thực và phân quyền
│   └── erd_sprint2.png                   # ERD 21 bảng mục tiêu Sprint 2
├── src/
│   ├── config/         env.js, database.js
│   ├── models/         index.js  (User, Role, Permission, UserRole, RolePermission,
│   │                              AuthToken, LoginHistory)
│   ├── services/       token.service.js, auth.service.js, rbac.service.js, cache.service.js
│   ├── controllers/    auth.controller.js
│   ├── middlewares/    authenticate.js, authorize.js, validate.js,
│   │                   rateLimiter.js, errorHandler.js
│   ├── validators/     auth.validator.js
│   ├── routes/         index.js, auth.routes.js, demo.routes.js
│   ├── utils/          ApiError.js, response.js
│   ├── constants/      permissions.js
│   ├── app.js
│   └── server.js
├── tests/auth.rbac.test.js               # 20 ca kiểm thử tự động
├── .env.example
└── package.json
```

---

## 3. Cài đặt và chạy

```bash
# 1. Cài phụ thuộc
npm install

# 2. Tạo cơ sở dữ liệu
#    MySQL
mysql -u root -p -e "CREATE DATABASE ecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p ecom < database/01_schema_sprint2_mysql.sql
mysql -u root -p ecom < database/02_seed_data_mysql.sql

#    hoặc PostgreSQL
createdb ecom
psql -d ecom -f database/01_schema_sprint2_postgres.sql
psql -d ecom -f database/02_seed_data_postgres.sql

# 3. Cấu hình
cp .env.example .env      # sửa DB_* và hai chuỗi JWT_*_SECRET

# 4. Chạy
npm start                 # http://localhost:3000/api/v1

# 5. Kiểm thử
npm test
```

> **Quan trọng:** hai biến `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` trong `.env.example`
> là giá trị mẫu. Sinh chuỗi thật bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
> Ứng dụng sẽ từ chối khởi động ở chế độ production nếu vẫn còn giá trị mẫu.

### Tài khoản mẫu

Mật khẩu chung cho mọi tài khoản seed: **`Password@123`** (băm BCrypt cost 12, đăng nhập được ngay).

| Tài khoản | Email | Vai trò |
|---|---|---|
| `admin` | admin@httmdt.vn | ADMIN |
| `techzone` | seller.techzone@httmdt.vn | SELLER + MEMBER |
| `stylehouse` | seller.stylehouse@httmdt.vn | SELLER + MEMBER |
| `homemart` | seller.homemart@httmdt.vn | SELLER + MEMBER |
| `nguyenvanan` … `vothimai` | (6 tài khoản) | MEMBER |

---

## 4. HTTMDTTHA-5 — Cơ sở dữ liệu

### Phạm vi

| Nhóm | Phân hệ | Số bảng | Ghi chú |
|---|---|:-:|---|
| Nền tảng | PH1 — Người dùng & phân quyền | 8 | Dùng `CREATE TABLE IF NOT EXISTS` nên **an toàn khi chạy trên CSDL đã có sẵn bảng tài khoản** của Sprint 1 |
| Nền tảng | PH2 — Người bán & kho | 3 | |
| **Sprint 2** | PH3 — Danh mục, sản phẩm, tồn kho | 11 | |
| **Sprint 2** | PH4 — Giỏ hàng, đơn hàng, thanh toán, vận chuyển | 10 | |

Tổng: **32 bảng · 45 khóa ngoại · 19 ràng buộc duy nhất · 32 ràng buộc miền giá trị · 97 chỉ mục**.

### Điểm thiết kế đáng chú ý

- **Tách sản phẩm khỏi biến thể.** Mọi giao dịch mua bán và mọi bản ghi tồn kho tham chiếu
  `variant_id`, không tham chiếu `product_id`. Nhờ vậy một sản phẩm có nhiều màu/dung lượng
  vẫn quản lý được giá và tồn riêng cho từng tổ hợp.
- **Giữ chỗ tồn kho.** `inventories` tách `qty_on_hand` và `qty_reserved`, kèm ràng buộc
  `qty_reserved <= qty_on_hand`. Khi khách đặt đơn mà chưa thanh toán, hệ thống tăng
  `qty_reserved` thay vì trừ thẳng tồn — tránh bán vượt kho.
- **Đóng băng dữ liệu giao dịch.** `order_items` lưu bản sao tên sản phẩm, mã SKU và đơn giá;
  `orders` lưu bản sao tên người nhận và địa chỉ. Người bán đổi giá hay khách sửa sổ địa chỉ
  về sau đều không làm sai lệch đơn cũ.
- **Cây danh mục đệ quy** với cột `path` (`/1/4/7`) để lấy toàn bộ nhánh con bằng một phép
  so khớp tiền tố thay vì truy vấn đệ quy nhiều cấp.
- **Hành vi xóa được quy định rõ:** `CASCADE` cho dữ liệu chi tiết phụ thuộc hoàn toàn,
  `RESTRICT` cho chứng từ giao dịch (không cho xóa người dùng còn đơn hàng),
  `SET NULL` cho nhật ký và tham chiếu tùy chọn.

### Dữ liệu mẫu — 961 bản ghi

| Bảng | Số bản ghi | | Bảng | Số bản ghi |
|---|--:|---|---|--:|
| roles | 4 | | products | 36 |
| permissions | 39 | | product_images | 108 |
| role_permissions | 72 | | product_variants | 66 |
| users | 10 | | variant_attribute_values | 101 |
| user_roles | 13 | | product_attributes | 108 |
| user_addresses | 8 | | inventories | 100 |
| shops | 3 | | inventory_transactions | 100 |
| warehouses | 4 | | carriers | 4 |
| shop_followers | 8 | | carts / cart_items | 5 / 10 |
| categories | 34 | | orders / order_items | 8 / 14 |
| brands | 15 | | order_status_histories | 29 |
| attributes / values | 7 / 28 | | payments / shipments | 8 / 4 |

Dữ liệu là hàng hóa Việt Nam thật (iPhone, Samsung, Uniqlo, Sunhouse…), giá VND thực tế,
cây danh mục 3 cấp, 8 đơn hàng phủ đủ các trạng thái `PENDING → CONFIRMED → PACKING →
SHIPPING → DELIVERED → COMPLETED` và cả `CANCELLED`.

**Đã kiểm chứng tính nhất quán:** tổng tiền mọi đơn khớp với chi tiết đơn, không có tồn kho
âm hay giữ chỗ vượt tồn, mọi biến thể đều có bản ghi tồn kho, mọi đơn đều có lịch sử trạng
thái và bản ghi thanh toán, mọi người dùng đều có vai trò.

---

## 5. HTTMDTTHA-7 — API xác thực và JWT

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
|---|---|:-:|---|
| POST | `/api/v1/auth/register` | | Đăng ký, tự gán vai trò `MEMBER`, trả về cặp token |
| POST | `/api/v1/auth/login` | | Đăng nhập bằng **email, tên đăng nhập hoặc số điện thoại** |
| POST | `/api/v1/auth/refresh` | | Cấp cặp token mới, thu hồi token cũ (xoay vòng) |
| POST | `/api/v1/auth/logout` | | Thu hồi refresh token của thiết bị hiện tại |
| POST | `/api/v1/auth/logout-all` | ✓ | Thu hồi mọi phiên trên mọi thiết bị |
| GET | `/api/v1/auth/me` | ✓ | Thông tin phiên kèm vai trò và danh sách quyền |

### Quyết định thiết kế

- **Băm mật khẩu BCrypt cost 12.** Cấu hình được qua `BCRYPT_ROUNDS`.
- **Refresh token lưu dạng băm SHA-256** trong `auth_tokens`. Cơ sở dữ liệu không bao giờ
  giữ bản rõ, nên lộ CSDL cũng không dùng được token.
- **Xoay vòng refresh token.** Mỗi lần gọi `/refresh`, token cũ bị đánh dấu `revoked_at`
  ngay lập tức. Token bị đánh cắp chỉ dùng được đúng một lần.
- **Access token cố ý gọn:** chỉ chứa `sub`, `username`, `roles`. Danh sách quyền chi tiết
  được nạp lại ở middleware nên quản trị viên thu hồi quyền có hiệu lực gần như tức thì,
  không phải chờ token hết hạn 15 phút.
- **Thông báo lỗi đăng nhập không phân biệt** "sai tài khoản" với "sai mật khẩu", tránh giúp
  kẻ tấn công dò xem email nào đã tồn tại.
- **Ghi nhật ký mọi lần đăng nhập** kể cả thất bại vào `login_histories`, kèm IP và user-agent.
- **Giới hạn tần suất:** 5 lần đăng nhập sai / 15 phút / IP; 10 lần đăng ký / giờ.
- **Đăng ký nằm trong một giao dịch:** nếu gán vai trò thất bại thì bản ghi người dùng cũng
  được quay lui, không để lại tài khoản mồ côi không có vai trò.

### Ví dụ

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@httmdt.vn","password":"Password@123"}'
```

```jsonc
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { "userId": 1, "username": "admin", "roles": ["ADMIN"],
              "permissions": ["USER_VIEW", "USER_CREATE", "..."] },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

Mọi phản hồi lỗi có chung cấu trúc, giúp phía giao diện xử lý thống nhất:

```jsonc
{ "success": false,
  "error": { "code": "INVALID_CREDENTIALS", "message": "Thông tin đăng nhập không chính xác" } }
```

---

## 6. HTTMDTTHA-8 — Middleware phân quyền RBAC

### Bộ middleware

| Middleware | Công dụng |
|---|---|
| `authenticate` | Bắt buộc đăng nhập. Xác thực JWT, nạp lại vai trò và quyền, chặn tài khoản bị khóa |
| `optionalAuth` | Không bắt buộc. Khách vãng lai vẫn xem được, nội dung cá nhân hóa nếu đã đăng nhập |
| `requirePermissions(perms, { mode })` | `mode: 'all'` (mặc định) buộc có đủ mọi quyền; `'any'` chỉ cần một |
| `requireRoles(...codes)` | Chặn theo vai trò khi ranh giới nghiệp vụ rõ theo vai trò hơn theo quyền |
| `requireOwnershipOr(resolver, overrides)` | Chủ sở hữu tài nguyên **hoặc** có quyền vượt cấp |
| `requireAny(...guards)` | Qua nếu bất kỳ nhánh kiểm tra nào cho phép |
| `requireAdmin` | Lối tắt của `requireRoles('ADMIN')` |

### Cách dùng

```js
const { authenticate, optionalAuth } = require('./middlewares/authenticate');
const { requirePermissions, requireRoles, requireOwnershipOr, requireAny }
  = require('./middlewares/authorize');
const { PERMISSIONS: P, ROLES } = require('./constants/permissions');

// Cần đúng một quyền
router.post('/products', authenticate, requirePermissions(P.PRODUCT_CREATE), createProduct);

// Cần đồng thời nhiều quyền
router.patch('/inventories/:id', authenticate,
  requirePermissions([P.INVENTORY_VIEW, P.INVENTORY_UPDATE]), updateStock);

// Chỉ cần một trong các quyền
router.get('/orders', authenticate,
  requirePermissions([P.ORDER_VIEW_ALL, P.ORDER_VIEW_SHOP], { mode: 'any' }), listOrders);

// Khách chỉ xem đơn của mình, quản trị viên xem mọi đơn
router.get('/orders/:id', authenticate,
  requireOwnershipOr(
    async (req) => (await Order.findByPk(req.params.id))?.user_id ?? null,
    [P.ORDER_VIEW_ALL]),
  getOrder);

// Theo vai trò
router.get('/seller/dashboard', authenticate, requireRoles(ROLES.SELLER, ROLES.ADMIN), dashboard);
```

`src/routes/demo.routes.js` chứa 8 ví dụ chạy được cho cả 8 tình huống trên — dùng làm khuôn
khi hiện thực các phân hệ còn lại của Sprint 2.

Khi bị từ chối, phản hồi nêu rõ quyền còn thiếu để việc gỡ lỗi nhanh hơn:

```jsonc
{ "success": false,
  "error": { "code": "FORBIDDEN",
             "message": "Bạn không có quyền thực hiện thao tác này",
             "details": { "required": ["INVENTORY_VIEW","INVENTORY_UPDATE"],
                          "mode": "all", "missing": ["INVENTORY_UPDATE"] } } }
```

### Bộ nhớ đệm và độ trễ khi thu hồi quyền

`rbac.service` đệm hồ sơ người dùng 60 giây và ánh xạ vai trò → quyền 300 giây, tránh truy vấn
bảng quyền ở mỗi request. Hệ quả: sau khi đổi vai trò hoặc khóa tài khoản, thay đổi có hiệu lực
chậm nhất sau 60 giây.

**Muốn có hiệu lực tức thì**, gọi hàm xóa đệm ngay trong nghiệp vụ tương ứng:

```js
const rbac = require('./services/rbac.service');
await User.update({ status: 'LOCKED' }, { where: { user_id: id } });
rbac.invalidateUser(id);        // sau khi khóa tài khoản hoặc đổi vai trò
rbac.invalidateRoles();         // sau khi sửa bảng role_permissions
```

Khi triển khai nhiều bản sao container, thay `cache.service.js` bằng Redis là đủ — phần còn lại
của mã nguồn không phải sửa.

| Nhóm | Mã quyền | Diễn giải | ADMIN | SELLER | MEMBER | GUEST |
|---|---|---|:-:|:-:|:-:|:-:|
| USER | `USER_VIEW` | Xem danh sách người dùng | x |  |  |  |
|  | `USER_CREATE` | Tạo tài khoản | x |  |  |  |
|  | `USER_UPDATE` | Cập nhật tài khoản | x |  |  |  |
|  | `USER_DELETE` | Khóa hoặc xóa tài khoản | x |  |  |  |
|  | `USER_ASSIGN_ROLE` | Gán vai trò cho người dùng | x |  |  |  |
|  | `PROFILE_VIEW` | Xem hồ sơ cá nhân | x | x | x |  |
|  | `PROFILE_UPDATE` | Cập nhật hồ sơ cá nhân | x | x | x |  |
|  | `ADDRESS_MANAGE` | Quản lý sổ địa chỉ nhận hàng | x | x | x |  |
| ROLE | `ROLE_VIEW` | Xem vai trò và quyền | x |  |  |  |
|  | `ROLE_MANAGE` | Tạo, sửa, xóa vai trò và phân quyền | x |  |  |  |
| SHOP | `SHOP_VIEW` | Xem thông tin gian hàng | x | x | x | x |
|  | `SHOP_CREATE` | Đăng ký mở gian hàng | x | x |  |  |
|  | `SHOP_UPDATE` | Cập nhật thông tin gian hàng | x | x |  |  |
|  | `SHOP_APPROVE` | Duyệt hồ sơ định danh gian hàng | x |  |  |  |
|  | `WAREHOUSE_MANAGE` | Quản lý kho hàng | x | x |  |  |
| CATALOG | `CATEGORY_VIEW` | Xem danh mục | x | x | x | x |
|  | `CATEGORY_MANAGE` | Tạo, sửa, xóa danh mục | x |  |  |  |
|  | `BRAND_MANAGE` | Quản lý thương hiệu | x |  |  |  |
|  | `PRODUCT_VIEW` | Xem sản phẩm | x | x | x | x |
|  | `PRODUCT_CREATE` | Đăng sản phẩm mới | x | x |  |  |
|  | `PRODUCT_UPDATE` | Cập nhật sản phẩm | x | x |  |  |
|  | `PRODUCT_DELETE` | Gỡ sản phẩm | x | x |  |  |
|  | `PRODUCT_APPROVE` | Duyệt sản phẩm lên sàn | x |  |  |  |
|  | `INVENTORY_VIEW` | Xem tồn kho | x | x |  |  |
|  | `INVENTORY_UPDATE` | Nhập, xuất, điều chỉnh tồn kho | x | x |  |  |
| ORDER | `CART_MANAGE` | Thao tác giỏ hàng | x |  | x |  |
|  | `ORDER_CREATE` | Đặt hàng | x |  | x |  |
|  | `ORDER_VIEW_OWN` | Xem đơn hàng của chính mình | x |  | x |  |
|  | `ORDER_VIEW_SHOP` | Xem đơn hàng của gian hàng | x | x |  |  |
|  | `ORDER_VIEW_ALL` | Xem toàn bộ đơn hàng trên sàn | x |  |  |  |
|  | `ORDER_UPDATE_STATUS` | Chuyển trạng thái đơn hàng | x | x |  |  |
|  | `ORDER_CANCEL` | Hủy đơn hàng | x |  | x |  |
|  | `PAYMENT_VIEW` | Xem giao dịch thanh toán | x | x |  |  |
|  | `REFUND_REQUEST` | Yêu cầu hoàn tiền | x |  | x |  |
|  | `REFUND_APPROVE` | Duyệt hoàn tiền | x |  |  |  |
|  | `SHIPMENT_MANAGE` | Tạo và theo dõi vận đơn | x | x |  |  |
| SYSTEM | `CONFIG_MANAGE` | Cấu hình tham số hệ thống | x |  |  |  |
|  | `AUDIT_VIEW` | Xem nhật ký kiểm toán | x |  |  |  |
|  | `REPORT_VIEW` | Xem báo cáo thống kê | x | x |  |  |

---

## 7. Kết quả kiểm thử

Toàn bộ đã chạy thật trong môi trường có CSDL, **không phải kiểm thử giả lập**.

| Hạng mục | Kết quả |
|---|---|
| Lược đồ trên PostgreSQL 16 | 32/32 bảng, 0 lỗi |
| Lược đồ trên MySQL/MariaDB | 32/32 bảng, 0 lỗi |
| Seed data trên cả hai hệ | 961/961 bản ghi, 0 lỗi |
| Kiểm tra nhất quán nghiệp vụ | 8/8 truy vấn đối chiếu đạt |
| Ma trận phân quyền | 22/22 ca đúng, trên **cả** MySQL và PostgreSQL |
| Bộ kiểm thử tự động `npm test` | **20/20 ca đạt** |

Các tình huống bảo mật đã kiểm chứng: token hỏng, token bị sửa chữ ký, dùng refresh token
thay access token, dùng lại refresh token đã xoay vòng, dùng refresh token sau khi đăng xuất,
truy cập tài nguyên của người khác, tài khoản bị khóa giữa phiên, và đăng ký trùng
email/username/số điện thoại.

---

## 8. Ghi chú khi ghép vào mã nguồn sẵn có

Nhóm đã hoàn thành các ticket `HTTMDTTHA-10, 46, 47, 48, 49, 50` (mail service, quên và đổi
mật khẩu, hồ sơ cá nhân, ảnh đại diện, sổ địa chỉ). Vài điểm cần đối chiếu khi ghép:

1. **Bảng `users` có thể đã tồn tại.** Script `01_schema_*.sql` dùng `CREATE TABLE IF NOT EXISTS`
   cho PH1 và PH2 nên chạy được trên CSDL sẵn có. Nếu cấu trúc bảng cũ khác, hãy đối chiếu
   `database/erd_auth_rbac.png` rồi bổ sung cột còn thiếu bằng `ALTER TABLE` thay vì tạo mới.
2. **Chức năng quên và đặt lại mật khẩu** đã có sẵn. Bảng `auth_tokens` trong thiết kế này
   dùng chung cho cả ba loại token (`REFRESH`, `RESET_PASSWORD`, `VERIFY_EMAIL`) qua cột
   `token_type` — nếu nhóm đang dùng bảng riêng thì có thể gộp về đây hoặc giữ nguyên.
3. **API đổi mật khẩu** nên gọi thêm `tokenService.revokeAllTokens(userId)` để buộc đăng nhập
   lại trên mọi thiết bị sau khi đổi mật khẩu — đây là hành vi chuẩn về bảo mật.
4. **Các endpoint hồ sơ và địa chỉ** đã có sẵn nên bọc bằng `authenticate` cùng
   `requirePermissions(P.PROFILE_UPDATE)` hoặc `P.ADDRESS_MANAGE` để áp dụng nhất quán RBAC.

## 9. Việc còn lại của Sprint 2

Ba ticket To Do đã hoàn thành. Phần tiếp theo dựa trên nền này:

- API danh mục và sản phẩm (`PRODUCT_*`, `CATEGORY_*`) — lược đồ và seed đã sẵn sàng
- API giỏ hàng và đặt hàng (`CART_MANAGE`, `ORDER_CREATE`) — chú ý dùng `qty_reserved`
  khi giữ chỗ tồn kho, đặt trong một giao dịch
- Đặc tả OpenAPI sinh tự động cho toàn bộ endpoint
