# BÁO CÁO THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI (AETHELGARD MALL)

---

## 🏗️ I. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được xây dựng theo mô hình **Client-Server hiện đại**, tách biệt hoàn toàn giữa tầng hiển thị (**Frontend SPA/SSR**) và tầng dịch vụ nghiệp vụ (**Backend RESTful API**), giao tiếp thông qua giao thức bảo mật HTTP/HTTPS và định dạng chuẩn JSON.

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Tầng Trình Duyệt / Khách Hàng"]
        WebBrowser["Trình duyệt Web (Desktop / Mobile)"]
    end

    subgraph FrontendApp ["2. Tầng Ứng Dụng Frontend (Next.js 15)"]
        direction TB
        AppRouter["Next.js App Router (Port 3001)"]
        UIComp["React Components & UI Modals"]
        ContextSys["Context State (Auth, Cart, Toast)"]
        ServiceLayer["Frontend Service Layer (Axios / Fetch)"]
        AppRouter --> UIComp
        UIComp --> ContextSys
        ContextSys --> ServiceLayer
    end

    subgraph BackendAPI ["3. Tầng Dịch Vụ Backend (.NET 10 Web API)"]
        direction TB
        APIController["API Controllers & Middlewares (Port 5000)"]
        BLLService["Business Logic Layer (Services & Validation)"]
        SecurityEngine["JWT Auth & Role-based Authorization"]
        DALRepo["Data Access Layer (Unit of Work & Generic Repo)"]
        
        APIController --> SecurityEngine
        APIController --> BLLService
        BLLService --> DALRepo
    end

    subgraph DatabaseLayer ["4. Tầng Dữ Liệu & Lưu Trữ"]
        MSSQL[("Microsoft SQL Server (Port 1433)")]
        LocalStore[("Trình duyệt LocalStorage: Cart State")]
    end

    WebBrowser -->|HTTP Request / DOM Render| AppRouter
    ContextSys <-->|Đồng bộ giỏ hàng offline| LocalStore
    ServiceLayer -->|RESTful API Calls / Bearer JWT| APIController
    DALRepo -->|Entity Framework Core 10| MSSQL
```

---

## 🏛️ II. KIẾN TRÚC CODE (SOFTWARE DESIGN & CODE ARCHITECTURE)

### 1. Kiến trúc Backend (.NET Clean Architecture / 3-Tier Pattern)
Mã nguồn Backend được tổ chức thành 4 phân tầng độc lập nhằm đảm bảo tính đơn nhiệm (Single Responsibility), dễ bảo trì và dễ mở rộng:

```mermaid
flowchart LR
    API["Ecommerce.API<br/>(Presentation Layer)"]
    BLL["Ecommerce.BLL<br/>(Business Logic Layer)"]
    DAL["Ecommerce.DAL<br/>(Data Access Layer)"]
    Common["Ecommerce.Common<br/>(Domain & Shared Layer)"]

    API -->|Phụ thuộc| BLL
    API -->|Phụ thuộc| Common
    BLL -->|Phụ thuộc| DAL
    BLL -->|Phụ thuộc| Common
    DAL -->|Phụ thuộc| Common
