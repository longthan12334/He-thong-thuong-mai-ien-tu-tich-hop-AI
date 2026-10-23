# BÁO CÁO HIỆN TRẠNG VÀ TÍNH NĂNG HỆ THỐNG
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI (AETHELGARD MALL)

---

## 📌 I. TỔNG QUAN HỆ THỐNG

### 1. Giới thiệu dự án
**Aethelgard Mall** là nền tảng thương mại điện tử chuyên biệt dành cho ngành thời trang, giày sneaker và phụ kiện cao cấp (Luxury & Streetwear). Hệ thống được thiết kế theo mô hình đa người bán (Multi-vendor Marketplace), cho phép các thương hiệu thời trang chính hãng (Gucci, Dior, Adidas, Nike, Burberry, Chanel...) mở gian hàng Flagship, tiếp cận khách hàng cao cấp và vận hành kinh doanh tự động hóa.

### 2. Ngăn xếp công nghệ cốt lõi
* **Backend**:
  - Nền tảng: **ASP.NET Core Web API (.NET 10)**.
  - Kiến trúc: **Clean Architecture (3-Tier)** phân tách rõ ràng `API - BLL - DAL - Common`.
  - Cơ sở dữ liệu: **Microsoft SQL Server (MSSQL Express)** với **Entity Framework Core (Code-First & Migrations)**.
  - Mẫu thiết kế dữ liệu: **Unit of Work & Generic Repository Pattern**.
  - Xác thực & Bảo mật: **JWT (JSON Web Token)**, băm mật khẩu chuẩn **BCrypt.Net-Next**, phân quyền theo vai trò (**Role-based Authorization**).
* **Frontend**:
  - Framework: **Next.js 15 (App Router)** với **React 19 & TypeScript**.
  - Styling: **Tailwind CSS**, hệ thống biến màu sắc CSS Design System và Lucide React Icons.
  - Quản lý trạng thái (State Management): **React Context API** (`AuthContext`, `CartContext`, `ToastContext`), đồng bộ tức thời với `localStorage`.
  - Giao tiếp dữ liệu: **Service Layer & RESTful API Client**.

---

## 🏢 II. PHÂN HỆ NGƯỜI BÁN (SELLER / CHỦ SHOP)

Phân hệ Seller cung cấp bộ công cụ quản trị kinh doanh số toàn diện (Merchant Operations Hub) phục vụ việc quản lý hàng tồn, xử lý đơn hàng và theo dõi tài chính.

### 1. Xác thực và Phân quyền Gian hàng
* **Đăng nhập & Nhận diện tự động**:
  - Seller đăng nhập bằng tài khoản được cấp quyền (`Role: Seller`). Hệ thống sinh mã JWT Token chứa Claims mã định danh người dùng (`sub` / `NameIdentifier`) và vai trò.
  - Phân hệ quản trị tự động gắn bộ lọc sản phẩm theo đúng `sellerId` của shop đang đăng nhập (ví dụ: Chủ shop Nguyễn Đức Mạnh quản lý bộ sưu tập 20 sản phẩm riêng biệt).
* **Bảo mật dữ liệu sở hữu**:
  - Hệ thống kiểm soát quyền sở hữu đa tầng tại Backend: Chủ shop chỉ có quyền sửa, xóa sản phẩm và cập nhật đơn hàng thuộc cửa hàng của chính mình, ngăn chặn triệt để hành vi can thiệp trái phép vào dữ liệu của shop khác.

### 2. Quản lý Tồn kho & Hàng hóa (`/inventory`)
* **Hệ thống thẻ chỉ số kho thời gian thực (Inventory KPIs)**:
  - **Tổng mã SKU**: Tổng số lượng mã sản phẩm đang lưu hành trên sàn.
  - **Tổng hàng lưu kho**: Tổng số lượng đơn vị sản phẩm vật lý còn lại trong kho.
  - **Cảnh báo tồn thấp (Low Stock Alert)**: Đếm tự động các mặt hàng có số lượng tồn kho chạm hoặc thấp hơn ngưỡng an toàn (`Safety Threshold`), hiển thị nổi bật màu hổ phách cảnh báo.
  - **Tổng trị giá tồn kho (COGS)**: Tự động định giá toàn bộ tài sản kho hàng dựa trên giá vốn hàng bán (Cost of Goods Sold).
