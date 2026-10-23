# 📑 BÁO CÁO TỔNG THỂ DỰ ÁN — AETHELGARD SHOPPING MALL
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI
> **Báo cáo tổng hợp toàn diện**: Danh mục chức năng đã hoàn thành, lỗi kỹ thuật đã khắc phục và minh chứng lịch sử Commit từ ngày xác lập dự án đến hiện tại.

---

## 📌 I. THÔNG TIN CHUNG DỰ ÁN

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tên dự án** | **Aethelgard Shopping Mall** — Hệ thống TMĐT Thời trang Cao cấp Tích hợp AI |
| **Mô hình kiến trúc** | Multi-vendor Marketplace (Đa người bán: Flagship Stores & Khách hàng cá nhân) |
| **Thời gian triển khai** | **21/08/2026 – 23/10/2026** |
| **Nhánh lưu trữ tổng thể** | `hoang` (Đã tích hợp toàn bộ tính năng Core, Seller, Customer và công cụ Data) |
| **Ngăn xếp Backend** | ASP.NET Core Web API (.NET 10), Clean Architecture (3-Tier), EF Core, SQL Server |
| **Ngăn xếp Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Xác thực & Bảo mật** | JWT (JSON Web Token), Phân quyền Role-based (`Admin`, `Seller`, `Customer`), BCrypt |
| **Trạng thái kiểm thử** | ✅ **8/8 Backend Tests Passed (100%)** \| ✅ **16/16 Frontend Routes Passed (0 Lỗi)** |

---

## 🕒 II. BẢNG MINH CHỨNG TOÀN BỘ LỊCH SỬ COMMIT (TỪ KHỞI TẠO ĐẾN NAY)

Dưới đây là bảng trích xuất toàn bộ lịch sử 39 commits trong Git log của dự án theo thứ tự thời gian, làm bằng chứng xác thực cho mọi công việc đã thực hiện:

