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

Phân hệ Người mua hướng tới trải nghiệm mua sắm xa xỉ (Luxury Boutique Shopping Experience), mượt mà từ khâu tìm kiếm sản phẩm đến thanh toán.

### 1. Khám phá & Tìm kiếm Sản phẩm (Trang chủ & Catalog)
* **Hero Banner tương tác**: Giới thiệu bộ sưu tập cao cấp mùa mới, tích hợp thanh tìm kiếm nhanh và nút cuộn mượt đến danh mục sản phẩm.
* **Bộ lọc đa tiêu chí (Product Filters)**:
  - Lọc theo danh mục thời trang: Áo khoác, Quần âu, Giày Sneaker, Túi xách, Phụ kiện xa xỉ.
  - Lọc nhanh: Hàng bán chạy nhất (`Bestseller`), Hàng đang giảm giá (`Discount`).
  - Lọc theo khoảng giá tùy biến: Thiết lập mức giá tối thiểu và giá tối đa.
  - Sắp xếp linh hoạt: Mới nhất, Giá tăng dần, Giá giảm dần, Độ phổ biến.
* **Lưới sản phẩm cao cấp (Seller Product Card)**:
  - Hiển thị ảnh chất lượng cao, tên thương hiệu, huy hiệu đặc quyền (Chính hãng 100%, New Arrival), tỷ lệ giảm giá phần trăm, giá bán niêm yết và giá gạch chân.
  - Nút xem nhanh sản phẩm mở khay chi tiết sản phẩm.
* **Thanh điều hướng phân trang động (Smart Dynamic Pagination)**:
  - Phân trang chuẩn 12 sản phẩm trên mỗi trang.
  - Tự động tính toán tổng số trang dựa trên kết quả lọc và tìm kiếm.
  - Tự sinh nút bấm thông minh kèm dấu `...` khi danh sách nhiều trang.
  - Nút *Previous* / *Next* tự động vô hiệu hóa tại đầu và cuối trang; hỗ trợ cuộn mượt mà (`smooth scroll`) lên đầu danh mục sau mỗi lần chuyển trang.

### 2. Trang Chi tiết Sản phẩm Chuẩn Flagship (`/product-detail/[id]`)
* **Trưng bày sản phẩm đa góc nhìn**: Thư viện ảnh chi tiết, gắn nhãn bảo đảm nguyên seal và tem kiểm định chính hãng.
* **Lựa chọn cấu hình sản phẩm**:
  - Lựa chọn kích cỡ thời trang: 38, 39, 40, 41, 42, 43 (Giày) hoặc S, M, L, XL (Trang phục).
  - Lựa chọn phiên bản màu sắc và chất liệu.
  - Bộ chọn số lượng mua với giới hạn tối đa theo tồn kho thực tế.
* **Trợ lý phối đồ AI độc quyền (AI Fashion Stylist)**:
  - Trợ lý thông minh phân tích phong cách thiết kế của sản phẩm hiện tại để gợi ý set trang phục (outfit) hoàn chỉnh: cách kết hợp áo khoác, quần suông, giày sneaker và phụ kiện kính râm đồng điệu.
* **Cam kết đặc quyền thương hiệu (Luxury Guarantees)**:
  - Bồi hoàn 300% nếu phát hiện hàng không chính hãng.
  - Đóng hộp quà tặng cao cấp nguyên seal.
  - Dịch vụ giao hàng VIP bàn giao tận tay.

### 3. Giỏ hàng Toàn cục (Global Cart Provider)
* **Lưu trữ liên thông**: Sử dụng `CartContext` lưu trữ thông tin giỏ hàng vào `localStorage` (`aethelgard_cart`), bảo toàn dữ liệu xuyên suốt các trang và sau khi refresh trình duyệt.
* **Drawer giỏ hàng (`CartModal.tsx`)**:
  - Mở trực tiếp từ thanh Navbar ở bất kỳ trang nào.
  - Hiển thị danh sách mặt hàng đã chọn kèm phân loại size, màu sắc, đơn giá, số lượng.
  - Hỗ trợ tăng/giảm số lượng, xóa từng món hoặc xóa toàn bộ giỏ hàng.
  - Tự động tính toán tổng số lượng và tổng thanh toán tức thì.

