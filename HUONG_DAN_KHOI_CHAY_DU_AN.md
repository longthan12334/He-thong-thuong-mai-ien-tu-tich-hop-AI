# 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN (PROJECT QUICKSTART GUIDE)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI (AETHELGARD MALL)

Tài liệu này hướng dẫn chi tiết từng bước cho các lập trình viên mới (developers) cài đặt môi trường, cấu hình cơ sở dữ liệu và khởi chạy toàn bộ hệ thống từ đầu.

---

## 📋 I. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

| Công cụ | Phiên bản yêu cầu | Mục đích | Kiểm tra phiên bản |
| :--- | :--- | :--- | :--- |
| **.NET SDK** | `.NET 10.0` (khuyến nghị) hoặc `.NET 8.0/9.0` | Chạy Backend Web API | `dotnet --version` |
| **Node.js** | `v18.x` hoặc `v20.x+` (LTS) | Chạy Frontend Next.js | `node -v` |
| **npm** | `v9.x` hoặc `v10.x+` | Quản lý gói thư viện Frontend | `npm -v` |
| **Cơ sở dữ liệu** | **SQL Server Express** / **LocalDB** | Lưu trữ dữ liệu hệ thống | Dịch vụ `MSSQL$SQLEXPRESS` |
| **Git** | `v2.40+` | Quản lý mã nguồn | `git --version` |

---

## ⚡ II. CÁCH 1: KHỞI CHẠY 1-CLICK TỰ ĐỘNG (DÀNH CHO WINDOWS)

Nếu bạn đang sử dụng hệ điều hành Windows, dự án đã chuẩn bị sẵn kịch bản khởi động tự động:

1. Mở thư mục gốc của dự án:
   ```cmd
   c:\Users\ADMIN\CDTH\He-thong-thuong-mai-ien-tu-tich-hop-AI
   ```
2. Nhấp đúp chuột vào tệp: **`start-all.cmd`**
   *(Hoặc chạy lệnh `.\start-all.cmd` từ PowerShell / CMD)*.
3. Kịch bản sẽ tự động:
   * Mở cửa sổ **Backend .NET Web API** lắng nghe tại cổng `http://localhost:5000`.
   * Tự động khởi tạo dữ liệu mẫu CSDL (180 sản phẩm, 23 shop, các tài khoản demo).
   * Mở cửa sổ **Frontend Next.js** lắng nghe tại cổng `http://localhost:3001`.
   * Tự động bật trình duyệt web trỏ thẳng vào `http://localhost:3001`.

> [!NOTE]
> Để tắt hệ thống, bạn chỉ cần đóng 2 cửa sổ terminal của Backend và Frontend.

---

## 🛠️ III. CÁCH 2: KHỞI CHẠY THỦ CÔNG BẰNG DÒNG LỆNH (MANUAL SETUP)

Dành cho các nhà phát triển muốn chạy độc lập từng dịch vụ, debug hoặc chạy trên môi trường Linux / macOS.

### 1. Cấu hình Cơ sở Dữ liệu (Database Setup)
Cấu hình kết nối CSDL nằm tại [`backend/src/Ecommerce.API/appsettings.json`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/backend/src/Ecommerce.API/appsettings.json):
```json
"ConnectionStrings": {
  "SqlServerConnection": "Server=localhost\\SQLEXPRESS;Database=fashion_mall;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;",
  "DefaultConnection": "Data Source=fashion_mall.db"
}
```
* **Mặc định**: Hệ thống sử dụng SQL Server cục bộ (`localhost\SQLEXPRESS`). Nếu dùng SQL Server có mật khẩu (sa), hãy thay đổi chuỗi `SqlServerConnection` tương ứng.
* **Cơ chế Seeding tự động**: Bạn **không cần chạy migration thủ công**. Khi Backend khởi động lần đầu, hệ thống sẽ tự động tạo bảng và nạp 180 sản phẩm thời trang cao cấp vào CSDL.

---

### 2. Khởi chạy Backend (.NET 10 Web API)

Mở terminal mới tại thư mục gốc dự án:

```powershell
# Di chuyển vào thư mục backend
cd backend

# Khôi phục các gói NuGet dependencies
dotnet restore

# Biên dịch dự án
dotnet build

# Khởi chạy Web API trên cổng 5000
dotnet run --project src\Ecommerce.API\Ecommerce.API.csproj --launch-profile http
```