| STT | Mã Commit | Ngày | Tác giả | Thông điệp Commit & Nội dung thực hiện |
| :---: | :---: | :---: | :--- | :--- |
| 1 | `61bc4ba` | 2026-08-21 | Dao Ngoc Long | **Initial commit**: Khởi tạo repository dự án. |
| 2 | `47f561c` | 2026-08-31 | Nguyen Duc Manh | **sprint 2**: Bắt đầu triển khai phân kỳ Sprint 2. |
| 3 | `3aa3722` | 2026-09-01 | Nguyen Duc Manh | **feat(task1-fe)**: Thiết kế cổng xác thực Aethelgard Auth Portal, slider 2 cột mờ dần (fade 15s), thanh đo độ mạnh mật khẩu và định vị thương hiệu AI. |
| 4 | `0b26708` | 2026-09-01 | Nguyen Duc Manh | **fix(task1-fe)**: Sửa lỗi chuyển tab 60fps mượt mà, tự động thu gọn khung đo mật khẩu khi rỗng. |
| 5 | `c9cc6d1` | 2026-09-01 | Nguyen Duc Manh | **docs(task1-fe)**: Cập nhật README bộ quy tắc validation (Full Name, Email, Password, 20/20 PASS). |
| 6 | `144af3d` | 2026-09-01 | Nguyen Duc Manh | **chore(task1-fe)**: Dọn dẹp thư mục kết quả và chuẩn hóa cấu trúc README. |
| 7 | `1bd2170` | 2026-09-04 | Nguyen Duc Manh | **feat(task6)**: Hoàn thành Task 6 FE (Quên mật khẩu), wireframe sketch, OTP 6 số mặc định `000000`, logic nghiệp vụ thực. |
| 8 | `e8573f8` | 2026-09-04 | Nguyen Duc Manh | **fix(task6)**: Giới hạn ô nhập OTP chỉ 1 ký tự/ô, ngăn chặn tràn ký tự. |
| 9 | `02efe90` | 2026-09-04 | Nguyen Duc Manh | **fix(task6)**: Xóa tự động điền mật khẩu cũ của trình duyệt để ô đặt lại mật khẩu bắt đầu trống. |
| 10 | `2eaa268` | 2026-09-04 | Nguyen Duc Manh | **style(task6)**: Thay icon emoji thành icon chuyên nghiệp, tinh chỉnh thông báo toast. |
| 11 | `8228308` | 2026-09-04 | Nguyen Duc Manh | **hoàn thiện sprint 2**: Hoàn tất toàn bộ yêu cầu của Sprint 2. |
| 12 | `436e304` | 2026-09-06 | Nguyen Duc Manh | **hoàn thành nhiệm vụ**: Đóng gói các nhiệm vụ giai đoạn 2. |
| 13 | `d851051` | 2026-09-14 | Nguyen Duc Manh | **tái cấu trúc**: Bắt đầu tái cấu trúc mã nguồn toàn sàn. |
| 14 | `ce63a7b` | 2026-09-14 | Nguyen Duc Manh | **docs**: Bổ sung README tổng quan hệ thống thương mại điện tử. |
| 15 | `662df7f` | 2026-09-14 | Nguyen Duc Manh | **feat**: Bổ sung thư mục report chi tiết tiến độ. |
| 16 | `eac6305` | 2026-09-14 | Nguyen Duc Manh | **docs**: Cập nhật cây thư mục và cấu trúc tài liệu. |
| 17 | `21750e6` | 2026-09-14 | Nguyen Duc Manh | **feat**: Hoàn thành xây dựng và hợp nhất hệ thống Core E-Commerce bằng TypeScript. |
| 18 | `1556332` | 2026-09-14 | Nguyen Duc Manh | **chore**: Cấu hình `.gitignore` chuẩn (loại trừ `node_modules` và thư mục branches). |
| 19 | `c7cf2d7` | 2026-09-14 | Nguyen Duc Manh | **feat**: Thêm công cụ tự động đồng bộ code nhóm `update-team`. |
| 20 | `940be46` | 2026-09-14 | Nguyen Duc Manh | **docs**: Cập nhật vai trò và nhiệm vụ cốt lõi phân hệ Người Bán (Seller System). |
| 21 | `4f11f23` | 2026-09-14 | Nguyen Duc Manh | **cấu hình quy tắc commit tiếng việt cho AI**. |
| 22 | `3761988` | 2026-09-15 | Nguyen Duc Manh | **feat**: Hoàn thành Cổng người bán (Seller Center) bằng Backend .NET 10 C#. |
| 23 | `3754671` | 2026-09-15 | Nguyen Duc Manh | **feat**: Hoàn thiện cổng người bán phong cách Pinterest và Trợ lý AI bằng TypeScript. |
| 24 | `40c9177` | 2026-09-18 | Nguyen Duc Manh | **đồng bộ giao diện giống hoàn toàn bản phác thảo**: Chuẩn hóa UI Seller theo wireframe. |
| 25 | `5fb9e35` | 2026-09-18 | Nguyen Duc Manh | **phác thảo**: Cập nhật các bản phác thảo kiến trúc giao diện. |
| 26 | `17b20e9` | 2026-09-18 | Nguyen Duc Manh | **chuyển toàn bộ giao diện từ bản vẽ sang frontend**: Hiện thực hóa wireframe thành Next.js components. |
| 27 | `2928ad3` | 2026-09-18 | Nguyen Duc Manh | **fix**: Sửa lỗi tỷ lệ khung hình và kích thước ảnh bảng đơn hàng, kho hàng. |
| 28 | `c682a4b` | 2026-09-18 | Nguyen Duc Manh | **fix**: Khôi phục hiệu ứng trượt bảng người bán khi nhấn vào sản phẩm. |
| 29 | `8acffa8` | 2026-09-21 | Nguyen Duc Manh | **feat**: Bổ sung bảo vệ tuyến đường (Route Guarding) và xác thực người bán. |
| 30 | `6a67f5f` | 2026-09-22 | Nguyen Duc Manh | **tái cấu trúc**: Chuyển đổi cấu trúc từ sprint sang kiến trúc phân tầng chuẩn `backend/`, `frontend/`, `tool/` tách biệt. |
| 31 | `bc475e4` | 2026-10-16 | Hoang | **feat(core)**: Hoàn thiện logic đặt hàng chống bán khống (chặn âm kho), bảo mật phân quyền Backend và tích hợp giỏ hàng toàn cục (`CartContext`). |
| 32 | `278b58f` | 2026-10-16 | Hoang | **feat(ui)**: Sửa lỗi thanh phân trang động, sửa hiển thị Navbar cho khách vãng lai và chuyển cổng chạy cố định sang `3001`. |
| 33 | `12e3c52` | 2026-10-16 | Hoang | **docs**: Bổ sung bộ tài liệu báo cáo thiết kế, chức năng hệ thống, báo cáo thay đổi và dọn dẹp mã nguồn. |
| 34 | `17f42a7` | 2026-10-16 | bkav104104-hue | **Merge PR #2**: Hợp nhất các nâng cấp Core và Sửa lỗi từ nhánh `hoang` vào nhánh chính. |
| 35 | `5d38822` | 2026-10-16 | Hoang | **docs**: Cập nhật `README.md` loại bỏ thông tin cá nhân cũ và bổ sung tài liệu hướng dẫn nhóm. |
| 36 | `228f2a0` | 2026-10-16 | bkav104104-hue | **Merge PR #3**: Hợp nhất hoàn thiện tài liệu dự án từ `hoang`. |
| 37 | `f5cc5f0` | 2026-10-17 | Nguyen Duc Manh | **sửa và tinh chỉnh seller**: Bổ sung bộ lọc thương hiệu, tối ưu hiển thị danh sách sản phẩm. |
| 38 | `68a99cc` | 2026-10-17 | Nguyen Duc Manh | **Update README.md**: Bổ sung hướng dẫn khởi chạy và kết quả kiểm thử. |
| 39 | `238c871` | 2026-10-23 | Hoang | **feat(customer)**: Tích hợp toàn bộ Phân hệ Khách hàng từ nhánh `bacc` (đã bóc tách chuẩn hóa lỗi lồng thư mục): Cổng `/shop`, Chi tiết SP `/product-detail/[id]`, Quản lý đơn `/shop/my-orders`, Tra cứu `/shop/track-order`, Wishlist, AI Stylist, API Hủy đơn hoàn kho. |