* **Bảng kiểm kê đa chiều (Inventory Table)**:
  - Chi tiết từng mặt hàng: Ảnh đại diện sản phẩm, Danh mục thời trang, Mã SKU, Mã vạch Barcode, Quy cách biến thể (Size/Màu sắc).
  - Theo dõi 3 trạng thái tồn kho: **Tồn khả dụng** (Available Stock), **Đang giữ theo đơn** (Reserved Stock), và **Ngưỡng an toàn** (Threshold).
  - Nhãn trạng thái trực quan: *Còn Hàng* (`IN_STOCK`), *Sắp Hết* (`LOW_STOCK`), *Hết Hàng* (`OUT_OF_STOCK`).
* **Quy trình Nhập kho nhanh (Quick Restock Modal)**:
  - Cho phép chủ shop chọn sản phẩm và nhập thêm số lượng trực tiếp qua giao diện tương tác.
  - Backend cập nhật tức thời số lượng tồn khả dụng trong CSDL, đồng thời tự động cập nhật lại nhãn trạng thái từ *Hết Hàng / Sắp Hết* thành *Còn Hàng*.
* **Bộ lọc & Tìm kiếm kho**:
  - Chuyển đổi tab nhanh: Tất cả, Còn hàng, Sắp hết, Hết hàng kèm số lượng thống kê theo từng tab.
  - Tìm kiếm tức thời theo tên sản phẩm, mã SKU hoặc mã vạch barcode.

### 3. Quản lý Đơn hàng Toàn diện (`/orders`)
* **Thẻ chỉ số hiệu suất vận hành (Order KPIs)**:
  - **Doanh thu chờ đối soát**: Tổng giá trị các đơn hàng đang trên đường vận chuyển.
  - **Đơn cần xử lý ngay**: Các đơn hàng mới ở trạng thái `PENDING` cần duyệt gấp.
  - **Đơn thành công**: Tổng số đơn đã bàn giao cho khách (`DELIVERED`).
  - **Tỷ lệ hủy đơn**: Tính toán tỷ lệ phần trăm đơn hoàn / đơn bị hủy.
* **Bảng theo dõi đơn hàng thời gian thực (Orders Table)**:
  - Hiển thị đầy đủ: Mã đơn hàng `#AG-XXXX`, Thời gian tạo, Thông tin khách hàng (Tên, SĐT), Chi tiết sản phẩm đầu tiên kèm số lượng các món kèm theo, Đơn vị vận chuyển (FedEx, GHN, Viettel Post...) kèm mã tracking code, Tổng tiền và phương thức thanh toán.
  - Nhãn trạng thái màu phân cấp rõ ràng: *Chờ Xác Nhận*, *Đã Xác Nhận*, *Đang Giao*, *Đã Giao*, *Đã Hủy*.
* **Drawer trượt kép tra cứu vận đơn (Dual-Panel Sliding Drawer)**:
  - Click vào bất kỳ hàng nào để mở khay trượt chi tiết:
    + **Panel trái (Vận đơn & Giao nhận)**: Hiển thị dòng thời gian hành trình đơn hàng (Timeline Milestone), mã vận đơn, hãng chuyển phát.
    + **Panel phải (Chi tiết đơn hàng & Khách hàng)**: Danh sách đầy đủ từng sản phẩm (ảnh, giá, số lượng), địa chỉ nhận hàng, phương thức thanh toán.
* **Quy trình xử lý đơn hàng**:
  - Chủ shop có các nút hành động trực tiếp: Duyệt đơn (`CONFIRMED`), Chuyển vận chuyển (`SHIPPED`), Hoàn tất đơn (`DELIVERED`), hoặc Hủy đơn (`CANCELLED`).
  - Thao tác gửi API lên Backend kiểm tra quyền và cập nhật trạng thái trong cơ sở dữ liệu.