```

* **`Ecommerce.API` (Presentation Layer)**:
  - Tiếp nhận các HTTP Request, điều phối routing, xác thực JWT Token qua Middleware.
  - Các Controllers: `AuthController`, `ProductsController`, `OrdersController`, `InventoryAndStatsControllers`, `StoresAndSeedControllers`.
  - Kiểm soát lỗi tập trung thông qua Custom Exception Middleware và tích hợp Swagger OpenAPI.
* **`Ecommerce.BLL` (Business Logic Layer)**:
  - Chứa đựng toàn bộ luật nghiệp vụ (Business Rules), tính toán tồn kho, kiểm tra chống bán khống, xử lý đối soát tài chính và trợ lý thời trang `AIService`.
  - Các Services: `AuthService`, `ProductService`, `OrderService`, `InventoryService`, `StatisticsService`, `StoreService`, `AIService`.
  - Chuyển đổi dữ liệu tự động giữa Entity và DTO thông qua **AutoMapper**.
* **`Ecommerce.DAL` (Data Access Layer)**:
  - Tương tác với cơ sở dữ liệu qua **Entity Framework Core**.
  - Triển khai mẫu thiết kế **Generic Repository Pattern** (`IGenericRepository<T>`) và **Unit of Work Pattern** (`IUnitOfWork`) giúp quản lý Transaction nguyên tử (ACID).
  - Cấu hình quan hệ bảng, chỉ mục (Index), khóa ngoại (Foreign Key) bằng Fluent API trong `EntityConfigurations.cs`.
* **`Ecommerce.Common` (Domain Entities & Shared)**:
  - Khai báo các thực thể cốt lõi: `User`, `Store`, `Product`, `ProductVariant`, `Category`, `Order`, `OrderItem`, `TransactionRecord`.
  - Định nghĩa Enums (`UserRole`, `OrderStatus`, `PaymentStatus`, `StockStatus`) và các DTOs trao đổi dữ liệu.

---

### 2. Kiến trúc Frontend (Next.js 15 Component-Driven & Context Architecture)
Frontend tuân thủ chặt chẽ nguyên lý Component-Driven, phân tách rõ giao diện và tầng kết nối dữ liệu:

```
frontend/src/
├── app/                      # App Router (Next.js 15)
│   ├── page.tsx              # Trang chủ / Lưới sản phẩm & Phân trang
│   ├── login/                # Màn hình Đăng nhập / Đăng ký / Quên MK
│   ├── product-detail/[id]/  # Trang chi tiết sản phẩm chuẩn Boutique
│   ├── shop-profile/         # Trang hồ sơ thương hiệu Flagship
│   ├── orders/               # Phân hệ quản lý đơn hàng của Seller
│   ├── inventory/            # Phân hệ quản lý tồn kho & hàng hóa
│   └── income-statistics/    # Phân hệ thống kê doanh thu & tài chính
├── components/               # Tái sử dụng giao diện
│   ├── Navbar.tsx            # Thanh điều hướng thích ứng phân quyền
│   ├── Footer.tsx            # Chân trang Luxury
│   └── seller/               # Bộ Modal & Drawer (Cart, Checkout, Drawer)
├── contexts/                 # Quản lý State toàn cục
│   ├── AuthContext.tsx       # Quản lý phiên JWT, User Info, Phân quyền
│   ├── CartContext.tsx       # Giỏ hàng toàn cục, đồng bộ LocalStorage
│   └── ToastContext.tsx      # Thông báo Toast Popup tương tác
└── services/                 # Tầng giao tiếp RESTful API
    ├── auth.service.ts
    ├── product.service.ts
    └── order.service.ts
```

---

## 📊 III. BIỂU ĐỒ PHÂN RÃ CHỨC NĂNG (FUNCTIONAL DECOMPOSITION DIAGRAM - FDD)

Hệ thống được phân rã thành 4 khối chức năng chính:

```mermaid
flowchart TD
    Root["HỆ THỐNG TMĐT THỜI TRANG AETHELGARD MALL"]

    SubBuyer["Phân Hệ Người Mua<br/>(Customer / Guest)"]
    SubSeller["Phân Hệ Người Bán<br/>(Seller / Merchant)"]
    SubAdmin["Phân Hệ Quản Trị<br/>(System Admin)"]
    SubCommon["Phân Hệ Chung<br/>(Core Services)"]

    Root --> SubBuyer
    Root --> SubSeller
    Root --> SubAdmin
    Root --> SubCommon

    %% Customer Functions
    F_Catalog["Khám Phá & Tìm Kiếm<br/>(Bộ lọc, Sort, Phân trang 12sp)"]
    F_Detail["Xem Chi Tiết Boutique<br/>(Size, Màu, AI Stylist)"]
    F_Cart["Quản Lý Giỏ Hàng<br/>(Thêm/Bớt/Xóa, LocalStorage)"]
    F_Checkout["Đặt Hàng & Thanh Toán<br/>(COD, Chuyển khoản, Check Kho)"]
    F_Store["Xem Gian Hàng Đối Tác<br/>(Voucher, Bản đồ Maps)"]
    SubBuyer --> F_Catalog
    SubBuyer --> F_Detail
    SubBuyer --> F_Cart
    SubBuyer --> F_Checkout
    SubBuyer --> F_Store

    %% Seller Functions
    S_Inv["Quản Lý Kho Hàng<br/>(KPI kho, Bảng SKU, Nhập hàng)"]
    S_Order["Quản Lý Đơn Hàng<br/>(KPI đơn, Drawer vận đơn, Đổi status)"]
    S_Finance["Báo Cáo Tài Chính<br/>(Biểu đồ tháng, Gauge, Lịch sử)"]
    S_Brand["Quản Trị Gian Hàng<br/>(Trưng bày bộ sưu tập riêng)"]
    SubSeller --> S_Inv
    SubSeller --> S_Order
    SubSeller --> S_Finance
    SubSeller --> S_Brand

    %% Admin Functions
    A_User["Quản Lý Người Dùng<br/>(Phân quyền, Khóa/Mở)"]
    A_Store["Quản Lý Cửa Hàng & Đối Tác"]
    A_Category["Quản Lý Danh Mục Sàn"]
    A_Seed["Khởi Tạo Dữ Liệu Seeder"]
    SubAdmin --> A_User
    SubAdmin --> A_Store
    SubAdmin --> A_Category
    SubAdmin --> A_Seed

    %% Common Functions
    C_Auth["Xác Thực JWT & Đăng Nhập"]
    C_OTP["Khôi Phục Mật Khẩu OTP"]
    C_Audit["Kiểm Soát Quyền Sở Hữu"]
    SubCommon --> C_Auth
    SubCommon --> C_OTP
    SubCommon --> C_Audit