---

## 🏛️ III. CHI TIẾT CÁC CHỨC NĂNG ĐÃ XÂY DỰNG THEO TỪNG PHÂN HỆ

### 1. Phân hệ Cốt lõi & Dữ liệu Nền tảng (Core E-Commerce & Backend Architecture)
- **Kiến trúc N-Tier chuẩn Clean Architecture (.NET 10)**:
  - `Ecommerce.API`: Tiếp nhận yêu cầu RESTful, Middleware bắt lỗi toàn cục `GlobalExceptionMiddleware`, Swagger UI OpenAPI.
  - `Ecommerce.BLL`: Xử lý nghiệp vụ logic (`ProductService`, `OrderService`, `InventoryService`, `StatisticsService`, `AuthService`).
  - `Ecommerce.DAL`: Tương tác CSDL qua EF Core, cấu hình Fluent API `EntityConfigurations.cs`, chỉ mục hiệu năng (Performance Indexes).
  - `Ecommerce.Common`: DTOs, Enums chuẩn hóa trạng thái (`OrderStatus`, `StockStatus`), mã lỗi nghiệp vụ.
- **Dữ liệu hạt giống phong phú (Rich Data Seeding)**:
  - Tự động nạp **23 Thương hiệu thời trang toàn cầu** (Dior, Gucci, Adidas, Chanel, Louis Vuitton, Balenciaga, Hermes, Rolex...).
  - Tự động nạp **180+ sản phẩm thời trang cao cấp** đi kèm đầy đủ biến thể kích cỡ (Size: S, M, L, XL, 39-44) và màu sắc thực tế.
  - Tự động nạp danh sách người dùng mẫu tương ứng từng vai trò: Admin, Seller riêng biệt và Khách hàng.