### 4. Báo cáo & Thống kê Doanh thu (`/income-statistics`)
* **Biểu đồ ma trận doanh thu tháng (Monthly Matrix Chart)**: Trực quan hóa doanh thu theo từng tháng trong năm, hỗ trợ phân tích xu hướng kinh doanh theo mùa cao điểm và thấp điểm.
* **Đồng hồ đo tốc độ đạt mục tiêu (Needle Gauge Chart)**: Hiển thị trực quan tỷ lệ phần trăm hoàn thành chỉ tiêu doanh thu tháng của cửa hàng.
* **Bảng lịch sử giao dịch tài chính (Transactions Table)**:
  - Thống kê lịch sử biến động số dư, tiền về ví theo từng mã đơn hàng.
  - Phân loại rõ ràng: Đã đối soát, Đang chờ chuyển khoản, Khoản hoàn tiền.
  - Hỗ trợ xuất file báo cáo phục vụ kiểm toán tài chính nội bộ.

---

## 🛍️ III. PHÂN HỆ NGƯỜI MUA (CUSTOMER / KHÁCH HÀNG)

Phân hệ Người mua hướng tới trải nghiệm mua sắm xa xỉ (Luxury Boutique Shopping Experience), mượt mà từ khâu tìm kiếm sản phẩm đến thanh toán và theo dõi vòng đời đơn hàng.

### 1. Trung Tâm Mua Sắm Toàn Sàn (`/shop` & Trang Chủ)
* **Hero Banner tương tác**: Giới thiệu bộ sưu tập cao cấp mùa mới, tích hợp thanh tìm kiếm thông minh và nút cuộn mượt đến danh mục sản phẩm.
* **Bộ tìm kiếm gợi ý thông minh (Smart Search & Autocomplete)**:
  - Tự động gợi ý sản phẩm thời gian thực ngay khi người dùng gõ từ khóa.
  - Hỗ trợ tìm kiếm tiếng Việt không dấu, khớp theo tên sản phẩm, bộ sưu tập và danh mục thương hiệu.
  - Giao diện dropdown gợi ý được căn chỉnh layer nổi (`z-index: 50`), bóng đổ mềm, khoảng đệm thoáng đãng, hiển thị rõ ràng ảnh thu nhỏ, tên món đồ, danh mục và giá bán niêm yết mà không che khuất thông tin.
* **Bộ lọc đa tiêu chí kết hợp (Multi-faceted Filters)**:
  - Lọc theo danh mục thời trang: Áo khoác, Quần âu, Giày Sneaker, Túi xách, Phụ kiện xa xỉ.
  - Lọc theo thương hiệu Flagship chính hãng: Dior, Gucci, Adidas, Chanel, Louis Vuitton, Balenciaga...
  - Lọc nhanh: Hàng bán chạy nhất (`Bestseller`), Hàng đang giảm giá (`Discount`).
  - Lọc theo khoảng giá tùy biến (Min/Max Slider) và trạng thái còn hàng.
  - Sắp xếp linh hoạt: Mới nhất, Giá tăng dần, Giá giảm dần, Độ phổ biến.
* **Lưới sản phẩm cao cấp (Customer Product Card)**:
  - Hiển thị ảnh chất lượng cao, tên thương hiệu, huy hiệu đặc quyền (Chính hãng 100%, New Arrival), tỷ lệ giảm giá %, giá bán niêm yết và giá gạch chân.
  - Nút xem nhanh sản phẩm, nút thả tim yêu thích (Wishlist) và nút thêm nhanh vào giỏ hàng.
* **Thanh điều hướng phân trang động (Smart Dynamic Pagination)**:
  - Phân trang chuẩn 12 sản phẩm trên mỗi trang.
  - Tự động tính toán tổng số trang dựa trên kết quả lọc và tìm kiếm.
  - Tự sinh nút bấm thông minh kèm dấu `...` khi danh sách nhiều trang, hỗ trợ cuộn mượt mà lên đầu trang khi chuyển trang.