```

---

## 🎯 IV. CÁC BIỂU ĐỒ USE CASE (USE CASE DIAGRAMS)

### 1. Biểu đồ Use Case Tổng quát Toàn Hệ thống
Xác định 3 tác nhân chính: **Khách hàng (Customer)**, **Người bán (Seller)**, và **Quản trị viên (Admin)**.

```mermaid
flowchart LR
    %% Actors
    ActorBuyer(("Khách Hàng<br/>(Customer)"))
    ActorSeller(("Người Bán<br/>(Seller)"))
    ActorAdmin(("Quản Trị Viên<br/>(Admin)"))

    subgraph BoundarySystem ["HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ AETHELGARD MALL"]
        UC_Auth(["Đăng ký / Đăng nhập / Quên MK"])
        UC_Search(["Tìm kiếm, Lọc & Xem Sản Phẩm"])
        UC_AI(["Tư vấn phối đồ AI Stylist"])
        UC_Cart(["Quản lý Giỏ hàng"])
        UC_Order(["Đặt hàng & Thanh toán (Check Tồn)"])
        UC_ShopProfile(["Xem Hồ sơ Shop & Lấy Voucher"])

        UC_ManageInv(["Quản lý Tồn kho & Nhập thêm hàng"])
        UC_ManageOrder(["Quản lý & Cập nhật Trạng thái Đơn"])
        UC_ViewStats(["Xem Thống kê Doanh thu & Dòng tiền"])

        UC_ManageUsers(["Quản lý Người dùng & Phân quyền"])
        UC_ManageStores(["Quản trị Cửa hàng & Danh mục"])
        UC_SystemSeed(["Khởi tạo Dữ liệu Mẫu (Seeder)"])
    end

    ActorBuyer --> UC_Auth
    ActorBuyer --> UC_Search
    ActorBuyer --> UC_AI
    ActorBuyer --> UC_Cart
    ActorBuyer --> UC_Order
    ActorBuyer --> UC_ShopProfile

    ActorSeller --> UC_Auth
    ActorSeller --> UC_ManageInv
    ActorSeller --> UC_ManageOrder
    ActorSeller --> UC_ViewStats

    ActorAdmin --> UC_Auth
    ActorAdmin --> UC_ManageUsers
    ActorAdmin --> UC_ManageStores
    ActorAdmin --> UC_SystemSeed
    ActorAdmin --> UC_ManageOrder