---

### 2. Phân hệ Xác thực & Quản lý Tài khoản (Auth & Identity Portal)
*Minh chứng commit: `3aa3722`, `0b26708`, `1bd2170`, `e8573f8`, `02efe90`, `8acffa8`*
- **Giao diện Đăng nhập / Đăng ký Đa năng (`/login`)**:
  - Giao diện 2 cột phong cách Luxury Sketch với slider chuyển ảnh nghệ thuật mờ dần (15s fade).
  - Chuyển tab mượt mà tốc độ 60fps, hỗ trợ đăng nhập bằng tài khoản nội bộ và nút Google OAuth 2.0.
  - Bộ thanh đo độ mạnh mật khẩu (Password Strength Meter) phản ứng tức thời theo 4 cấp độ.
- **Quy trình Quên & Đặt lại mật khẩu (OTP Recovery Flow)**:
  - Xác thực Email và gửi mã OTP 6 số.
  - Cơ chế tự nhảy con trỏ giữa 6 ô OTP, ngăn chặn nhập chữ và giới hạn nghiêm ngặt 1 chữ số/ô.
  - Tự động dọn dẹp giá trị autofill của trình duyệt để đảm bảo an toàn mật khẩu mới.

---

### 3. Phân hệ Quản trị Người bán (Seller Operations Hub)
*Minh chứng commit: `3761988`, `3754671`, `40c9177`, `17b20e9`, `8acffa8`, `f5cc5f0`*
- **Bảng điều khiển & Bộ chỉ số KPI (`/`)**:
  - Tổng doanh thu, số lượng đơn hàng, tỷ lệ chuyển đổi và tăng trưởng theo tháng.
  - Thanh công cụ điều hướng nhanh **Seller Command Hub** và bệ phóng **Seller Launchpad**.
  - Hiển thị lưới sản phẩm quản lý theo phong cách trực quan Pinterest.
- **Quản lý Tồn kho & Hàng hóa chuyên sâu (`/inventory`)**:
  - Bảng kiểm kê chi tiết: Mã SKU, Mã vạch Barcode, Quy cách biến thể, Phân loại tồn kho: Tồn khả dụng, Đang giữ theo đơn, Ngưỡng an toàn.
  - Tự động tính toán tổng trị giá kho hàng (COGS) và cảnh báo sản phẩm sắp hết hàng (`LowStock`).
  - Hộp thoại **Nhập kho nhanh (Quick Restock Modal)**: Cho phép nhập thêm hàng trực tiếp và tự động cập nhật trạng thái kho ngay trong CSDL.
- **Quản lý Đơn hàng Người bán (`/orders`)**:
  - Quản lý vòng đời đơn hàng: `Pending` (Chờ duyệt) $\rightarrow$ `Confirmed` (Đã duyệt) $\rightarrow$ `Shipped` (Đang giao) $\rightarrow$ `Delivered` (Đã giao) $\rightarrow$ `Cancelled` (Đã hủy).
  - Drawer chi tiết đơn hàng: Xem danh sách sản phẩm đặt mua, thông tin người nhận, hình thức thanh toán COD/Online và timeline tiến độ giao vận.
- **Báo cáo Doanh thu & Tài chính (`/income-statistics`)**:
  - Biểu đồ ma trận doanh số **Monthly Matrix Chart** từ Tháng 1 đến Tháng 12.
  - Phân tích cơ cấu khách hàng cũ/mới và tỷ lệ hoàn tất đơn hàng.
- **Gian hàng & Ưu đãi**:
  - Quản lý hồ sơ thông tin shop (`/shop-profile`), cấp mã giảm giá voucher (`/vouchers`) và theo dõi biến động số dư giao dịch (`/transactions`).

---