### 2. Trang Chi Tiết Sản Phẩm Chuẩn Flagship (`/product-detail/[id]`)
* **Trưng bày sản phẩm đa góc nhìn & Lightbox**:
  - Thư viện ảnh chi tiết góc rộng, hỗ trợ phóng to (Lightbox) kiểm tra từng đường kim mũi chỉ và bề mặt chất liệu vải/da.
  - Gắn nhãn bảo đảm nguyên seal và tem kiểm định chính hãng NFC quốc tế.
* **Lựa chọn cấu hình biến thể sản phẩm**:
  - Lựa chọn kích cỡ: 38 - 44 (Giày) hoặc S, M, L, XL (Trang phục) liên kết trực tiếp với số lượng tồn kho thực tế của từng biến thể (`ProductVariants`).
  - Lựa chọn màu sắc và chất liệu thực tế.
  - Bộ chọn số lượng mua với giới hạn tối đa theo tồn khả dụng trong kho.
* **Trợ lý phối đồ AI độc quyền (Aethelgard AI Stylist - Gemini AI)**:
  - Tích hợp mô hình AI Generative (Google Gemini) phân tích phong cách thiết kế của sản phẩm hiện tại để gợi ý phối đồ thời trang cá nhân hóa.
  - Các thẻ phong cách định sẵn (Prompt Chips): *Dạ tiệc thượng lưu*, *Dạo phố cuối tuần*, *Phong cách Smart Casual*, *Set đồ mùa đông*, *Tone-sur-tone lịch lãm*.
  - Ô nhập liệu cho phép khách hàng tự do nhập câu hỏi phối đồ theo hoàn cảnh riêng.
  - **Gợi ý hoàn thiện set đồ (Complementary Outfits)**: Tự động đề xuất các món đồ bổ trợ từ danh mục khác (ví dụ: đang xem Giày $\rightarrow$ gợi ý Áo khoác và Kính mát phù hợp).
  - Nút **"Thêm trọn bộ vào giỏ hàng"**: Cho phép thêm đồng thời cả set đồ gợi ý vào giỏ chỉ bằng 1 cú nhấp chuột.
* **Chính sách & Cam kết đặc quyền thương hiệu**:
  - Bồi hoàn 300% nếu phát hiện hàng không chính hãng.
  - Đóng hộp quà tặng cao cấp nguyên seal.
  - Dịch vụ giao hàng VIP tận tay và miễn phí đổi trả trong 7 ngày.

### 3. Giỏ Hàng Toàn Cục & Trải Nghiệm Thanh Toán
* **Lưu trữ liên thông (`CartContext.tsx`)**:
  - Quản lý State giỏ hàng tập trung, đồng bộ tức thời với `localStorage` (`aethelgard_cart`), bảo toàn dữ liệu xuyên suốt các trang và sau khi tải lại trình duyệt.
  - Khóa phân biệt biến thể chính xác (`${productId}-${specs}`): Cho phép mua cùng một mẫu áo với nhiều size/màu khác nhau thành từng dòng riêng biệt, không bị gộp sai dòng.
* **Hộp thoại thanh toán tinh gọn (`CheckoutModal.tsx`)**:
  - Thu thập thông tin giao nhận: Họ và tên người nhận, Số điện thoại, Email nhận thông báo, Địa chỉ giao hàng chi tiết.
  - Hỗ trợ phương thức thanh toán: **COD (Thanh toán khi nhận hàng)** hoặc **Chuyển khoản Ngân hàng**.
  - Tự động điền trước thông tin cá nhân đối với người dùng đã đăng nhập.
* **Kiểm soát tồn kho tức thời - Chống bán khống (Anti-Overselling Guard)**:
  - Ngay khi khách bấm *"Xác nhận đặt hàng"*, Backend kích hoạt transaction kiểm tra tồn kho khả dụng của từng sản phẩm và biến thể.
  - Nếu số lượng tồn kho không đủ, hệ thống lập tức từ chối và thông báo chính xác số lượng tồn thực tế.
  - Nếu đủ hàng, hệ thống tự động trừ tồn kho, cập nhật `StockStatus` và sinh mã đơn hàng chuẩn hệ sinh thái dạng `AG-2026-XXXX`.

