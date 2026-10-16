# 🛍️ AETHELGARD SHOPPING MALL — HỆ THỐNG TMĐT TÍCH HỢP AI
## BÁO CÁO TỔNG HỢP NÂNG CẤP VÀ SỬA CHỮA HỆ THỐNG
*Tối ưu hóa Logic Kho, Luồng Đặt Hàng Thực Tế, Quản Lý Giỏ Hàng Toàn Cục & Bảo Mật API*

---

| Thông Tin | Chi Tiết |
| :--- | :--- |
| **Dự án** | Aethelgard Shopping Mall — E-Commerce Thời Trang Cao Cấp |
| **Nhánh thực hiện** | `hoang` (Đồng bộ và nâng cấp từ nhánh remote `origin/ducmanh`) |
| **Thời gian thực hiện** | 22/09/2026 |
| **Trạng thái kiểm thử** | ✅ **PASSED 100%** (Backend Tests 8/8 Passed, Frontend 0 Error) |

---

## 📌 I. TỔNG QUAN HIỆN TRẠNG & CÁC VẤN ĐỀ PHÁT HIỆN

Sau khi tiếp nhận mã nguồn từ nhánh `ducmanh`, hệ thống đã đạt được nền móng kiến trúc chuẩn Clean N-Tier (.NET 10 Web API) kết hợp Next.js 15 App Router và CSDL SQL Server với 180 sản phẩm thời trang.

Tuy nhiên, qua quá trình kiểm tra sâu về logic nghiệp vụ và luồng tương tác người dùng, hệ thống phát hiện **5 vấn đề cốt lõi** cần can thiệp xử lý ngay:

1. ❌ **Lỗi bán khống / âm hàng (Overselling) trong `OrderService.cs`**:
   - Nếu khách đặt mua số lượng vượt quá tồn kho thực tế (`product.StockQuantity < item.Quantity`), hệ thống **không báo lỗi**, không trừ kho nhưng **vẫn cho phép tạo đơn hàng thành công**.
   - Việc trừ kho chỉ thực hiện trên bảng `Products` tổng, hoàn toàn bỏ quên việc kiểm tra và trừ tồn kho trên các biến thể size/màu (`ProductVariants`).
2. ❌ **Nút Thanh Toán (Checkout) không lưu đơn hàng vào CSDL**:
   - Trong `CheckoutModal.tsx`, khi khách điền thông tin và bấm xác nhận đặt hàng, form chỉ hiển thị thông báo Toast thành công rồi xóa giỏ hàng tạm, **hoàn toàn chưa gọi API `POST /api/orders`** để lưu đơn hàng vào database.
3. ❌ **Navbar biến mất khi người dùng chưa đăng nhập**:
   - Trong `Navbar.tsx`, điều kiện `if (pathname === '/login' || (!isLoading && !token)) return null;` đã ẩn hoàn toàn thanh điều hướng đối với khách chưa đăng nhập. Khách vãng lai truy cập website hoàn toàn không thấy Logo, Giỏ hàng, hay nút Đăng nhập.
4. ❌ **Thiếu State Giỏ Hàng Toàn Cục (Global Cart Context)**:
   - Giỏ hàng chỉ được lưu bằng `useState` cục bộ tại trang chủ `page.tsx`. Khi khách vào xem trang chi tiết `/product-detail/[id]` và bấm "Thêm vào giỏ", sản phẩm không thể lưu sang giỏ hàng của trang chủ.
5. ❌ **Lỗ hổng bảo mật & Phân quyền Backend API**:
   - Các API nhạy cảm như `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` không có thẻ `[Authorize]`, cho phép bất kỳ ai cũng có thể gọi và đang bị **gán cứng `sellerId = 1`**. Thao tác cập nhật đơn hàng và nhập kho chưa được bảo vệ.

---

## 🛠️ II. CHI TIẾT CÁC THAY ĐỔI & KHẮC PHỤC THEO 3 BƯỚC

### 1. Bước 1: Sửa Logic Tồn Kho (Chống Bán Khống) & Kết Nối Đặt Hàng Thực Tế

