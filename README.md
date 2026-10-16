# AETHELGARD SHOPPING MALL — HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI

Hệ thống E-Commerce thời trang cao cấp hoàn chỉnh với kiến trúc chuẩn Enterprise, phân tách rõ ràng 3 phân hệ: **Người Bán (Seller)**, **Khách Hàng (Customer)** và **Quản Trị Viên (Admin)**, được tối ưu hóa cho đội ngũ lập trình viên làm việc song song hiệu quả và mở rộng tính năng bền vững.

- **Backend (.NET 10 Web API - Clean Architecture)**: Phân tầng nghiêm ngặt `Ecommerce.API`, `Ecommerce.BLL`, `Ecommerce.DAL`, `Ecommerce.Common`. Hệ thống kiểm thử tự động đạt **8/8 Tests Passed (100%)** (3 Unit Tests + 5 Integration Tests).
- **Frontend (Next.js 15 / React 19 / TypeScript / Tailwind CSS)**: Kiến trúc Component-Driven hiện đại, tích hợp React Context toàn cục (`AuthContext`, `CartContext`, `ToastContext`), phân trang động thông minh và giao diện Boutique Luxury.
- **Hệ thống dữ liệu**: Hỗ trợ Microsoft SQL Server và SQLite, tích hợp sẵn Database Seeder tự động nạp 180 sản phẩm thời trang cao cấp, 23 gian hàng Boutique chính hãng, đơn hàng vận chuyển FedEx và ma trận doanh số 12 tháng.

---

## 📌 1. Thông Tin Chung Dự Án

* **Tên dự án**: Hệ thống Thương mại Điện tử Thời trang Cao cấp tích hợp AI (Aethelgard Shopping Mall).
* **Mục tiêu**: Xây dựng nền tảng sàn thương mại điện tử đa người bán (Multi-vendor Marketplace) chuyên biệt cho ngành thời trang, giày sneaker và phụ kiện xa xỉ; tích hợp trợ lý phối đồ AI thông minh (AI Fashion Stylist), kiểm soát tồn kho chặt chẽ và tối ưu hóa vận hành kinh doanh.
* **Mô hình kiến trúc**: Client-Server hiện đại, phân tách độc lập giữa Frontend (Next.js 15 App Router) và Backend RESTful API (.NET 10 Clean Architecture).
* **Bộ tài liệu kỹ thuật chuyên sâu đính kèm**:
  * 📖 [**Báo Cáo Chức Năng & Lộ Trình Phát Triển**](BAO_CAO_CHUC_NANG_HE_THONG.md): Chi tiết chức năng từng phân hệ và đề xuất tính năng mới.
  * 🏗️ [**Báo Cáo Thiết Kế Kiến Trúc Hệ Thống**](BAO_CAO_THIET_KE_HE_THONG.md): Thiết kế Clean Architecture, sơ đồ FDD, Use Case, ERD 8 bảng dữ liệu, Sequence Diagrams.
  * 🚀 [**Hướng Dẫn Khởi Chạy Dự Án (Quickstart)**](HUONG_DAN_KHOI_CHAY_DU_AN.md): Hướng dẫn cài đặt môi trường và chạy dự án 1-click cho các dev mới.
  * 👥 [**Quy Chuẩn Phối Hợp Làm Việc Nhóm**](TEAM_COLLABORATION_GUIDE.md): Phân chia trách nhiệm module và quy tắc tránh xung đột mã nguồn.
  * 📝 [**Báo Cáo Thay Đổi Hệ Thống**](BAO_CAO_THAY_DOI_HE_THONG.md): Nhật ký kiểm toán các cải tiến kỹ thuật cốt lõi.

---

## 🏛️ 2. Sơ Đồ Cấu Trúc Mã Nguồn