* **Địa chỉ Backend API**: [http://localhost:5000](http://localhost:5000)
* **Tài liệu Swagger OpenAPI Explorer**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

---

### 3. Khởi chạy Frontend (Next.js 15 & React 19)

Mở một cửa sổ terminal **riêng biệt**:

```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói thư viện (chỉ cần chạy lần đầu)
npm install

# Khởi chạy máy chủ phát triển (Dev Server trên Port 3001)
npm run dev
```

* **Địa chỉ Web Portal**: 👉 **[http://localhost:3001](http://localhost:3001)**

> [!IMPORTANT]
> Cổng Frontend được thiết lập cố định là **`3001`** (thông qua lệnh `next dev -p 3001` trong `package.json`) để tránh xung đột với các dịch vụ mặc định khác thường chiếm cổng `3000`.

---

## 🐳 IV. CÁCH 3: KHỞI CHẠY BẰNG DOCKER COMPOSE (CONTAINER KHÉP KÍN)

Dành cho môi trường kiểm thử độc lập, triển khai máy chủ hoặc khi máy tính chưa cài sẵn .NET SDK và SQL Server cục bộ:

```bash
# Đóng gói và khởi chạy toàn bộ cụm dịch vụ
docker compose up --build
```

* **Hạ tầng tự động thiết lập**:
  - `aethelgard-backend`: Web API .NET 10 chạy cổng `5000`.
  - `aethelgard-frontend`: Next.js 15 Standalone chạy cổng `3001`.
  - `sqlite_data`: Phân vùng volume lưu trữ CSDL SQLite bền vững, không bị mất dữ liệu khi restart container.
  - Tự động cấu hình kết nối mạng nội bộ bảo mật `aethelgard-network`.
* Để dừng hệ thống: Nhấn `Ctrl + C` hoặc chạy `docker compose down`.

---

## 🤖 V. CẤU HÌNH TÍCH HỢP TRÍ TUỆ NHÂN TẠO (GOOGLE GEMINI AI STYLIST)

Hệ thống tích hợp trợ lý thời trang thông minh **Aethelgard AI Stylist** sử dụng mô hình Google Gemini AI:

1. **Thiết lập Khóa API (Tùy chọn)**:
   - Tạo khóa API miễn phí tại [Google AI Studio](https://aistudio.google.com/).
   - Thiết lập biến môi trường hệ thống:
     ```powershell
     # Thiết lập trên PowerShell Windows
     $env:GEMINI_API_KEY="AIzaSyYourSecretApiKeyHere"
     ```
   - Hoặc khai báo trong file [`backend/src/Ecommerce.API/appsettings.json`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/backend/src/Ecommerce.API/appsettings.json):
     ```json
     "Gemini": {
       "ApiKey": "AIzaSyYourSecretApiKeyHere",
       "Model": "gemini-3-flash-preview"
     }
     ```
2. **Cơ chế Dự phòng Thông minh (Zero-downtime Fallback)**:
   - Nếu bạn **không nhập khóa API** hoặc máy tính không có internet, hệ thống sẽ tự động kích hoạt **Bộ sinh gợi ý phong cách thời trang dự phòng (Heuristic Stylist)**.
   - Giao diện của khách hàng trên trang `/product-detail/[id]` **luôn hoạt động mượt mà 100%**, không bao giờ bị đơ, lỗi mạng hay để trống nội dung.

---

## 🔑 VI. DANH SÁCH TÀI KHOẢN DÙNG THỬ (PRE-SEEDED ACCOUNTS)

Hệ thống đã tạo sẵn các tài khoản với vai trò khác nhau để phục vụ kiểm thử và phát triển. 
**Mật khẩu dùng chung cho tất cả các tài khoản:** `Password123@`

| Vai trò (Role) | Email đăng nhập | Họ & Tên | Số lượng sản phẩm | Phạm vi quyền hạn & Trải nghiệm |
| :--- | :--- | :--- | :--- | :--- |
| **Customer (Khách hàng)**| `esther.howard@example.com` | Esther Howard | — | Mua sắm `/shop`, tư vấn AI Stylist `/product-detail/[id]`, quản lý đơn `/shop/my-orders`, tra cứu `/shop/track-order`, wishlist `/shop/wishlist` |
| **Admin (Quản trị sàn)** | `admin@gmail.com` | Aethelgard Admin | — | Toàn quyền kiểm soát hệ thống, duyệt gian hàng, danh mục và cấu hình sàn |
| **Top 1 Seller (Vivienne Westwood)** | `viviennewestwood@gmail.com` | Vivienne Westwood Official | **144 sản phẩm** | Gian hàng phong phú nhất sàn, đầy đủ túi xách, giày dép, trang sức & RTW (`/inventory`, `/orders`, `/income-statistics`) |
| **Top 2 Seller (The North Face)** | `thenorthface@gmail.com` | The North Face Official | **88 sản phẩm** | Quản lý kho thời trang dã ngoại, áo phao Nuptse, áo khoác gió & balo |
| **Luxury Seller (Gucci)** | `gucci@gmail.com` | Gucci Official Flagship | **42 sản phẩm** | Gian hàng xa xỉ phẩm, kính mát thời trang cao cấp & đồ may mặc Runway |
| **Sportswear Seller (Nike)** | `nike@gmail.com` | Nike Official Flagship | **48 sản phẩm** | Bộ sưu tập sneaker thể thao, giày chạy bộ Shox, Air Jordan & thời trang đường phố |
| **Streetwear Seller (Off-White)** | `off-white@gmail.com` *(hoặc `offwhite@gmail.com`)* | Off-White Official Flagship | **41 sản phẩm** | Bộ sưu tập sneaker streetwear nổi tiếng: Be Right Back, 3.0 Floating Arrow, Vulcanized Low Vintage |
| **Streetwear Seller (Adidas)** | `adidas@gmail.com` | Adidas Official | **27 sản phẩm** | Chuyên dòng sneaker biểu tượng: Samba OG, Gazelle Lo Pro, Handball Spezial |

---

## 🧪 VII. KIỂM THỬ HỆ THỐNG (RUNNING TESTS)

Trước khi commit mã nguồn mới hoặc tạo Pull Request, các dev nên chạy bộ kiểm thử để đảm bảo không làm vỡ các tính năng hiện có:

### 1. Chạy Unit & Integration Tests (Backend)
```powershell
dotnet test backend/Ecommerce.slnx
```
*(Yêu cầu kết quả: 8/8 tests passed 100%)*

### 2. Kiểm tra bản dựng Production (Frontend)
```powershell
npm --prefix frontend run build
```
*(Yêu cầu kết quả: Biên dịch thành công 16/16 static/dynamic routes với 0 error)*

---

## ❓ VIII. CÁC VẤN ĐỀ THƯỜNG GẶP & CÁCH XỬ LÝ (TROUBLESHOOTING)

### 1. Lỗi khóa tệp nhị phân (`The process cannot access the file ... Ecommerce.BLL.dll`)
* **Nguyên nhân**: Bạn đang chạy lệnh `dotnet test` hoặc `dotnet build` trong khi Backend API (`Ecommerce.API`) vẫn đang chạy ngầm và giữ khóa tệp DLL.
* **Cách khắc phục**: Nhấn `Ctrl + C` để dừng tiến trình Backend đang chạy trước khi build lại hoặc chạy test.

### 2. Lỗi cổng bị chiếm dụng (`Port 5000 or 3001 is already in use`)
* **Nguyên nhân**: Có tiến trình cũ vẫn đang lắng nghe trên cổng.
* **Cách khắc phục (PowerShell Windows)**:
  ```powershell
  # Tìm và tắt tiến trình chiếm cổng 5000
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  
  # Tìm và tắt tiến trình chiếm cổng 3001
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
  ```

### 3. Lỗi không kết nối được CSDL (`Cannot connect to SQL Server`)
* Mở ứng dụng **Services** (`services.msc`) trên Windows, kiểm tra dịch vụ **SQL Server (SQLEXPRESS)** đã ở trạng thái **Running** hay chưa.
* Nếu dùng tên instance khác (ví dụ: `MSSQLSERVER`), hãy mở [`backend/src/Ecommerce.API/appsettings.json`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/backend/src/Ecommerce.API/appsettings.json) và điều chỉnh lại chuỗi `Server=localhost...`.

---

## 📚 IX. TÀI LIỆU LIÊN QUAN TRONG DỰ ÁN
* 📖 [`BAO_CAO_CHUC_NANG_HE_THONG.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/BAO_CAO_CHUC_NANG_HE_THONG.md): Chi tiết chức năng từng phân hệ & Gợi ý roadmap tương lai.
* 🤖 [`TAI_LIEU_TICH_HOP_AI.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/TAI_LIEU_TICH_HOP_AI.md): Tài liệu chuyên sâu về kiến trúc, cơ chế prompt, Gemini API và giải pháp AI trong hệ thống.
* 🏗️ [`BAO_CAO_THIET_KE_HE_THONG.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/BAO_CAO_THIET_KE_HE_THONG.md): Kiến trúc Clean Architecture, sơ đồ ERD, Use Case và Sequence Diagrams chuẩn Retina.
* 📝 [`NHAT_KY_THAY_DOI_HE_THONG.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/NHAT_KY_THAY_DOI_HE_THONG.md): Nhật ký tổng hợp các nâng cấp, tính năng mới và sửa lỗi gần đây.
* 📜 [`LICH_SU_COMMIT.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/LICH_SU_COMMIT.md): Minh chứng toàn bộ 45 commits từ ngày khởi tạo dự án đến nay.
* 👥 [`TEAM_COLLABORATION_GUIDE.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/TEAM_COLLABORATION_GUIDE.md): Quy chuẩn phân chia module và vùng làm việc cho từng thành viên trong team.