#### A. Backend (`OrderService.cs`)
- Bổ sung kiểm tra nghiêm ngặt trước khi tạo đơn: nếu `product.StockQuantity < item.Quantity`, hệ thống lập tức ném lỗi `BadRequestException` kèm thông báo số lượng còn lại trong kho, ngăn chặn triệt để tình trạng bán khống.
- Tự động phân tích trường `Specs` (size/màu) để tìm đúng bản ghi biến thể `ProductVariant`: kiểm tra và trừ tồn kho của biến thể tương ứng.
- Tự động cập nhật `StockStatus` của sản phẩm: chuyển sang `LowStock` khi còn $\le 10$ sản phẩm và `OutOfStock` khi hết hàng ($= 0$).

#### B. Frontend (`order.service.ts` & `CheckoutModal.tsx`)
- Bổ sung phương thức `createOrder(data)` vào `order.service.ts` để gửi dữ liệu tới `POST /api/orders`.
- Nâng cấp `CheckoutModal.tsx` thành form đặt hàng hoàn chỉnh:
  - Thu thập đầy đủ thông tin: Họ tên, Số điện thoại, Email nhận thông báo, Địa chỉ giao hàng, Ghi chú đơn hàng.
  - Hỗ trợ lựa chọn phương thức thanh toán: **COD** (Thanh toán khi nhận hàng) hoặc **ONLINE** (Thanh toán trực tuyến).
  - Tự động điền trước thông tin cá nhân nếu người dùng đã đăng nhập.
  - Gửi toàn bộ danh sách sản phẩm trong giỏ hàng lên Backend và nhận về mã đơn hàng thực tế (ví dụ: `AG-2026-7179`).

---

### 2. Bước 2: Xây Dựng Global Cart Context & Chuẩn Hóa Navbar

#### A. Tạo mới `CartContext.tsx` & Hook `useCart.ts`
- Quản lý tập trung toàn bộ State giỏ hàng cho toàn bộ ứng dụng:
  - Các hàm thao tác: `addToCart(product, qty, specs)`, `removeFromCart(id)`, `updateQuantity(id, qty)`, `clearCart()`.
  - Các chỉ số tính toán tự động: `totalQty` (tổng số lượng món đồ), `totalAmount` (tổng số tiền thanh toán).
  - Điều khiển đóng/mở modal: `isCartOpen`, `setIsCartOpen`, `isCheckoutOpen`, `setIsCheckoutOpen`.
- **Đồng bộ tự động với `localStorage`** (`aethelgard_cart`): Giỏ hàng của khách không bị mất đi khi tải lại trang hoặc chuyển đổi giữa các màn hình.

#### B. Nâng cấp `Navbar.tsx` Đa Vai Trò
- **Loại bỏ lỗi ẩn thanh điều hướng khi chưa đăng nhập**:
  - **Khách vãng lai (Chưa login)**: Hiển thị Logo thương hiệu, liên kết Cửa Hàng, biểu tượng Giỏ Hàng kèm số lượng Badge động và nút **Đăng Nhập**.
  - **Người bán (Seller/Admin đã login)**: Hiển thị đầy đủ các tab nghiệp vụ chuyên sâu: `Tồn Kho`, `Đơn Hàng`, `Doanh Thu`, `Hồ Sơ Shop`, Avatar người dùng kèm vai trò (Role) và nút **Đăng Xuất**.

#### C. Chuẩn hóa Trang Chi Tiết Sản Phẩm (`/product-detail/[id]`)
- Loại bỏ hoàn toàn URL API fix cứng `fetch('http://localhost:5000...')`, chuyển sang gọi qua service chuẩn hóa `productService.getProductById(id)`.
- Nối trực tiếp nút **"Thêm vào giỏ hàng"** và **"Mua ngay"** với `useCart()`, đảm bảo khách hàng thêm sản phẩm ở trang chi tiết sẽ xuất hiện ngay trong giỏ hàng ở thanh Navbar và Trang chủ.

---

### 3. Bước 3: Gia Cố Bảo Mật Backend API & Phân Quyền Multi-tenant