```

---

### 2. Biểu đồ Use Case Chi tiết Phân hệ Người mua (Customer)

```mermaid
flowchart LR
    Customer(("Khách Mua Hàng"))

    subgraph ShoppingContext ["Phân Hệ Mua Sắm & Đặt Hàng"]
        UC1(["Xem danh mục & Lọc giá, danh mục"])
        UC2(["Xem chi tiết sản phẩm, chọn size & màu"])
        UC3(["Nhận gợi ý phối đồ từ AI Stylist"])
        UC4(["Thêm sản phẩm vào giỏ hàng"])
        UC5(["Điều chỉnh số lượng & Xóa giỏ hàng"])
        UC6(["Tiến hành Đặt hàng (Checkout)"])
        UC7(["Kiểm tra số lượng tồn kho khả dụng"])
        UC8(["Tạo đơn hàng & Nhận mã đơn AG-XXXX"])
        UC9(["Xem bản đồ & Lấy mã Voucher"])

        UC6 -.->|<< include >>| UC7
        UC6 -.->|<< include >>| UC8
        UC2 -.->|<< extend >>| UC3
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC9
```

---

### 3. Biểu đồ Use Case Chi tiết Phân hệ Người bán (Seller)

```mermaid
flowchart LR
    Seller(("Người Bán (Seller)"))

    subgraph SellerContext ["Phân Hệ Vận Hành Kinh Doanh"]
        S_UC1(["Xem 4 KPI Kho hàng & Bảng SKU"])
        S_UC2(["Nhập thêm hàng hóa (Restock Modal)"])
        S_UC3(["Xem 4 KPI Đơn hàng & Bảng đơn"])
        S_UC4(["Mở Drawer tra cứu hành trình vận đơn"])
        S_UC5(["Cập nhật trạng thái đơn hàng"])
        S_UC6(["Kiểm tra quyền sở hữu đơn hàng"])
        S_UC7(["Xem Ma trận Doanh thu & Lịch sử giao dịch"])

        S_UC2 -.->|<< include >>| S_UC1
        S_UC5 -.->|<< include >>| S_UC6
    end

    Seller --> S_UC1
    Seller --> S_UC2
    Seller --> S_UC3
    Seller --> S_UC4
    Seller --> S_UC5
    Seller --> S_UC7
```

---

## 🗄️ V. BIỂU ĐỒ THỰC THỂ QUAN HỆ (ENTITY RELATIONSHIP DIAGRAM - ERD)

Mô hình dữ liệu quan hệ được chuẩn hóa theo chuẩn 3NF, cấu hình bằng EF Core Fluent API:

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ ORDER_ITEMS : "included_in"
    ORDERS ||--|{ ORDER_ITEMS : "consists_of"

    USERS {
        int Id PK
        string FullName
        string Email
        string PasswordHash
        int Role "Customer=1, Seller=2, Admin=3"
        string PhoneNumber
        string AvatarUrl
        bool IsEmailVerified
        string ResetOtp
        datetime ResetOtpExpiry
        datetime CreatedAt
    }

    CATEGORIES {
        int Id PK
        string Name
        string Slug
        string Description
        string ImageUrl
        datetime CreatedAt
    }

    PRODUCTS {
        int Id PK
        int SellerId "FK -> Users.Id"
        int CategoryId FK
        string Name
        string Slug
        string Sku
        string CollectionName
        string Description
        decimal BasePrice
        decimal OriginalPrice
        int DiscountPercent
        string ImageUrl
        int StockQuantity
        int StockStatus "InStock=1, LowStock=2, OutOfStock=3"
        double Rating
        int ReviewCount
        bool IsActive
        datetime CreatedAt
    }

    PRODUCT_VARIANTS {
        int Id PK
        int ProductId FK
        string Size
        string Color
        string Sku
        decimal Price
        int StockQuantity
        datetime CreatedAt
    }

    ORDERS {
        int Id PK
        string OrderCode "UK: AG-2026-XXXX"
        int UserId "FK -> Users.Id (Nullable)"
        string CustomerName
        string CustomerEmail
        string CustomerPhone
        string ShippingAddress
        string PaymentMethod
        int Status "Pending=1, Confirmed=2, Shipped=3, Delivered=4, Cancelled=5"
        int PaymentStatus "Unpaid=1, Paid=2"
        string Carrier "FedEx Logistics"
        string TrackingCode
        int ProgressStep
        decimal Subtotal
        decimal TotalAmount
        datetime CreatedAt
    }

    ORDER_ITEMS {
        int Id PK
        int OrderId FK
        int ProductId FK
        string ProductName
        string Specs
        string ImageUrl
        decimal Price
        int Quantity
        decimal Subtotal
        datetime CreatedAt
    }

    STORES {
        int Id PK
        string StoreCode "UK"
        string BrandId
        string StoreName
        string StoreType
        string City
        string Address
        double Latitude
        double Longitude
        string OperatingHours
        datetime CreatedAt
    }

    TRANSACTION_RECORDS {
        int Id PK
        string TransactionCode "UK"
        string CustomerName
        string ProductName
        string Status
        int Quantity
        decimal UnitPrice
        decimal TotalAmount
        datetime CreatedAt
    }
```

---

## ⏱️ VI. CÁC BIỂU ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)