### 4. Quản Lý & Theo Dõi Đơn Hàng Dành Cho Khách Hàng
* **Trang Quản lý Đơn mua của Tôi (`/shop/my-orders`)**:
  - Khách hàng đã đăng nhập có thể tra cứu toàn bộ danh sách đơn hàng đã đặt trong tài khoản của mình.
  - Hiển thị thanh tiến trình 5 bước trực quan: *Chờ Xác Nhận $\rightarrow$ Đã Xác Nhận $\rightarrow$ Đang Giao $\rightarrow$ Đã Giao $\rightarrow$ Đã Hủy*.
  - **Tính năng Hủy đơn hàng an toàn (Customer Order Cancellation)**:
    - Cho phép khách hàng tự hủy các đơn hàng đang ở trạng thái `Pending`.
    - Backend kích hoạt hàm `CancelOrderByCustomerAsync` tự động cộng hoàn trả lại số lượng tồn kho cho cả sản phẩm tổng và biến thể variant trong CSDL, bảo toàn số liệu tồn kho.
* **Cổng Tra cứu Vận đơn Nhanh cho Khách vãng lai (`/shop/track-order`)**:
  - Khách mua không cần đăng nhập vẫn có thể tra cứu lộ trình vận chuyển bằng cách nhập **Mã đơn hàng** (`AG-2026-XXXX`) và **Số điện thoại nhận hàng**.
  - Hiển thị hãng vận chuyển (FedEx, GHN, Viettel Post...), mã tracking và dòng thời gian chi tiết.
* **Danh sách Sản phẩm Yêu thích (`/shop/wishlist`)**:
  - Lưu trữ danh mục sản phẩm yêu thích của khách hàng vào bộ nhớ trình duyệt.
  - Cho phép xem nhanh, xóa khỏi danh sách hoặc chuyển thẳng sang giỏ hàng mua ngay.

### 5. Hồ sơ Gian hàng Thương hiệu (`/shop-profile`)
* Trải nghiệm gian hàng Boutique chính hãng: Gucci, Dior, Adidas, Burberry...
* Hiển thị chỉ số uy tín: Đánh giá sao, Số lượng người theo dõi, Tỷ lệ phản hồi chat.
* Khách hàng có thể bấm *"Theo dõi shop"* và *"Lưu Voucher"* giảm giá trực tiếp vào ví.
* Tích hợp bản đồ Google Maps chỉ đường trực tiếp tới các cửa hàng Flagship vật lý tại Hà Nội và TP.HCM.

### 6. Xác thực & Tài khoản Cá nhân (`/login`)
* Hỗ trợ chuyển đổi mượt mà giữa Đăng nhập, Đăng ký thành viên mới và Quên mật khẩu.
* Quy trình Quên mật khẩu bảo mật với bước nhập OTP xác thực mô phỏng 6 chữ số và tạo lại mật khẩu mới.

---

## 🛡️ IV. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN)

Phân hệ Admin sở hữu thẩm quyền cao nhất trên toàn bộ nền tảng, chịu trách nhiệm vận hành và kiểm soát rủi ro.

### 1. Quản trị Tài khoản & Phân quyền
* Quản lý toàn bộ danh sách người dùng trong hệ thống với các phân quyền phân cấp: `Customer`, `Seller`, `Admin`.
* Có thẩm quyền kích hoạt, khóa tài khoản hoặc nâng cấp quyền bán hàng cho đối tác mới.

### 2. Quản trị Danh mục & Cửa hàng
* Quản lý danh sách các cửa hàng / thương hiệu đối tác (`Stores`).
* Quản lý cây danh mục sản phẩm thời trang (`Categories`), kiểm duyệt các sản phẩm mới đăng tải của các đối tác bán lẻ.

### 3. Giám sát Vận hành & Dòng tiền
* Quyền truy cập toàn bộ các đơn hàng trên toàn sàn, theo dõi tiến độ giao hàng của các đơn vị chuyển phát.
* Can thiệp xử lý tranh chấp khiếu nại, hủy đơn hàng bất thường hoặc phê duyệt hoàn tiền.

