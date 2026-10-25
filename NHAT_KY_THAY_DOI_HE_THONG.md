# 📝 NHẬT KÝ THAY ĐỔI HỆ THỐNG (SYSTEM CHANGELOG)
## CÁC NÂNG CẤP, TÍNH NĂNG MỚI VÀ SỬA LỖI GẦN ĐÂY
*Dự án: Hệ thống Thương mại Điện tử Thời trang Cao cấp Aethelgard Mall*

---

## 📌 I. BẢNG TỔNG HỢP NHANH CÁC THAY ĐỔI GẦN ĐÂY

| STT | Phân Hệ / Thành Phần | Vấn Đề Phát Sinh / Yêu Cầu Thay Đổi | Giải Pháp Đã Thực Hiện | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Backend Logic (`OrderService`)** | Bán khống / Âm kho khi đặt hàng vượt số lượng tồn thực tế | Bổ sung kiểm tra nghiêm ngặt, trừ kho sản phẩm tổng và biến thể size/màu | ✅ Đã Fix |
| 2 | **Frontend (`CheckoutModal`)** | Bấm Đặt hàng chỉ hiện Toast, không lưu đơn vào CSDL | Kết nối API `POST /api/orders`, lưu đơn thật vào SQL Server, sinh mã đơn | ✅ Đã Fix |
| 3 | **Frontend Layout (`Navbar`)** | Khách vãng lai bị ẩn mất Logo, Giỏ hàng và nút Đăng nhập | Tách biệt giao diện: Luôn hiển thị Navbar, chỉ hiện menu quản trị khi có Token | ✅ Đã Fix |
| 4 | **Frontend State (`CartContext`)** | Giỏ hàng bị trống khi chuyển giữa các trang sản phẩm | Xây dựng Context giỏ hàng toàn cục, đồng bộ tự động với `localStorage` | ✅ Đã Fix |
| 5 | **Frontend Giỏ hàng** | Gộp nhầm sản phẩm vào 1 dòng khi khác biến thể Size/Màu | Cập nhật khóa phân biệt dòng: `${productId}-${specs}` | ✅ Đã Fix |
| 6 | **Backend Nghiệp vụ Đơn** | Khách hủy đơn không được hoàn trả lại số lượng tồn kho | Bổ sung hàm `CancelOrderByCustomerAsync` tự động hoàn kho trong transaction | ✅ Đã Fix |
| 7 | **Frontend Phân trang** | Thanh phân trang 1..10 bị đơ, không chuyển được trang sản phẩm | Viết lại logic phân trang động `slice(0, 12)`, tự tính tổng số trang linh hoạt | ✅ Đã Fix |
| 8 | **Frontend Tìm kiếm** | Khung gợi ý tìm kiếm bị che khuất chữ, đè layer giao diện | Tăng `z-index: 50`, `max-height: 420px`, cuộn mượt và chuẩn hóa khung hiển thị | ✅ Đã Fix |
| 9 | **Biểu đồ Thiết kế** | Sơ đồ Mermaid bị lẹm viền, ảnh 05 dẹt ngang chữ bé li ti | Tái cấu trúc phân cấp dọc, sơ đồ 4 cột tỷ lệ 16:9, xuất Retina 2x sắc nét | ✅ Đã Fix |
| 10 | **Hạ tầng Triển khai** | Cài đặt môi trường phức tạp, phụ thuộc công cụ cục bộ | Xây dựng `Dockerfile` đa tầng và `docker-compose.yml` chạy trọn gói | ✅ Đã Xong |
| 11 | **Tích hợp Khách hàng** | Thiếu các màn hình mua sắm, theo dõi và quản lý đơn cho khách | Tích hợp trọn bộ: `/shop`, `/product-detail/[id]`, `/shop/my-orders`, `/shop/track-order`, `/shop/wishlist` | ✅ Đã Xong |
| 12 | **Tích hợp Trợ lý AI** | Cần giải pháp tư vấn phong cách số và tạo mô tả hàng hiệu | Tích hợp Google Gemini AI (`gemini-3-flash-preview`), cache 6h, fallback 100% | ✅ Đã Xong |

---

## 🛠️ II. CHI TIẾT CÁC LỖI KỸ THUẬT ĐÃ KHẮC PHỤC