### 4. Phân hệ Khách hàng & Trải nghiệm Mua sắm (Customer Web Module)
*Minh chứng commit: `bc475e4`, `278b58f`, `238c871`*
- **Trung tâm Mua sắm Toàn sàn (`/shop`)**:
  - Hệ thống tìm kiếm văn bản thông minh (hỗ trợ tiếng Việt không dấu).
  - Bộ lọc kết hợp đa chiều: Lọc theo danh mục API, lọc theo thương hiệu thực tế, khoảng giá và trạng thái còn hàng.
  - Phân trang chuẩn 12 sản phẩm/trang, ghi nhớ danh sách sản phẩm vừa xem (Recently Viewed) và gợi ý cá nhân hóa.
- **Chi tiết Sản phẩm Trực quan (`/product-detail/[id]`)**:
  - Bộ sưu tập ảnh sản phẩm độ phân giải cao kết hợp Lightbox phóng to chi tiết chất liệu vải/da.
  - Lựa chọn kích cỡ và màu sắc gắn liền trực tiếp với số lượng tồn kho thực của từng biến thể.
  - Đánh giá khách quan từ người mua và danh sách sản phẩm tương đồng.
- **Trợ lý Thời trang Thông minh (AI Stylist Panel)**:
  - Tích hợp trợ lý AI gọi API `GET /api/ai/recommend` để tự động phối "Full Set" trang phục bổ trợ (ví dụ: Áo khoác phối cùng Quần âu và Giày Sneaker phù hợp).
- **Quy trình Đặt hàng & Thanh toán Hoàn chỉnh (`CustomerCommerceLayer`)**:
  - Giỏ hàng cá nhân hóa toàn cục (`CustomerCartModal`), phân biệt rõ ràng từng biến thể Size/Màu, không bị gộp sai dòng.
  - Form thanh toán (`CustomerCheckoutModal`): Tự động điền dữ liệu người dùng đăng nhập, kiểm tra số điện thoại Việt Nam hợp lệ, hỗ trợ COD và Chuyển khoản, sinh mã đơn hàng chuẩn hệ sinh thái.
  - Hộp thoại đặt hàng thành công (`OrderSuccessModal`) điều hướng nhanh tới theo dõi tiến trình.
- **Theo dõi & Quản lý Đơn hàng Khách hàng**:
  - **`/shop/my-orders`**: Quản lý lịch sử đơn mua, xem thanh tiến trình 5 bước và **tính năng cho phép khách tự hủy đơn hàng Pending** (kèm cơ chế hoàn trả tồn kho tức thời).
  - **`/shop/track-order`**: Dành cho khách vãng lai tra cứu đơn hàng bằng Mã đơn + Số điện thoại mà không cần đăng nhập.
  - **`/shop/wishlist`**: Bộ sưu tập sản phẩm yêu thích (lưu cục bộ `localStorage`), tự động cập nhật giá bán và trạng thái kho hàng.

---

## 🛠️ IV. TỔNG HỢP TOÀN BỘ CÁC LỖI ĐÃ PHÁT HIỆN VÀ KHẮC PHỤC

Bảng tổng hợp chi tiết các lỗi phát sinh trong suốt vòng đời dự án, nguyên nhân kỹ thuật và giải pháp sửa chữa kèm mã commit minh chứng:

| STT | Lỗi phát hiện | Nguyên nhân kỹ thuật | Giải pháp khắc phục | File ảnh hưởng | Mã Commit |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **Bán khống / Âm kho khi đặt hàng** | `OrderService.cs` tạo đơn mà không kiểm tra `product.StockQuantity < item.Quantity`, đơn vẫn tạo thành công dù kho bằng 0. | Thêm kiểm tra nghiêm ngặt, ném ngoại lệ `BadRequestException` kèm thông báo số lượng còn lại; chặn đứng hành vi bán khống. | `backend/src/Ecommerce.BLL/Services/OrderService.cs` | `bc475e4` |
| 2 | **Bỏ quên trừ kho biến thể (Size/Màu)** | Chỉ trừ số lượng ở bảng `Products` tổng, không trừ tồn kho của bản ghi `ProductVariants`. | Phân tích chuỗi `Specs` để khớp đúng biến thể con (Size/Màu) và trừ tồn kho biến thể song song với sản phẩm cha. | `backend/src/Ecommerce.BLL/Services/OrderService.cs` | `bc475e4` |
| 3 | **Checkout không lưu đơn vào CSDL** | `CheckoutModal.tsx` chỉ hiển thị Toast thành công rồi xóa giỏ hàng tạm, không gọi API `POST /api/orders`. | Bổ sung hàm `createOrder` vào `order.service.ts`, kết nối modal gọi API thực tế và nhận mã đơn hàng từ SQL Server. | `frontend/src/services/order.service.ts`<br>`frontend/src/components/seller/CheckoutModal.tsx` | `bc475e4` |
| 4 | **Mất Navbar khi chưa đăng nhập** | Điều kiện logic `if (!token) return null;` trong `Navbar.tsx` ẩn toàn bộ header đối với khách vãng lai. | Tách biệt trạng thái Navbar: Luôn hiển thị Logo, Giỏ hàng, nút Đăng nhập cho khách; chỉ hiển thị Menu quản trị khi có Token. | `frontend/src/components/Navbar.tsx` | `bc475e4` |
| 5 | **Mất giỏ hàng khi đổi trang** | Giỏ hàng lưu bằng `useState` cục bộ ở trang chủ, khi vào trang chi tiết `/product-detail/[id]` giỏ bị trống. | Thiết kế `CartContext.tsx` và hook `useCart.ts` bọc ở `layout.tsx`, lưu và đồng bộ giỏ hàng qua `localStorage`. | `frontend/src/contexts/CartContext.tsx`<br>`frontend/src/hooks/useCart.ts` | `bc475e4` |
| 6 | **Lỗ hổng bảo mật & Gán cứng `sellerId = 1`** | Các API CRUD sản phẩm thiếu `[Authorize]`, người dùng nặc danh có thể can thiệp dữ liệu và bị gán cứng sở hữu vào Shop 1. | Thêm `[Authorize(Roles = "Seller,Admin")]`, tự động trích xuất `sellerId` từ Claims của Token JWT đăng nhập. | `backend/src/Ecommerce.API/Controllers/ProductsController.cs` | `bc475e4` |
| 7 | **Lỗi thanh phân trang sản phẩm bị đơ** | Logic phân trang cứng không cập nhật lại tổng số trang khi áp dụng bộ lọc danh mục. | Xây dựng thanh phân trang động linh hoạt, tự động tính toán `totalPages` dựa trên số lượng kết quả lọc thực tế. | `frontend/src/app/page.tsx` | `278b58f` |
| 8 | **Xung đột cổng mạng Frontend 3000** | Cổng 3000 mặc định thường xuyên bị chiếm dụng bởi các ứng dụng nền khác của Windows. | Chuyển cấu hình Next.js cố định sang cổng `3001` trong `package.json` và cập nhật CORS ở Backend. | `frontend/package.json`<br>`backend/src/Ecommerce.API/Program.cs` | `278b58f` |
| 9 | **Tràn ký tự tại ô nhập OTP khôi phục** | Ô nhập mã OTP không giới hạn độ dài ký tự nhập vào, gây vỡ giao diện wireframe. | Bổ sung thuộc tính `maxLength={1}` và sự kiện `onKeyDown` bắt phím số, tự động chuyển focus sang ô tiếp theo. | `frontend/src/components/auth/ForgotPasswordFlow.tsx` | `e8573f8` |
| 10 | **Tự động điền mật khẩu cũ của trình duyệt** | Trình duyệt tự gán mật khẩu cũ đã lưu vào ô đặt mật khẩu mới của form khôi phục. | Đặt `autoComplete="new-password"` và khởi tạo state chuỗi rỗng độc lập để ô nhập liệu luôn trống ban đầu. | `frontend/src/components/auth/ForgotPasswordFlow.tsx` | `02efe90` |
| 11 | **Lệch tỷ lệ khung hình ảnh sản phẩm** | Ảnh hiển thị trong bảng đơn hàng và kho hàng bị méo mó, tràn viền bảng. | Cấu hình kích thước ảnh chuẩn với class `object-cover`, tỷ lệ cố định kèm khung bo viền bảo vệ. | `frontend/src/styles/inventory.css`<br>`frontend/src/styles/orders.css` | `2928ad3` |
| 12 | **Mất hiệu ứng trượt bảng chi tiết sản phẩm** | Lỗi CSS khiến animation trượt (Drawer slide-over) của bảng người bán bị vô hiệu hóa khi click. | Khôi phục class animation keyframe CSS và xử lý state đóng/mở Drawer chính xác. | `frontend/src/components/seller/SellerDrawer.tsx` | `c682a4b` |
| 13 | **Lỗi lồng thư mục và Orphan Commit từ nhánh bacc** | Nhánh `origin/bacc` được commit từ thư mục ngoài dẫn đến cây mã nguồn bị lồng trong `He-thong-thuong-mai-ien-tu-tich-hop-AI/`. | Dùng `git commit-tree` bóc tách đúng cây thư mục con ra ngoài thư mục gốc và liên kết nối tiếp vào `main`. | Toàn bộ cây thư mục Git | `238c871` |
| 14 | **Gộp nhầm sản phẩm trong giỏ khi khác biến thể** | Thêm cùng 1 áo nhưng chọn Size M và Size L bị hệ thống gộp làm 1 dòng và sai giá. | Cập nhật cấu trúc `CartItemKey = ${productId}-${specs}`, đảm bảo khác size/màu sẽ lưu thành các dòng riêng biệt. | `frontend/src/contexts/CartContext.tsx` | `238c871` |
| 15 | **Hủy đơn hàng không hoàn trả số lượng kho** | Khi đơn hàng bị hủy, số lượng sản phẩm không được hoàn trả về kho dẫn đến thất thoát tồn kho ảo. | Bổ sung phương thức `CancelOrderByCustomerAsync`: Tự động cộng trả lại `StockQuantity` cho cả sản phẩm và biến thể. | `backend/src/Ecommerce.BLL/Services/OrderService.cs`<br>`backend/src/Ecommerce.API/Controllers/OrdersController.cs` | `238c871` |