### 1. Luồng Xác thực & Đăng nhập Người dùng (JWT Authentication)
Minh họa quá trình đăng nhập và gắn quyền truy cập:

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Dùng
    participant UI as Giao Diện Web (Next.js)
    participant AuthContext as React AuthContext
    participant AuthAPI as AuthController (.NET)
    participant AuthService as AuthService (BLL)
    participant DB as SQL Server Database

    User->>UI: Nhập Email & Mật khẩu
    UI->>AuthAPI: POST /api/auth/login {email, password}
    AuthAPI->>AuthService: LoginAsync(email, password)
    AuthService->>DB: Tìm kiếm User theo Email
    DB-->>AuthService: Trả về bản ghi User (PasswordHash, Role)
    
    alt Sai email hoặc mật khẩu
        AuthService-->>AuthAPI: Quăng UnauthorizedException
        AuthAPI-->>UI: HTTP 401 Unauthorized
        UI-->>User: Hiển thị thông báo "Email hoặc mật khẩu không đúng"
    else Xác thực thành công
        AuthService->>AuthService: Verify BCrypt hash & Sinh JWT Token (Claims: sub, role, email)
        AuthService-->>AuthAPI: Trả về Token + UserDto
        AuthAPI-->>UI: HTTP 200 OK {token, user}
        UI->>AuthContext: Lưu token vào LocalStorage & cập nhật User State
        AuthContext-->>UI: Cập nhật giao diện theo Role (Seller/Admin/Customer)
        UI-->>User: Đăng nhập thành công, chuyển hướng trang
    end
```

---

### 2. Luồng Khách hàng Đặt hàng & Khóa tồn kho chống bán khống (Order Checkout & Anti-Overselling Guard)
Đây là nghiệp vụ quan trọng nhất bảo vệ tính toàn vẹn kho hàng của sàn thương mại điện tử:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Mua Hàng
    participant Modal as CheckoutModal (React)
    participant OrderAPI as OrdersController
    participant OrderService as OrderService (BLL)
    participant UnitOfWork as IUnitOfWork (DAL)
    participant DB as SQL Server (MSSQL)

    Customer->>Modal: Bấm "Xác Nhận Thanh Toán"
    Modal->>OrderAPI: POST /api/orders (CreateOrderRequest + CartItems)
    OrderAPI->>OrderService: CreateOrderAsync(dto, currentUserId)
    
    critical Kiểm tra & Khóa tồn kho (Transaction)
        OrderService->>UnitOfWork: Bắt đầu Database Transaction
        loop Cho từng sản phẩm trong giỏ hàng
            OrderService->>DB: Lấy Product & ProductVariants (Khóa bản ghi)
            DB-->>OrderService: Trả về số lượng StockQuantity khả dụng
            
            alt Tồn kho < Số lượng khách mua (Bán khống)
                OrderService-->>OrderAPI: Quăng InvalidOperationException: "Vượt quá tồn kho"
                OrderAPI-->>Modal: HTTP 400 Bad Request ("Sản phẩm chỉ còn X sp trong kho")
                Modal-->>Customer: Báo lỗi đỏ, từ chối giao dịch
            else Đủ tồn kho
                OrderService->>OrderService: Trừ Product.StockQuantity -= Quantity
                OrderService->>OrderService: Trừ ProductVariant.StockQuantity -= Quantity
                OrderService->>OrderService: Cập nhật StockStatus (IN_STOCK / LOW_STOCK / OUT_OF_STOCK)
            end
        end

        OrderService->>DB: Tạo bản ghi Order (#AG-2026-XXXX) & OrderItems
        OrderService->>DB: Lưu các thay đổi (SaveChangesAsync)
        OrderService->>UnitOfWork: Commit Transaction thành công
    end

    OrderService-->>OrderAPI: Trả về OrderDto hoàn chỉnh
    OrderAPI-->>Modal: HTTP 201 Created {orderCode: "AG-2026-XXXX"}
    Modal->>Modal: Xóa giỏ hàng LocalStorage (clearCart)
    Modal-->>Customer: Hiển thị Toast thông báo đặt hàng thành công kèm mã vận đơn!
```

---