### 1. Sửa Lỗi Bán Khống / Âm Kho Khi Đặt Hàng
* **Nguyên nhân**: Trong `OrderService.cs`, quá trình tạo đơn hàng không kiểm tra điều kiện `product.StockQuantity < item.Quantity`. Nếu khách đặt số lượng lớn hơn tồn kho thực tế, đơn hàng vẫn tạo thành công dù kho không đủ. Ngoài ra hệ thống chỉ trừ kho ở bảng `Products` tổng mà bỏ quên bảng biến thể con `ProductVariants`.
* **Cách khắc phục**:
  - Bổ sung kiểm tra trước khi tạo đơn: nếu thiếu hàng, lập tức ném ngoại lệ `BadRequestException` kèm thông báo chính xác số lượng tồn thực tế còn lại.
  - Phân tích trường `Specs` (size/màu) để tìm đúng bản ghi `ProductVariant` và trừ tồn kho song song.
  - Tự động cập nhật `StockStatus` sang `LowStock` ($\le 10$) hoặc `OutOfStock` ($= 0$).
* **Tệp ảnh hưởng**: `backend/src/Ecommerce.BLL/Services/OrderService.cs`.

### 2. Sửa Lỗi Checkout Không Lưu Đơn Vào CSDL
* **Nguyên nhân**: Trong `CheckoutModal.tsx`, khi khách bấm xác nhận đặt hàng, component chỉ kích hoạt thông báo Toast thành công rồi xóa giỏ hàng tạm, hoàn toàn chưa gọi API xuống máy chủ.
* **Cách khắc phục**:
  - Bổ sung hàm `createOrder(data)` trong `order.service.ts` gọi `POST /api/orders`.
  - Nối form thanh toán với API: thu thập Họ tên, SĐT, Email, Địa chỉ, Phương thức thanh toán (COD / Chuyển khoản) và nhận mã đơn hàng thực tế dạng `AG-2026-XXXX`.
* **Tệp ảnh hưởng**: `frontend/src/services/order.service.ts`, `frontend/src/components/seller/CheckoutModal.tsx`.

### 3. Sửa Lỗi Ẩn Thanh Navbar Đối Với Khách Chưa Đăng Nhập
* **Nguyên nhân**: Điều kiện `if (!token) return null;` trong `Navbar.tsx` làm ẩn toàn bộ thanh điều hướng khi người dùng là khách vãng lai chưa có JWT Token.
* **Cách khắc phục**:
  - Tách trạng thái Navbar: Khách vãng lai vẫn nhìn thấy Logo, liên kết Cửa Hàng, Giỏ Hàng có số lượng Badge và nút Đăng Nhập.
  - Chỉ hiển thị menu quản trị (Tồn kho, Đơn hàng, Doanh thu, Hồ sơ Shop) khi tài khoản đã đăng nhập với vai trò Seller/Admin.
* **Tệp ảnh hưởng**: `frontend/src/components/Navbar.tsx`.

### 4. Sửa Lỗi Giỏ Hàng Bị Mất Khi Chuyển Màn Hình
* **Nguyên nhân**: State giỏ hàng được quản lý bằng `useState` cục bộ tại `page.tsx`. Khi người dùng điều hướng sang trang chi tiết sản phẩm `/product-detail/[id]` và thêm hàng, giỏ hàng ở trang chủ bị mất dữ liệu.
* **Cách khắc phục**:
  - Xây dựng Context giỏ hàng toàn cục `CartContext.tsx` và custom hook `useCart.ts` bọc ở layout gốc `layout.tsx`.
  - Tự động đồng bộ hóa hai chiều với `localStorage` (`aethelgard_cart`), bảo toàn dữ liệu sau khi tải lại trang.
* **Tệp ảnh hưởng**: `frontend/src/contexts/CartContext.tsx`, `frontend/src/hooks/useCart.ts`.

### 5. Sửa Lỗi Gộp Nhầm Dòng Trong Giỏ Khi Khác Biến Thể Size / Màu
* **Nguyên nhân**: Giỏ hàng dùng `item.id` (mã sản phẩm cha) làm khóa nhận diện. Khi mua cùng 1 mẫu áo nhưng chọn Size M và Size L, hệ thống gộp làm 1 dòng và áp sai giá.
* **Cách khắc phục**:
  - Đổi cấu trúc khóa định danh dòng sang: `CartItemKey = ${productId}-${specs}`.
  - Khác size hoặc khác màu sẽ tự động tách thành các dòng mặt hàng riêng biệt.
* **Tệp ảnh hưởng**: `frontend/src/contexts/CartContext.tsx`.