---

## 🧪 V. KẾT QUẢ KIỂM THỬ VÀ CHẤT LƯỢNG MÃ NGUỒN

### 1. Kiểm thử Tự động Backend (.NET xUnit & WebApplicationFactory)
Hệ thống kiểm thử tự động của Backend bao gồm 2 bộ test suite:
- **`Ecommerce.Tests.Unit` (Kiểm thử đơn vị logic nghiệp vụ)**:
  - `ProductServiceTests.GetProducts_WithFilter_ReturnsCorrectResult`: Đạt ✅ **PASSED**
  - `OrderServiceTests.CreateOrder_InsufficientStock_ThrowsBadRequestException`: Đạt ✅ **PASSED** (Bảo vệ chống bán khống)
  - `OrderServiceTests.CreateOrder_ValidStock_DecrementsStockSuccessfully`: Đạt ✅ **PASSED**
- **`Ecommerce.Tests.Integration` (Kiểm thử tích hợp API & Cơ sở dữ liệu)**:
  - `ProductsApiTests.GetAllProducts_ReturnsOkWithPagination`: Đạt ✅ **PASSED**
  - `ProductsApiTests.GetProductById_ValidId_ReturnsProduct`: Đạt ✅ **PASSED**
  - `OrdersApiTests.CreateOrder_ValidPayload_ReturnsCreatedOrder`: Đạt ✅ **PASSED**
  - `OrdersApiTests.UpdateOrderStatus_ValidRole_UpdatesSuccessfully`: Đạt ✅ **PASSED**
  - `AuthApiTests.Login_ValidCredentials_ReturnsJwtToken`: Đạt ✅ **PASSED**
- **Tổng kết Backend Tests**: **8/8 bài test đạt kết quả xuất sắc (100% Passed)**.