```text
├── backend/                                   # [.NET 10 Web API - Clean Architecture]
│   ├── Ecommerce.slnx                         # Solution file quản lý các project
│   ├── src/
│   │   ├── Ecommerce.API/                     # [Presentation] Controllers, Middlewares, JWT, Swagger, CORS
│   │   ├── Ecommerce.BLL/                     # [Business Logic] Services (Product, Order, Auth, Inventory, Stats, AI...)
│   │   ├── Ecommerce.DAL/                     # [Data Access] EF Core, UnitOfWork, Repositories, DatabaseSeeder
│   │   └── Ecommerce.Common/                  # [Domain & Shared] Entities, DTOs, Enums, Custom Exceptions
│   └── tests/
│       ├── Ecommerce.Tests.Unit/              # Unit Tests kiểm thử tầng nghiệp vụ (3/3 Passed)
│       └── Ecommerce.Tests.Integration/       # Integration Tests kiểm thử API Endpoints (5/5 Passed)
│
├── frontend/                                  # [Next.js 15 / React 19 / TypeScript]
│   ├── public/img/                            # Thư viện hình ảnh sản phẩm & thương hiệu thực tế
│   └── src/
│       ├── app/                               # Next.js App Router
│       │   ├── page.tsx                       # Trang chủ sàn TMĐT, Catalog & Phân trang động
│       │   ├── orders/page.tsx                # [Seller] Quản lý đơn hàng & Live Tracker vận đơn
│       │   ├── inventory/page.tsx             # [Seller] Quản lý tồn kho SKU & Nhập hàng nhanh
│       │   ├── income-statistics/page.tsx     # [Seller] Thống kê doanh thu & ma trận 12 tháng
│       │   ├── shop-profile/page.tsx          # [Seller] Hồ sơ gian hàng Flagship Boutique & Voucher
│       │   ├── product-detail/[id]/page.tsx   # [Customer] Chi tiết sản phẩm, chọn size/màu, AI Stylist
│       │   └── login/page.tsx                 # [Shared] Đăng nhập, Đăng ký & Quên mật khẩu OTP
│       │
│       ├── components/                        # Tầng giao diện Component-Driven
│       │   ├── Navbar.tsx                     # Thanh điều hướng thích ứng theo vai trò người dùng
│       │   ├── Footer.tsx                     # Chân trang phong cách Luxury
│       │   ├── ui/                            # 🧩 UI Kit tái sử dụng (Button, Modal, Card, Badge, KPICard...)
│       │   ├── seller/                        # 🏪 Components quản trị (CartModal, CheckoutModal, Drawer...)
│       │   └── auth/                          # 🔒 AuthSlider, LoginForm, RegisterForm, ForgotPasswordFlow
│       │
│       ├── contexts/                          # State toàn cục (AuthContext, CartContext, ToastContext)
│       ├── hooks/                             # Custom Hooks (useAuth, useCart, useToast, useLocalStorage)
│       ├── services/                          # Tầng API Client (auth, product, order, inventory, stats, store)
│       ├── types/                             # TypeScript Domain Types (auth, product, order, inventory...)
│       ├── styles/                            # CSS Design System & Global Styles
│       └── lib/                               # Tiện ích chung (formatVND, utils, mock-data)
│
├── scripts/
│   ├── start-backend.cmd                      # Khởi động Backend Web API (.NET) tại Port 5000
│   └── start-frontend.cmd                     # Khởi động Frontend (Next.js) tại Port 3001
├── start-all.cmd                              # Kịch bản 1-click khởi động toàn bộ hệ thống
└── .gitignore                                 # Bộ quy chuẩn loại trừ file build nhị phân & cache
```

---

## 🚀 3. Hướng Dẫn Khởi Động Nhanh (Quickstart)

### Cách 1: Khởi động tự động bằng 1-Click (Khuyên dùng trên Windows)
Nhấp đúp chuột vào tệp:
```cmd
start-all.cmd
```
Hệ thống sẽ tự động khởi chạy Backend .NET (cổng `5000`), Frontend Next.js (cổng `3001`), tự nạp CSDL hạt giống và mở trình duyệt web.

---

### Cách 2: Khởi động thủ công từng dịch vụ (CLI)

#### 1. Khởi chạy Backend (.NET 10 Web API):
```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/Ecommerce.API/Ecommerce.API.csproj --launch-profile http
```
* **Địa chỉ Backend API**: [http://localhost:5000](http://localhost:5000)
* **Swagger API Explorer**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
* *CSDL sẽ tự động được khởi tạo và nạp 180 sản phẩm hạt giống ngay trong lần chạy đầu tiên.*

#### 2. Khởi chạy Frontend (Next.js 15):
```bash
cd frontend
npm install
npm run dev
```
* **Giao diện Web Portal**: 👉 **[http://localhost:3001](http://localhost:3001)**
*(Đã cấu hình chạy cố định trên cổng 3001 để tránh xung đột cổng 3000)*.

---

## 🔑 4. Danh Sách Tài Khoản Dùng Thử (Pre-seeded Accounts)

Mật khẩu dùng chung cho tất cả tài khoản mẫu: **`Password123@`**

| Vai Trò (Role) | Email Đăng Nhập | Họ & Tên | Quyền Hạn & Tính Năng Trải Nghiệm |
| :--- | :--- | :--- | :--- |
| **Seller (Chủ shop)** | `ducmanh@gmail.com` | Nguyễn Đức Mạnh | Quản lý 20 sản phẩm riêng, quản lý tồn kho SKU, duyệt & đổi trạng thái đơn hàng, xem ma trận doanh thu |
| **Admin (Quản trị)** | `admin@gmail.com` | Aethelgard Admin | Toàn quyền kiểm soát tài khoản, duyệt gian hàng, danh mục và đơn hàng toàn sàn |
| **Customer (Khách mua)** | `esther.howard@example.com` | Esther Howard | Mua sắm sản phẩm, tư vấn phối đồ AI Stylist, Giỏ hàng toàn cục, Đặt hàng thanh toán COD |
| **Boutique Seller (Dior)** | `dior@gmail.com` | Christian Dior Official | Cửa hàng đối tác chính hãng thương hiệu Dior |
| **Boutique Seller (Gucci)** | `gucci@gmail.com` | Gucci Official | Cửa hàng đối tác chính hãng thương hiệu Gucci |
| **Boutique Seller (Adidas)** | `adidas@gmail.com` | Adidas Official | Cửa hàng đối tác chính hãng thương hiệu Adidas |

---

## 🧪 5. Kiểm Thử Hệ Thống (Automated Testing)

### 1. Kiểm thử Backend (.NET Tests):
```bash
dotnet test backend/Ecommerce.slnx
```
* **Ecommerce.Tests.Unit**: 3/3 bài kiểm thử nghiệp vụ đạt kết quả **PASSED**.
* **Ecommerce.Tests.Integration**: 5/5 bài kiểm thử tích hợp API đạt kết quả **PASSED**.
* **Tổng cộng**: **8/8 bài test Passed (100%)**.

### 2. Kiểm thử Biên dịch Frontend Production Build:
```bash
npm --prefix frontend run build
```
* **Tất cả các route tĩnh và động đều biên dịch tối ưu thành công (0 Lỗi)**.