### 6. Khắc Phục Khách Hủy Đơn Không Được Hoàn Trả Tồn Kho
* **Nguyên nhân**: Trước đây khi đơn hàng bị hủy, số lượng sản phẩm không được cộng hoàn trả lại về kho, dẫn đến thất thoát số liệu tồn kho ảo.
* **Cách khắc phục**:
  - Bổ sung phương thức `CancelOrderByCustomerAsync` trong `OrderService.cs` và endpoint `POST /api/orders/{id}/cancel`.
  - Khách hàng có thể tự hủy đơn ở trạng thái `Pending`. Hệ thống tự động kích hoạt transaction cộng trả lại đúng số lượng cho cả sản phẩm tổng và biến thể size/màu trong CSDL.
* **Tệp ảnh hưởng**: `backend/src/Ecommerce.BLL/Services/OrderService.cs`, `backend/src/Ecommerce.API/Controllers/OrdersController.cs`.

### 7. Sửa Lỗi Thanh Phân Trang Sản Phẩm Bị Đơ
* **Nguyên nhân**: Các nút `1 2 3 ... 10` dưới chân danh mục được viết tĩnh (`hardcoded`), không có state quản lý trang và danh sách sản phẩm không được phân trang (`slice`).
* **Cách khắc phục**:
  - Thêm state `currentPage` (mặc định 1), `itemsPerPage = 12`, tính động `totalPages = Math.ceil(filtered.length / 12)`.
  - Cắt mảng hiển thị chuẩn 12 sản phẩm/trang, tự động chuyển về trang 1 khi đổi bộ lọc hoặc tìm kiếm.
  - Tự động cuộn mượt (`scrollIntoView`) lên đầu danh mục khi chuyển trang.
* **Tệp ảnh hưởng**: `frontend/src/app/page.tsx`.

### 8. Khắc Phục Khung Gợi Ý Tìm Kiếm (Autocomplete) Bị Che Khuất
* **Nguyên nhân**: Hộp thoại dropdown gợi ý khi gõ tìm kiếm bị đè lớp bởi các thành phần bên dưới hoặc bị giới hạn bởi thuộc tính `overflow` của Hero Section, làm mất chữ và giá sản phẩm.
* **Cách khắc phục**:
  - Thiết lập lớp nổi `z-index: 50`, `box-shadow` mềm và nền kính mờ `backdrop-blur-xl`.
  - Giới hạn chiều cao `max-height: 420px` kèm thanh cuộn mượt tự nhiên `overflow-y: auto`.
  - Chuẩn hóa thẻ sản phẩm: ảnh thumbnail tỷ lệ $1:1$, hiển thị rõ nhãn thương hiệu và giá niêm yết tương phản cao.
* **Tệp ảnh hưởng**: `frontend/src/components/seller/HeroSection.tsx`.

### 9. Khắc Phục Biểu Đồ Thiết Kế Hệ Thống Bị Lẹm Chữ & Dẹt Ngang
* **Nguyên nhân**: Ảnh 02 (Kiến trúc Backend) dàn ngang khiến mũi tên đan chéo và chữ bị lẹm viền; Ảnh 05 (FDD) dàn ngang 18 ô con tạo thành một dải băng dẹt tỷ lệ 20:1 với chữ bé li ti không thể đọc được.
* **Cách khắc phục**:
  - Thiết kế lại Ảnh 02 theo luồng dọc phân cấp từ trên xuống (`API -> BLL -> DAL -> Common`).
  - Tái cấu trúc Ảnh 05 thành mô hình 4 cột dọc cân đối tỷ lệ chuẩn 16:9 (*Khách hàng*, *Người bán*, *Quản trị*, *Hạ tầng & Bảo mật*).
  - Việt hóa 100% thuật ngữ, xuất ảnh Retina 2x có padding 35px chống mất nét.
  - Xóa 16 file `.svg` trùng lặp, nhúng trực tiếp 16 ảnh `.png` tiêu chuẩn vào markdown.
* **Tệp ảnh hưởng**: `BAO_CAO_THIET_KE_HE_THONG.md`, `docs/diagrams/*.png`.

---

## 🚀 III. CÁC NÂNG CẤP & TÍNH NĂNG MỚI DẠO GẦN ĐÂY