### 4. Đặt hàng & Thanh toán (Checkout Modal)
* **Quy trình đặt hàng tinh gọn**:
  - Thu thập thông tin giao nhận: Họ và tên người nhận, Số điện thoại, Email nhận thông báo, Địa chỉ giao hàng chi tiết.
  - Chọn hình thức thanh toán: **COD (Thanh toán khi nhận hàng)** hoặc **Chuyển khoản Ngân hàng / Thẻ tín dụng**.
* **Mã hóa đơn hàng chuẩn**: Hệ thống tự động sinh mã đơn hàng độc bản dạng `AG-2026-XXXX`.
* **Kiểm soát tồn kho tức thời - Chống bán khống (Anti-Overselling Guard)**:
  - Ngay khi khách bấm *"Xác nhận đặt hàng"*, Backend kích hoạt transaction kiểm tra tồn kho khả dụng của từng sản phẩm và biến thể.
  - Nếu số lượng tồn kho không đủ (khách đặt vượt quá số lượng còn lại trong kho), hệ thống lập tức từ chối và thông báo chính xác số lượng tồn thực tế.
  - Nếu đủ hàng, hệ thống tự động trừ tồn kho ngay lập tức, cập nhật `StockStatus` và sinh bản ghi đơn hàng.

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
| **Kiến trúc & Cơ sở dữ liệu** | Phân tầng Clean Architecture rõ ràng, chuẩn hóa quan hệ bảng, có Seeder tự động | Chưa triển khai bộ nhớ đệm (Redis Cache), chưa có ElasticSearch cho tìm kiếm nâng cao |
| **Bảo mật & Quyền hạn** | JWT Authentication, BCrypt băm mật khẩu, kiểm tra quyền sở hữu Seller | Chưa có xác thực 2 lớp (2FA qua SMS/Email OTP thực tế), chưa có Refresh Token rotation |
| **Phân hệ Người mua** | Giao diện đẹp, tìm kiếm & lọc mượt mà, phân trang động, giỏ hàng & thanh toán hoàn chỉnh | Khách hàng chưa có trang tra cứu lịch sử các đơn hàng đã đặt của riêng mình |
| **Phân hệ Người bán** | Đầy đủ KPI kho, KPI đơn, nhập kho nhanh, cập nhật trạng thái đơn, thống kê tài chính | Chưa có chức năng đăng thêm sản phẩm mới (Create Product Form) và tải ảnh lên Cloud |
| **Thanh toán & Vận chuyển** | Hỗ trợ COD và Chuyển khoản, kiểm tra chống bán khống chặt chẽ | Phương thức Chuyển khoản hiện là hình thức thủ công, chưa kết nối cổng thanh toán tự động |
| **Trí tuệ nhân tạo (AI)** | Đã tích hợp AI Fashion Stylist gợi ý phối đồ thời trang | Gợi ý AI hiện hoạt động theo kịch bản mẫu (Rule-based), chưa gọi trực tiếp LLM OpenAI/Gemini API |

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
│ • Lịch sử đơn mua │ • Tích hợp cổng   │ • Trợ lý AI Stylist đa năng    │
│ • Quản lý sản phẩm│   VNPay / MoMo    │   (Kết nối Gemini 1.5 / GPT-4o)│
│ • Upload ảnh S3   │ • Đánh giá & Sao  │ • Thử đồ ảo (Virtual Try-on)   │
│ • Cổng tra cứu đơn│ • Chat Realtime   │ • Webhook đơn vị vận chuyển    │
│   cho khách       │ • Flash Sale      │ • Thông báo Email / SMS        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

#### 🔥 Giai đoạn 1: Hoàn thiện Nghiệp vụ Cốt lõi (Ưu tiên cao nhất)
1. **Trang Quản lý Đơn hàng dành riêng cho Khách hàng (`/my-orders`)**:
   - Khách hàng sau khi đăng nhập có thể xem danh sách tất cả các đơn hàng mình đã đặt, xem chi tiết từng món và theo dõi lộ trình vận chuyển của gói hàng.
   - Hỗ trợ tính năng hủy đơn hàng khi đơn còn ở trạng thái `PENDING`.
2. **Cổng Tra cứu Đơn hàng Nhanh cho Khách vãng lai (`/track-order`)**:
   - Cho phép khách mua không cần đăng nhập vẫn có thể tra cứu trạng thái đơn bằng cách nhập **Mã đơn hàng** (`AG-2026-XXXX`) và **Số điện thoại**.