#### A. Bảo vệ API Sản phẩm (`ProductsController.cs`)
- Thêm attribute `[Authorize(Roles = "Seller,Admin")]` cho các hành vi `POST`, `PUT`, `DELETE`.
- Trích xuất `sellerId` tự động từ JWT Token Claims (`User.FindFirst(ClaimTypes.NameIdentifier)`) thay vì gán cứng số `1`.
- **Cơ chế kiểm tra quyền sở hữu (Owner check)**: Người bán chỉ có quyền chỉnh sửa hoặc xóa các sản phẩm thuộc quyền sở hữu của gian hàng mình, Admin có toàn quyền quản trị.

#### B. Bảo vệ Quản lý Đơn hàng & Nhập kho
- Thêm `[Authorize(Roles = "Seller,Admin")]` cho endpoint cập nhật trạng thái đơn hàng (`PATCH /api/orders/{id}/status`) và nhập hàng tồn kho (`POST /api/inventory/restock`).
- Tự động gắn `userId` vào đơn hàng nếu khách đã đăng nhập tài khoản.

---

## 📂 III. DANH MỤC CÁC FILE ĐÃ TẠO MỚI & CHỈNH SỬA

| STT | Tệp Tin (File Path) | Thao Tác | Nội Dung Thay Đổi Kỹ Thuật |
| :---: | :--- | :---: | :--- |
| 1 | `backend/.../OrderService.cs` | **Chỉnh sửa** | Thêm kiểm tra tồn kho chống bán khống, trừ kho cả sản phẩm tổng & biến thể variant |
| 2 | `backend/.../ProductsController.cs` | **Chỉnh sửa** | Bổ sung `[Authorize]`, trích xuất `sellerId` từ JWT, kiểm tra quyền sở hữu sản phẩm |
| 3 | `backend/.../OrdersController.cs` | **Chỉnh sửa** | Phân quyền `[Authorize]` cập nhật đơn hàng, gắn `userId` khách đăng nhập |
| 4 | `backend/.../InventoryAndStatsControllers.cs` | **Chỉnh sửa** | Bảo vệ endpoint nhập kho `[Authorize]` cho Seller/Admin |
| 5 | `frontend/src/contexts/CartContext.tsx` | **Tạo mới** | Context quản lý giỏ hàng toàn cục, đồng bộ trạng thái tự động với `localStorage` |
| 6 | `frontend/src/hooks/useCart.ts` | **Tạo mới** | Custom hook cung cấp quyền truy cập giỏ hàng cho tất cả các components |
| 7 | `frontend/src/components/Navbar.tsx` | **Chỉnh sửa** | Luôn hiển thị Navbar, badge giỏ hàng động, hiển thị menu phân quyền Seller/Guest |
| 8 | `frontend/.../CheckoutModal.tsx` | **Chỉnh sửa** | Bổ sung form thông tin khách hàng, kết nối API `POST /api/orders` lưu đơn thật |
| 9 | `frontend/src/app/page.tsx` | **Chỉnh sửa** | Tích hợp `useCart` toàn cục, hiển thị mã đơn hàng thực tế sau khi đặt hàng |
| 10 | `frontend/src/app/product-detail/[id]/page.tsx` | **Chỉnh sửa** | Xóa URL hardcode, kết nối `productService` và nút thêm giỏ hàng thật |
| 11 | `frontend/src/services/order.service.ts` & `types` | **Chỉnh sửa** | Bổ sung hàm API `createOrder` và khai báo kiểu dữ liệu `CreateOrderRequest` |
| 12 | `.gitignore` | **Chỉnh sửa** | Bổ sung cấu hình bỏ qua thư mục build .NET `bin/obj` và Next.js `frontend/.next` |

---

## 🧪 IV. KẾT QUẢ KIỂM THỬ THỰC TẾ (VERIFICATION & TESTS)

### 1. Kiểm thử Tự Động Backend (.NET 10 Tests)
Chạy lệnh kiểm thử toàn bộ giải pháp:
```powershell
dotnet test backend/Ecommerce.slnx
```
- **Ecommerce.Tests.Unit**: **3/3 bài kiểm thử PASSED (100%)**
- **Ecommerce.Tests.Integration**: **5/5 bài kiểm thử PASSED (100%)**
- **Kết luận**: 8/8 bài kiểm thử đạt kết quả tuyệt đối, không có lỗi hồi quy (regression).