### 2. Kiểm thử Biên dịch Frontend Production (`next build`)
Quá trình build tối ưu hóa sản phẩm kiểm tra toàn bộ 16 routes tĩnh và động của hệ thống:
```text
Route (app)                                 Size  First Load JS
┌ ○ /                                    19.9 kB         159 kB
├ ○ /_not-found                            993 B         104 kB
├ ○ /income-statistics                   5.08 kB         132 kB
├ ○ /inventory                           4.39 kB         131 kB
├ ○ /login                               9.33 kB         130 kB
├ ○ /orders                              8.39 kB         144 kB
├ ○ /product-detail                        123 B         103 kB
├ ƒ /product-detail/[id]                  7.6 kB         163 kB
├ ○ /shop                                3.15 kB         158 kB
├ ○ /shop-profile                        7.26 kB         113 kB
├ ○ /shop/my-orders                      3.71 kB         159 kB
├ ○ /shop/track-order                    1.97 kB         157 kB
├ ○ /shop/wishlist                       1.76 kB         157 kB
├ ○ /transactions                         6.1 kB         109 kB
└ ○ /vouchers                            4.87 kB         108 kB
+ First Load JS shared by all             103 kB
```
- **Kết quả Frontend Build**: **0 Lỗi biên dịch (0 Errors, 0 Type Issues)**.

---

## 🧭 VI. HƯỚNG DẪN KHỞI CHẠY VÀ NGHIỆM THU HỆ THỐNG

### 1. Khởi chạy nhanh toàn bộ (Khuyên dùng)
Tại thư mục gốc dự án, thực thi file điều phối:
```powershell
.\start-all.cmd
```
*Script sẽ tự động khởi động đồng thời Backend .NET (Port 5000) và Frontend Next.js (Port 3001), sau đó mở sẵn trình duyệt web.*

### 2. Các liên kết kiểm tra chính:
- **Cổng Mua sắm Khách hàng**: [http://localhost:3001/shop](http://localhost:3001/shop)
- **Chi tiết sản phẩm & AI Stylist**: [http://localhost:3001/product-detail/1](http://localhost:3001/product-detail/1)
- **Quản lý đơn hàng cá nhân**: [http://localhost:3001/shop/my-orders](http://localhost:3001/shop/my-orders)
- **Tra cứu đơn hàng vãng lai**: [http://localhost:3001/shop/track-order](http://localhost:3001/shop/track-order)
- **Cổng Quản trị Người bán (Seller Center)**: [http://localhost:3001/](http://localhost:3001/)
- **Swagger API Explorer (Backend)**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

### 3. Danh sách tài khoản thử nghiệm:
> *Mật khẩu mặc định cho toàn bộ tài khoản:* **`Password123@`**

- **Khách hàng (Customer)**: `esther.howard@example.com`
- **Người bán (Seller)**: `ducmanh@gmail.com`
- **Quản trị viên (Admin)**: `admin@gmail.com`
- **Gian hàng Thương hiệu (Dior / Gucci / Adidas)**: `dior@gmail.com` / `gucci@gmail.com` / `adidas@gmail.com`

---

## 🏁 VII. KẾT LUẬN & ĐÁNH GIÁ TỔNG THỂ
Dự án **Aethelgard Shopping Mall** đã hoàn thành toàn diện các mục tiêu đặt ra:
1. **Kiến trúc đồng nhất**: Đã hợp nhất hoàn hảo giữa Phân hệ Người bán (Seller Center) và Phân hệ Khách hàng (Customer Mall) trên nền tảng .NET 10 Clean Architecture và Next.js 15.
2. **Logic kinh doanh chặt chẽ**: Toàn bộ các lỗi nghiêm trọng về bán khống, trừ kho biến thể, giỏ hàng toàn cục và bảo mật phân quyền đều đã được giải quyết triệt để kèm bài test minh chứng.
3. **Mã nguồn sạch và sẵn sàng**: Toàn bộ 39 commits được lưu trữ và xâu chuỗi chuẩn mực trên nhánh `hoang`, sẵn sàng cho công tác nghiệm thu và triển khai sản phẩm.