### 4. Khởi tạo & Đồng bộ Dữ liệu Hệ thống (Database Seeder)
* API khởi tạo dữ liệu mẫu (`POST /api/seed/init`): Tự động nạp 180 sản phẩm thời trang cao cấp, 23 đối tác thương hiệu, danh mục sản phẩm và các tài khoản mẫu sẵn sàng phục vụ kiểm thử và thuyết trình demo.

---

## 🚀 V. ĐÁNH GIÁ HIỆN TRẠNG & GỢI Ý CÁC TÍNH NĂNG CẦN BỔ SUNG (ROADMAP PHÁT TRIỂN)

Dưới đây là bảng đánh giá hiện trạng hệ thống và đề xuất các tính năng cần bổ sung theo từng giai đoạn ưu tiên nhằm nâng cấp hệ thống thành một nền tảng thương mại điện tử hoàn chỉnh cấp doanh nghiệp (Production-Ready).

### 1. Bảng Đánh giá Hiện trạng (Ưu điểm & Hạn chế)

| Hạng mục | Hiện trạng đã hoàn thiện | Hạn chế còn tồn tại |
| :--- | :--- | :--- |
| **Kiến trúc & Cơ sở dữ liệu** | Phân tầng Clean Architecture rõ ràng, chuẩn hóa quan hệ bảng, có Seeder tự động, đã có cấu hình Docker | Chưa triển khai bộ nhớ đệm phân tán Redis, chưa có ElasticSearch cho tìm kiếm nâng cao hàng triệu bản ghi |
| **Bảo mật & Quyền hạn** | JWT Authentication, BCrypt băm mật khẩu, kiểm tra quyền sở hữu Seller, phân quyền 3 vai trò chặt chẽ | Chưa có xác thực 2 lớp (2FA qua SMS/Email OTP thực tế), chưa có Refresh Token rotation |
| **Phân hệ Người mua** | Trung tâm mua sắm `/shop`, chi tiết sản phẩm, giỏ hàng toàn cục, lịch sử đơn mua `/shop/my-orders`, tra cứu vận đơn `/shop/track-order`, wishlist | Chưa có tính năng viết đánh giá và chấm sao sản phẩm kèm hình ảnh thực tế sau khi mua |
| **Phân hệ Người bán** | Đầy đủ KPI kho, KPI đơn, nhập kho nhanh, cập nhật trạng thái đơn, thống kê ma trận doanh thu, AI viết mô tả sản phẩm | Chưa tích hợp dịch vụ tải ảnh trực tiếp lên Cloud (S3/Cloudinary) |
| **Thanh toán & Vận chuyển** | Hỗ trợ COD và Chuyển khoản, kiểm tra chống bán khống chặt chẽ, tự động hoàn kho khi hủy đơn | Phương thức Chuyển khoản hiện là hình thức đối soát thủ công, chưa kết nối cổng thanh toán tự động |
| **Trí tuệ nhân tạo (AI)** | Đã tích hợp Google Gemini AI Stylist tư vấn phối đồ, gợi ý set trang phục chéo danh mục, AI tạo mô tả sản phẩm SEO | Chưa tích hợp mô hình AI xử lý hình ảnh thử đồ ảo (Virtual Try-on) trực tiếp trên giao diện |

---

### 2. Danh mục Gợi ý Tính năng Cần Bổ sung (Đề xuất Roadmap)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      LỘ TRÌNH PHÁT TRIỂN ĐỀ XUẤT                       │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   GIAI ĐOẠN 1     │   GIAI ĐOẠN 2     │          GIAI ĐOẠN 3           │
│ (Ưu tiên cao nhất)│  (Nâng cao trải   │     (Công nghệ đột phá &       │
│                   │      nghiệm)      │        Tự động hóa)            │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Cổng thanh toán │ • Đánh giá 5 sao  │ • Thử đồ ảo (Virtual Try-on)   │
│   VNPay / MoMo    │   kèm ảnh thật    │   với hình ảnh người dùng      │
│ • Tải ảnh S3/Cloud│ • Chat Realtime   │ • Webhook đơn vị vận chuyển    │
│ • Refresh Token   │   (SignalR Chat)  │   (Giao Hàng Nhanh / GHTK)     │
│   gia hạn phiên   │ • Voucher Flash   │ • Thông báo Email / SMS        │
│   đăng nhập       │   Sale theo giờ   │   (SendGrid / Zalo ZNS)        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

