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

## 🔑 IV. DANH SÁCH TÀI KHOẢN DÙNG THỬ (PRE-SEEDED ACCOUNTS)

Hệ thống đã tạo sẵn các tài khoản với vai trò khác nhau để phục vụ kiểm thử và phát triển. 
**Mật khẩu dùng chung cho tất cả các tài khoản:** `Password123@`

| Vai trò (Role) | Email đăng nhập | Họ & Tên | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **Seller (Chủ shop)** | `ducmanh@gmail.com` | Nguyễn Đức Mạnh | Quản lý bộ sưu tập 20 sản phẩm riêng, quản lý kho hàng (`/inventory`), xử lý đơn hàng (`/orders`), xem ma trận doanh thu (`/income-statistics`) |
| **Admin (Quản trị)** | `admin@gmail.com` | Aethelgard Admin | Toàn quyền kiểm soát tài khoản, duyệt gian hàng, danh mục và đơn hàng toàn sàn |
| **Customer (Khách hàng)**| `esther.howard@example.com` | Esther Howard | Mua sắm sản phẩm, tư vấn AI Stylist, thêm giỏ hàng, đặt hàng thanh toán COD |
| **Boutique Seller (Dior)** | `dior@gmail.com` | Christian Dior Official | Cửa hàng đối tác chính hãng thương hiệu Dior |
| **Boutique Seller (Gucci)**| `gucci@gmail.com` | Gucci Official | Cửa hàng đối tác chính hãng thương hiệu Gucci |
| **Boutique Seller (Adidas)**| `adidas@gmail.com` | Adidas Official | Cửa hàng đối tác chính hãng thương hiệu Adidas |

---

## 🧪 V. KIỂM THỬ HỆ THỐNG (RUNNING TESTS)

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
*(Yêu cầu kết quả: Biên dịch thành công 10/10 static/dynamic routes với 0 error)*

---

## ❓ VI. CÁC VẤN ĐỀ THƯỜNG GẶP & CÁCH XỬ LÝ (TROUBLESHOOTING)

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

## 📚 VII. TÀI LIỆU LIÊN QUAN TRONG DỰ ÁN
* 📖 [`BAO_CAO_CHUC_NANG_HE_THONG.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/BAO_CAO_CHUC_NANG_HE_THONG.md): Chi tiết chức năng từng phân hệ & Gợi ý roadmap tương lai.
* 🏗️ [`BAO_CAO_THIET_KE_HE_THONG.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/BAO_CAO_THIET_KE_HE_THONG.md): Kiến trúc Clean Architecture, sơ đồ ERD, Use Case và Sequence Diagrams.
* 👥 [`TEAM_COLLABORATION_GUIDE.md`](file:///c:/Users/ADMIN/CDTH/He-thong-thuong-mai-ien-tu-tich-hop-AI/TEAM_COLLABORATION_GUIDE.md): Quy chuẩn phân chia module và vùng làm việc cho từng thành viên trong team.