### 2. Kiểm thử Nghiệp Vụ Đặt Hàng & Trừ Kho Thực Tế
- **Kịch bản 1 — Chống bán khống (Overselling Test)**:
  - Gửi request đặt mua 99 sản phẩm #180 (khi kho chỉ còn 50).
  - **Kết quả**: API trả về mã **HTTP 400 Bad Request**, từ chối giao dịch kèm thông báo:
    > *"Sản phẩm 'Nước Hoa Tommy Girl & Boy' chỉ còn 50 sản phẩm trong kho, không đủ đáp ứng số lượng yêu cầu (99)."*
- **Kịch bản 2 — Đặt hàng thành công**:
  - Gửi request đặt mua 2 sản phẩm #180 qua `POST /api/orders`.
  - **Kết quả**: API trả về mã **HTTP 201 Created**, sinh mã đơn hàng **`AG-2026-7179`** với hãng vận chuyển **FedEx Logistics**.
  - **Kiểm tra CSDL**: Tồn kho sản phẩm #180 giảm chính xác từ **50** xuống **48**.

### 3. Kiểm thử Biên Dịch Frontend Next.js 15 (Production Build)
Chạy lệnh kiểm tra biên dịch:
```powershell
npm --prefix frontend run build
```
- **Kết quả**: `✓ Compiled successfully in 2.3s` (**0 errors**).
- Toàn bộ 10 route (Static & Dynamic) đều được biên dịch tối ưu.

---

## 🔑 V. THÔNG TIN VẬN HÀNH & TÀI KHOẢN THỬ NGHIỆM

Hệ thống hiện đang chạy sẵn sàng trên máy tính của bạn:
- **Giao diện Web**: [http://localhost:3001](http://localhost:3001) *(đã chuyển từ cổng 3000 để tránh xung đột cổng)*
- **Swagger API Explorer**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

### Danh Sách Tài Khoản Mẫu (Mật khẩu chung: `Password123@`):
| Vai Trò (Role) | Email Đăng Nhập | Họ & Tên | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Seller** | `ducmanh@gmail.com` | Nguyễn Đức Mạnh | Quản lý sản phẩm, đơn hàng, tồn kho & thống kê doanh thu |
| **Admin** | `admin@gmail.com` | Aethelgard Admin | Quản trị viên toàn hệ thống |
| **Boutique Seller** | `dior@gmail.com` | Dior Official | Đối tác bán lẻ thương hiệu Dior |
| **Customer** | `esther.howard@example.com` | Esther Howard | Khách mua sắm thời trang |

---

## 🛠️ VI. CẬP NHẬT: KHẮC PHỤC THANH ĐIỀU HƯỚNG PHÂN TRANG (1..10)

- **Nguyên nhân**: Thanh phân trang dưới chân lưới sản phẩm ban đầu được viết cứng (`hardcoded`) bằng các thẻ tĩnh `1 2 3 ... 10`, không có state điều khiển và mảng sản phẩm không được cắt theo trang (`slice`). Khi người dùng/seller bấm sang trang 2 hoặc 3, giao diện không phản hồi và luôn kẹt ở trang 1.
- **Giải pháp xử lý**:
  1. Thêm state `currentPage` (mặc định 1), `itemsPerPage = 12`, tính động `totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))`.
  2. Áp dụng `paginatedProducts = filteredProducts.slice(...)` để hiển thị đúng 12 sản phẩm trên mỗi trang tương ứng.
  3. Xây dựng thuật toán sinh trang thông minh `getPageNumbers()` (hỗ trợ dấu `...` khi có nhiều trang).
  4. Chuyển đổi các thẻ sang `<button type="button">` tương tác:
     - Nút **Previous** / **Next** tự động vô hiệu hóa (`disabled`) ở đầu/cuối danh sách.
     - Tự động cuộn trang mượt (`scrollIntoView`) lên vị trí `#catalog` khi chuyển trang.
     - Tự động quay về trang 1 khi người dùng đổi bộ lọc phân loại hoặc gõ tìm kiếm.
     - Bổ sung hiệu ứng hover, active màu tím và bóng đổ chuẩn giao diện thương mại điện tử.