#### 🔥 Giai đoạn 1: Hoàn thiện Nghiệp vụ Cốt lõi & Thanh Toán Tự Động (Ưu tiên cao nhất)
1. **Tích hợp Cổng Thanh toán Trực tuyến Tự động (VNPay / MoMo / VietQR)**:
   - Tích hợp cổng VNPay Sandbox và MoMo Payment Gateway.
   - Khi thanh toán, hệ thống sinh mã VietQR động chứa chính xác số tiền và mã đơn hàng `AG-2026-XXXX`.
   - Webhook IPN tự động kích hoạt cập nhật trạng thái đơn hàng sang `PAID` ngay khi ngân hàng báo có tiền.
2. **Dịch vụ Tải ảnh Lên Đám Mây (Cloud Storage S3 / Cloudinary)**:
   - Cho phép người bán tải ảnh sản phẩm từ máy tính lên Cloudinary hoặc AWS S3, tự động tối ưu hóa định dạng WebP và tạo ảnh thumbnail đa kích cỡ.
3. **Cơ chế Refresh Token & Tự động Gia hạn Phiên Đăng Nhập**:
   - Bổ sung bảng `RefreshToken` trong cơ sở dữ liệu để tự động cấp mới Access Token khi hết hạn (sau 24h) mà không làm gián đoạn trải nghiệm người dùng.

#### ⚡ Giai đoạn 2: Tích hợp Tương tác Trực tiếp & Khuyến Mãi
4. **Hệ thống Đánh giá & Nhận xét Sản phẩm (Customer Reviews & Ratings)**:
   - Cho phép khách hàng đã mua và nhận hàng thành công viết đánh giá, chấm sao (1 đến 5 sao) kèm hình ảnh thực tế.
   - Hiển thị huy hiệu *"Đã mua hàng chính hãng"* tăng độ uy tín cho gian hàng.
5. **Hệ thống Nhắn tin Trực tiếp Thời Gian Thực (SignalR Realtime Chat)**:
   - Ứng dụng công nghệ **ASP.NET Core SignalR** kết hợp WebSocket để xây dựng khung chat giữa Khách hàng và Chủ shop.
   - Khách có thể bấm *"Chat ngay với Shop"* trên trang sản phẩm để hỏi tư vấn kích cỡ, chất liệu hoặc thỏa thuận giá.
6. **Hệ thống Khuyến mãi & Flash Sale Đa Tầng**:
   - Quản trị viên và người bán có thể thiết lập mã giảm giá theo khung giờ vàng (Flash Sale 12h, 20h) với đồng hồ đếm ngược kích thích mua sắm.

#### 🚀 Giai đoạn 3: Đột Phá AI & Tự Động Hóa Vận Hành
7. **Phòng Thử Đồ Ảo (AI Virtual Try-On)**:
   - Ứng dụng mô hình AI xử lý hình ảnh (như IDM-VTON / Stable Diffusion) cho phép người mua tải ảnh chụp toàn thân để ướm thử trang phục hoặc giày lên cơ thể trước khi mua.
8. **Tích hợp Webhook với Đơn vị Vận chuyển Thực tế (GHN Express / GHTK)**:
   - Kết nối trực tiếp API của Giao Hàng Nhanh hoặc Giao Hàng Tiết Kiệm.
   - Tự động đẩy đơn hàng sang bưu tá khi chủ shop bấm duyệt đơn, tự động in mã vận đơn barcode và cập nhật trạng thái đơn hàng theo lộ trình GPS thực tế của shipper.
9. **Hệ thống Thông báo Đa Kênh Tự Động (SendGrid Email & Zalo ZNS)**:
   - Tự động gửi Email xác nhận kèm hóa đơn điện tử PDF sau khi đặt hàng thành công.
   - Gửi tin nhắn SMS / Zalo ZNS thông báo khi đơn hàng bắt đầu được giao đến tay khách hàng.