### 1. Hợp Nhất Hoàn Chỉnh Phân Hệ Khách Hàng (Customer Module)
* Tích hợp thành công mã nguồn từ nhánh `bacc` vào nhánh chính `hoang` sau khi xử lý triệt để lỗi lồng thư mục:
  - **`/shop`**: Trung tâm mua sắm toàn sàn với bộ lọc đa tiêu chí (danh mục, thương hiệu, khoảng giá, trạng thái kho).
  - **`/product-detail/[id]`**: Trưng bày ảnh chất lượng cao kèm Lightbox zoom, chọn size/màu theo tồn kho thật.
  - **`/shop/my-orders`**: Quản lý lịch sử đơn mua với thanh tiến trình 5 bước và nút tự hủy đơn `Pending`.
  - **`/shop/track-order`**: Cổng tra cứu vận đơn vãng lai bằng Mã đơn + SĐT không cần đăng nhập.
  - **`/shop/wishlist`**: Danh sách sản phẩm yêu thích lưu trữ cục bộ.

### 2. Tích Hợp Trợ Lý Thời Trang Trí Tuệ Nhân Tạo (Google Gemini AI)
* **Aethelgard AI Stylist** (`GET /api/ai/recommend`):
  - Phân tích ngữ cảnh sản phẩm kết hợp kịch bản prompt thời trang (*Dạ tiệc*, *Streetwear*, *Smart Casual*...).
  - Tự động gợi ý set đồ bổ trợ chéo danh mục (Complementary Outfits) và nút 1-click thêm trọn bộ vào giỏ hàng.
* **AI Product Content Generator** (`POST /api/ai/generate-description`):
  - Hỗ trợ người bán tự động tạo tiêu đề SEO, mô tả phong cách thượng lưu, thông tin chất liệu và hướng dẫn bảo quản.
* **Cơ chế vận hành an toàn**:
  - Bộ đệm `IMemoryCache` lưu trữ 6 giờ, giảm 85% request gọi API ngoài.
  - Cơ chế Heuristic Fallback cam kết khả năng phản hồi 100% kể cả khi không có kết nối internet.

### 3. Khung Đóng Gói Ứng Dụng Độc Lập Bằng Docker Compose
* **`backend/Dockerfile`**: Đóng gói Web API .NET 10 theo cơ chế Multi-stage Build (SDK biên dịch $\rightarrow$ ASP.NET Runtime siêu nhẹ).
* **`frontend/Dockerfile`**: Đóng gói Next.js 15 trên nền Node.js 20 Alpine với Standalone Output tối ưu dung lượng.
* **`docker-compose.yml`**: Khởi chạy toàn bộ cụm dịch vụ qua 1 lệnh `docker compose up --build`, phân vùng lưu trữ CSDL SQLite bền vững `sqlite_data` và kết nối mạng nội bộ cô lập `aethelgard-network`.

### 4. Gia Cố Bảo Mật & Phân Quyền Multi-tenant
* Thêm attribute `[Authorize(Roles = "Seller,Admin")]` cho toàn bộ các API nhạy cảm: sửa/xóa sản phẩm, cập nhật trạng thái đơn hàng, nhập kho hàng.
* Trích xuất `sellerId` tự động từ JWT Token Claims thay vì gán cứng số `1`.
* Cơ chế kiểm tra quyền sở hữu (Owner check): Người bán chỉ có quyền can thiệp vào dữ liệu thuộc gian hàng của mình.

---

## 📊 IV. BẢNG TỔNG KẾT TRẠNG THÁI KIỂM THỬ

| Hạng Mục Kiểm Thử | Công Cụ Thực Hiện | Số Lượng Test | Kết Quả |
| :--- | :--- | :---: | :---: |
| **Kiểm thử đơn vị (Unit Tests)** | .NET xUnit (`Ecommerce.Tests.Unit`) | 3/3 bài kiểm thử | ✅ **100% PASSED** |
| **Kiểm thử tích hợp (Integration Tests)** | WebApplicationFactory (`Ecommerce.Tests.Integration`) | 5/5 bài kiểm thử | ✅ **100% PASSED** |
| **Biên dịch Frontend Production** | Next.js Build (`npm run build`) | 16/16 Routes | ✅ **0 Lỗi (0 Errors)** |
| **Kiểm thử Chống bán khống** | API POST `/api/orders` với số lượng vượt kho | 1 kịch bản | ✅ **HTTP 400 Bad Request** |
| **Kiểm thử Hoàn kho khi hủy đơn** | API POST `/api/orders/{id}/cancel` | 1 kịch bản | ✅ **Hoàn kho 100% thành công** |