### 3. Luồng Người bán Nhập thêm hàng vào kho (Restock Inventory)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Chủ Shop (Seller)
    participant InvUI as Trang Kho Hàng (/inventory)
    participant InvAPI as InventoryAndStatsControllers
    participant InvService as InventoryService (BLL)
    participant DB as SQL Server Database

    Seller->>InvUI: Bấm nút "+ Nhập Thêm" trên dòng sản phẩm
    InvUI-->>Seller: Mở Modal nhập số lượng (Restock Modal)
    Seller->>InvUI: Nhập số lượng cần thêm (ví dụ: +50) và Xác nhận
    InvUI->>InvAPI: POST /api/inventory/restock {productId, additionalQuantity: 50}
    
    note over InvAPI: Middleware kiểm tra JWT Bearer Token (Phải là Role: Seller hoặc Admin)
    InvAPI->>InvService: RestockProductAsync(productId, 50)
    InvService->>DB: Tìm Product theo Id
    DB-->>InvService: Bản ghi Product hiện tại
    
    InvService->>InvService: StockQuantity += 50
    InvService->>InvService: Cập nhật StockStatus = InStock
    InvService->>DB: SaveChangesAsync()
    DB-->>InvService: Cập nhật thành công
    
    InvService-->>InvAPI: Trả về InventoryItemDto mới
    InvAPI-->>InvUI: HTTP 200 OK
    InvUI->>InvUI: Cập nhật bảng kiểm kê & các chỉ số KPI kho tức thì
    InvUI-->>Seller: Hiển thị thông báo "Đã nhập thêm +50 sản phẩm vào kho!"
```

---

### 4. Luồng Cập nhật Trạng thái Đơn hàng & Tra cứu Vận chuyển

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Chủ Shop
    participant OrdersUI as Trang Đơn Hàng (/orders)
    participant Drawer as Drawer Tra Cứu Vận Đơn
    participant OrderAPI as OrdersController
    participant OrderService as OrderService (BLL)
    participant DB as SQL Server Database

    Seller->>OrdersUI: Click chọn đơn hàng #AG-2026-7179
    OrdersUI->>Drawer: Mở khay trượt chi tiết hành trình vận chuyển
    Seller->>Drawer: Bấm nút "Giao Cho Vận Chuyển" (Chuyển sang SHIPPED)
    Drawer->>OrderAPI: PUT /api/orders/7179/status {status: "SHIPPED"}
    
    note over OrderAPI: Kiểm tra Authorization (Role: Seller/Admin & Quyền sở hữu)
    OrderAPI->>OrderService: UpdateOrderStatusAsync(orderId, "SHIPPED")
    OrderService->>DB: Truy vấn đơn hàng kèm các mục sản phẩm
    DB-->>OrderService: Thông tin Order
    
    OrderService->>OrderService: Cập nhật Status = Shipped, ProgressStep = 3
    OrderService->>OrderService: Ghi nhận vị trí LastUpdateLocation
    OrderService->>DB: SaveChangesAsync()
    DB-->>OrderService: Hoàn tất cập nhật
    
    OrderService-->>OrderAPI: Trả về OrderDto cập nhật
    OrderAPI-->>Drawer: HTTP 200 OK
    Drawer->>Drawer: Cập nhật Timeline xanh lá (In Transit)
    Drawer-->>Seller: Đổi nhãn trạng thái sang "Đang Giao"
```

---

## 🌐 VII. BIỂU ĐỒ KIẾN TRÚC TRIỂN KHAI (DEPLOYMENT DIAGRAM)

Mô hình kiến trúc triển khai trên môi trường máy chủ vật lý / máy phát triển cục bộ:

```mermaid
flowchart TD
    subgraph ClientDevice ["Thiết Bị Người Dùng (Client Machine)"]
        Browser["Trình Duyệt Web (Chrome / Safari / Edge)<br/>Chạy giao diện HTML5, CSS3, JavaScript"]
    end

    subgraph HostServer ["Máy Chủ Ứng Dụng (Application Host)"]
        subgraph NodeRuntime ["Node.js Runtime Engine"]
            NextServer["Next.js 15 Server (Port 3001)<br/>• SSR Page Rendering<br/>• Static Asset Serving<br/>• Proxy Routing"]
        end

        subgraph DotNetRuntime [".NET 10 CLR Runtime Engine"]
            Kestrel["Kestrel Web Server (Port 5000)<br/>• ASP.NET Core Web API<br/>• JWT Authentication Filter<br/>• Swagger UI Docs (/swagger)"]
        end

        subgraph DatabaseInstance ["Cơ Sở Dữ Liệu Quan Hệ"]
            MSSQLServer["Microsoft SQL Server (Port 1433)<br/>• Database: EcommerceAethelgardDb<br/>• Tables: Users, Products, Orders...<br/>• ACID Transactions & Indexing"]
        end
    end

    Browser <-->|HTTP / WebSocket (Port 3001)| NextServer
    Browser <-->|AJAX / RESTful API (Port 5000)| Kestrel
    Kestrel <-->|TCP/IP ADO.NET Connection (Port 1433)| MSSQLServer
```