3. **Màn hình Đăng bán Sản phẩm mới cho Seller (`/seller/products/new`)**:
   - Form nhập liệu sản phẩm: Tên sản phẩm, Danh mục, Bộ sưu tập, Giá bán lẻ, Giá vốn, Mô tả chi tiết, Danh sách biến thể (Size, Màu sắc, Số lượng tồn kho ban đầu).
   - Tích hợp dịch vụ tải ảnh sản phẩm lên máy chủ hoặc dịch vụ đám mây (Cloudinary / AWS S3).
4. **Cơ chế Refresh Token & Tự động gia hạn phiên đăng nhập**:
   - Bổ sung bảng `RefreshToken` trong cơ sở dữ liệu để tự động cấp mới Access Token khi hết hạn mà không bắt người dùng phải đăng nhập lại liên tục.

#### ⚡ Giai đoạn 2: Tích hợp Dịch vụ và Trải nghiệm Tương tác
5. **Tích hợp Cổng Thanh toán Trực tuyến Tự động**:
   - Tích hợp các cổng thanh toán phổ biến tại Việt Nam: **VNPay Sandbox / MoMo API / VietQR Chuyển khoản tự động đối soát**.
   - Khách quét mã QR tự động điền đúng số tiền và nội dung đơn hàng, hệ thống nhận IPN Webhook và tự động chuyển trạng thái đơn sang `PAID` mà không cần xác nhận thủ công.
6. **Hệ thống Đánh giá & Nhận xét Sản phẩm (Customer Reviews & Ratings)**:
   - Cho phép khách hàng đã mua sản phẩm đánh giá số sao (1 đến 5 sao) và viết cảm nhận kèm hình ảnh thực tế.
   - Thống kê tỷ lệ đánh giá và hiển thị huy hiệu *"Đã mua hàng chính hãng"*.
7. **Hệ thống Nhắn tin Trực tiếp Realtime (Chat giữa Khách và Chủ shop)**:
   - Ứng dụng **SignalR** hoặc **Socket.IO** để xây dựng khung chat trực tiếp góc màn hình.
   - Khách có thể bấm *"Chat ngay với Shop"* trên trang sản phẩm để hỏi tư vấn size, mặc cả hoặc yêu cầu thêm hình ảnh thực tế.
8. **Hệ thống Khuyến mãi & Flash Sale đa tầng**:
   - Cho phép Admin và Seller tạo các mã Voucher (giảm theo % hoặc số tiền cố định, điều kiện đơn tối thiểu).
   - Đồng hồ đếm ngược Flash Sale theo các khung giờ vàng (12h, 20h) kích thích quyết định mua sắm.

#### 🚀 Giai đoạn 3: Nâng cấp AI Thông minh & Mở rộng Quy mô
9. **Trợ lý Thời trang AI Thông minh Thế hệ mới (Generative AI Stylist)**:
   - Tích hợp trực tiếp API **Google Gemini 1.5 Flash / Pro** hoặc **OpenAI GPT-4o**.
   - Ứng dụng mô hình RAG (Retrieval-Augmented Generation) nạp toàn bộ danh mục sản phẩm của shop vào Vector Database.
   - Trợ lý AI có thể trò chuyện tự nhiên với khách: *"Tôi cao 1m75 nặng 68kg chuẩn bị đi dự tiệc cưới ngoài trời, hãy tư vấn cho tôi 1 set đồ lịch lãm kèm phụ kiện có sẵn trên sàn"*.
10. **Phòng Thử đồ Ảo (AI Virtual Try-On)**:
    - Ứng dụng mô hình AI xử lý hình ảnh (như IDM-VTON) cho phép người mua tải lên ảnh chụp toàn thân để thử ướm trực quan chiếc áo khoác hoặc chiếc đầm lên vóc dáng của mình trước khi đặt mua.
11. **Tích hợp Webhook với Đơn vị Vận chuyển Thực tế**:
    - Kết nối trực tiếp API của **Giao Hàng Nhanh (GHN Express)** hoặc **Giao Hàng Tiết Kiệm (GHTK)**.
    - Khi chủ shop bấm *"Giao hàng"*, hệ thống tự động đẩy đơn sang GHN, sinh mã vận đơn thật và in phiếu gửi hàng có mã vạch chuẩn.
12. **Hệ thống Thông báo Đa kênh (Omnichannel Notifications)**:
    - Tự động gửi Email xác nhận đơn hàng qua **SendGrid** kèm hóa đơn điện tử PDF.
    - Gửi tin nhắn SMS / Zalo ZNS thông báo khi đơn hàng bắt đầu được giao đến địa chỉ khách hàng.

