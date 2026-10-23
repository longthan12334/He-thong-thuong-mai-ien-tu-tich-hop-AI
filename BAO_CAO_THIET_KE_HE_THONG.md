# BÁO CÁO THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THỜI TRANG CAO CẤP TÍCH HỢP AI (AETHELGARD MALL)

---

## 🏗️ I. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo mô hình **Client-Server hiện đại, phân tán và hướng dịch vụ**, tách biệt hoàn toàn giữa tầng giao diện người dùng (**Frontend SPA/SSR**) và tầng xử lý nghiệp vụ (**Backend RESTful API**). Toàn bộ hệ thống được container hóa thông qua **Docker & Docker Compose**, đảm bảo tính nhất quán trên môi trường phát triển và sản xuất.

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Tầng Trình Duyệt & Người Dùng"]
        WebBrowser["Trình duyệt Web (Desktop / Mobile / Tablet)<br/>Chrome, Safari, Edge, Firefox"]
    end

    subgraph FrontendApp ["2. Tầng Ứng Dụng Frontend (Next.js 15 Standalone)"]
        direction TB
        AppRouter["Next.js App Router (Port 3001)<br/>SSR, Dynamic Routes, Route Handlers"]
        UIComp["Boutique UI & Showcase Components<br/>HeroSection, BrandCinematic, ProductCard"]
        ContextSys["Global State & Context Layer<br/>AuthContext, CartContext, ShopperContext"]
        ServiceLayer["Frontend Service Client (Axios / Fetch API)<br/>Bearer JWT Interceptors"]
        AppRouter --> UIComp
        UIComp --> ContextSys
        ContextSys --> ServiceLayer
    end

    subgraph BackendAPI ["3. Tầng Dịch Vụ Backend (.NET 10 Web API)"]
        direction TB
        APIController["API Controllers & Middlewares (Port 5000)<br/>Auth, Products, Orders, Inventory, Stats"]
        SecurityEngine["JWT Auth & Role-Based Authorization Guard<br/>Customer (1), Seller (2), Admin (3)"]
        BLLService["Business Logic Layer (Services & Validation)<br/>Anti-Overselling Guard, AIService, AutoMapper"]
        DALRepo["Data Access Layer (Repository Pattern)<br/>Unit of Work, EF Core 10, Fluent API"]
        
        APIController --> SecurityEngine
        APIController --> BLLService
        BLLService --> DALRepo
    end

    subgraph DatabaseLayer ["4. Tầng Dữ Liệu & Lưu Trữ"]
        MSSQL[("Microsoft SQL Server 2022 (Port 1433)<br/>Database: EcommerceAethelgardDb")]
        LocalStore[("Trình duyệt LocalStorage<br/>Khách vãng lai: Cart State & JWT Token")]
    end

    WebBrowser -->|HTTP Requests / HTML5 DOM| AppRouter
    ContextSys -->|Lưu trữ & Khôi phục giỏ hàng| LocalStore
    LocalStore -->|Đọc trạng thái offline| ContextSys
    ServiceLayer -->|RESTful API Calls / Bearer JWT| APIController
    DALRepo -->|Entity Framework Core 10 / TCP 1433| MSSQL
```

---

## 🏛️ II. KIẾN TRÚC PHẦN MỀM (SOFTWARE DESIGN & CODE ARCHITECTURE)

### 1. Kiến trúc Backend (.NET Clean Architecture / 4-Tier Pattern)
Mã nguồn Backend được phân tách thành 4 tầng riêng biệt nhằm tuân thủ nguyên lý đơn nhiệm (Single Responsibility Principle) và khả năng mở rộng cao:

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
  - Tiếp nhận các HTTP Request, xử lý định tuyến (Routing), kiểm tra token qua JWT Middleware.
  - Controllers chính: `AuthController`, `ProductsController`, `OrdersController`, `InventoryAndStatsControllers`, `StoresAndSeedControllers`.
  - Kiểm soát lỗi tập trung với Custom Exception Handling Middleware và tích hợp tài liệu OpenAPI Swagger tại `/swagger`.
* **`Ecommerce.BLL` (Business Logic Layer)**:
  - Xử lý toàn bộ nghiệp vụ cốt lõi: thuật toán trừ tồn kho chống bán khống (Anti-Overselling), quản lý đơn hàng đa trạng thái, đối soát tài chính và trợ lý thời trang thông minh `AIService`.
  - Các Services: `AuthService`, `ProductService`, `OrderService`, `InventoryService`, `StatisticsService`, `StoreService`, `AIService`.
  - Tự động chuyển đổi dữ liệu thông qua thư viện **AutoMapper**.
* **`Ecommerce.DAL` (Data Access Layer)**:
  - Tương tác với SQL Server thông qua **Entity Framework Core 10**.
  - Áp dụng mẫu thiết kế **Generic Repository Pattern** (`IGenericRepository<T>`) và **Unit of Work Pattern** (`IUnitOfWork`), bảo đảm tính toàn vẹn giao dịch (ACID).
  - Cấu hình quan hệ bảng, khóa ngoại, chỉ mục hiệu năng cao bằng Fluent API trong `EntityConfigurations.cs`.
* **`Ecommerce.Common` (Domain Entities & Shared Core)**:
  - Chứa các thực thể Domain: `User`, `Store`, `Product`, `ProductVariant`, `Category`, `Order`, `OrderItem`, `Review`, `TransactionRecord`.
  - Định nghĩa các Enum chuẩn: `UserRole` (Customer, Seller, Admin), `OrderStatus`, `PaymentStatus`, `StockStatus`.

---

### 2. Kiến trúc Thành phần Frontend (Next.js 15 Component & State Architecture)
Thay vì cây thư mục dạng text, kiến trúc Frontend được trực quan hóa qua biểu đồ phân lớp thành phần và luồng dữ liệu như sau:

```mermaid
flowchart TD
    subgraph AppRouterLayer ["Tầng Trang & Định Tuyến (App Router)"]
        direction LR
        P_Home["/ (Trang Chủ Mall)"]
        P_Login["/login (Xác Thực & OTP)"]
        P_Detail["/product-detail/[id] (Boutique)"]
        P_Orders["/orders (Quản Lý Đơn)"]
        P_Inv["/inventory (Quản Lý Kho)"]
        P_Stats["/income-statistics (Tài Chính)"]
        P_Profile["/shop-profile (Hồ Sơ Shop)"]
    end

    subgraph ComponentLayer ["Tầng Giao Diện Người Dùng (Components)"]
        NavbarComp["Navbar (Header & Role Guard)"]
        HeroComp["HeroSection (AI Search & Autocomplete)"]
        CinemaComp["BrandCinematicShowcase (Slideshow 10s)"]
        CatalogComp["ProductFilters & SellerProductCard"]
        DrawerComp["SellerDrawer (Chi Tiết & Sửa SP)"]
        CommerceComp["CustomerCommerceLayer (Cart & Checkout Modal)"]
        NotiComp["NotificationBell (Thông Báo Theo Role)"]
        ConfirmComp["ConfirmDialog (Xác Nhận Hành Động)"]
    end

    subgraph StateLayer ["Tầng Quản Lý Trạng Thái (Global Contexts)"]
        AuthCtx["AuthContext (JWT, User Info, Role)"]
        CartCtx["CartContext (Giỏ Hàng, Đồng Bộ LocalStorage)"]
        ShopperCtx["ShopperContext (Wishlist, Lịch Sử Xem)"]
        ToastCtx["ToastContext (Thông Báo Tương Tác)"]
    end

    subgraph ServiceLayer ["Tầng Kết Nối API (Services Client)"]
        APIClient["API Client (Axios Base Client)"]
        AuthSvc["auth.service.ts"]
        ProdSvc["product.service.ts"]
        OrderSvc["order.service.ts"]
    end

    AppRouterLayer --> ComponentLayer
    ComponentLayer --> StateLayer
    StateLayer --> ServiceLayer
    ServiceLayer --> APIClient
```

---

### 3. Kiến trúc Luồng Dữ liệu Toàn cục (Global State Flow)
Biểu đồ mô tả sự tương tác giữa các Context trong ứng dụng:

```mermaid
flowchart TD
    UserAction["Hành động của Người dùng (Click, Gõ phím, Đặt hàng)"]

    subgraph ContextEngine ["Bộ Máy Quản Lý Trạng Thái Toàn Cục (Context Engine)"]
        Auth["AuthContext<br/>• Quản lý phiên JWT<br/>• Trạng thái User & Role (Customer/Seller/Admin)<br/>• Login / Logout / Register"]
        Cart["CartContext<br/>• Danh sách mặt hàng (CartItem)<br/>• Tính tổng số lượng & Thành tiền<br/>• Tự động đồng bộ LocalStorage"]
        Shopper["ShopperContext<br/>• Danh sách yêu thích (Wishlist)<br/>• Lịch sử sản phẩm đã xem"]
        Toast["ToastContext<br/>• Hiển thị thông báo Toast nổi (Success / Error / Info)"]
    end

    subgraph Overlays ["Lớp Trực Quan Hóa Toàn Cục"]
        CommLayer["CustomerCommerceLayer<br/>• Cart Drawer trượt phải<br/>• Checkout Modal nhập thông tin giao nhận<br/>• Order Success Modal kèm mã vận đơn"]
    end

    UserAction --> Auth
    UserAction --> Cart
    UserAction --> Shopper
    Cart --> CommLayer
    Auth --> CommLayer
    CommLayer --> Toast
```

---

## 📊 III. BIỂU ĐỒ PHÂN RÃ CHỨC NĂNG (FUNCTIONAL DECOMPOSITION DIAGRAM - FDD)

Hệ thống được phân rã thành 4 phân hệ chính:

```mermaid
flowchart TD
    Root["HỆ THỐNG TMĐT THỜI TRANG CAO CẤP AETHELGARD MALL"]

    SubBuyer["Phân Hệ Người Mua<br/>(Customer / Guest)"]
    SubSeller["Phân Hệ Người Bán<br/>(Seller / Merchant)"]
    SubAdmin["Phân Hệ Quản Trị<br/>(System Admin)"]
    SubCommon["Phân Hệ Hạ Tầng & Bảo Mật<br/>(Core Services & DevOps)"]

    Root --> SubBuyer
    Root --> SubSeller
    Root --> SubAdmin
    Root --> SubCommon

    %% Customer Functions
    F_Search["Tìm Kiếm & Gợi Ý AI<br/>(Autocomplete, Thẻ Tag, Lọc Danh Mục)"]
    F_Cinema["Trưng Bày Cinematic Runway<br/>(Slideshow 14 Thương Hiệu Xa Xỉ)"]
    F_Detail["Trang Chi Tiết Boutique<br/>(Chọn Size/Màu, AI Stylist, Đánh Giá)"]
    F_Cart["Quản Lý Giỏ Hàng<br/>(Cập Nhật SL, Đồng Bộ LocalStorage)"]
    F_Checkout["Thanh Toán An Toàn<br/>(COD, Chuyển Khoản, Khóa Tồn Kho)"]
    F_Noti["Thông Báo Đơn Hàng Khách<br/>(Kênh Riêng Biệt Cho Khách)"]
    SubBuyer --> F_Search
    SubBuyer --> F_Cinema
    SubBuyer --> F_Detail
    SubBuyer --> F_Cart
    SubBuyer --> F_Checkout
    SubBuyer --> F_Noti

    %% Seller Functions
    S_Inv["Quản Lý Kho Hàng<br/>(4 KPI Kho, Bảng SKU, Restock Hàng)"]
    S_Order["Quản Lý Đơn Hàng<br/>(Tra Cứu Vận Đơn, Đổi Trạng Thái)"]
    S_Finance["Báo Cáo Doanh Thu<br/>(Ma Trận Dòng Tiền, Gauge Lợi Nhuận)"]
    S_Brand["Quản Trị Hồ Sơ Gian Hàng<br/>(Trưng Bày Bộ Sưu Tập Riêng)"]
    SubSeller --> S_Inv
    SubSeller --> S_Order
    SubSeller --> S_Finance
    SubSeller --> S_Brand

    %% Admin Functions
    A_User["Quản Trị Người Dùng<br/>(Phân Quyền RBAC, Khóa/Mở)"]
    A_Store["Quản Trị Gian Hàng & Đối Tác"]
    A_Cat["Quản Trị Danh Mục Hệ Thống"]
    A_Seed["Khởi Tạo Dữ Liệu Seeder 20 Luxury"]
    SubAdmin --> A_User
    SubAdmin --> A_Store
    SubAdmin --> A_Cat
    SubAdmin --> A_Seed

    %% Common Functions
    C_Auth["Xác Thực Đa Tầng JWT Token"]
    C_RBAC["Middleware Kiểm Soát Quyền Sở Hữu"]
    C_Docker["Container Hóa Đa Dịch Vụ Docker"]
    SubCommon --> C_Auth
    SubCommon --> C_RBAC
    SubCommon --> C_Docker
```

---

## 🎯 IV. CÁC BIỂU ĐỒ USE CASE (USE CASE DIAGRAMS)

### 1. Biểu đồ Use Case Tổng quát Toàn Hệ thống
Xác định 3 tác nhân chính: **Khách hàng (Customer)**, **Người bán (Seller)**, và **Quản trị viên (Admin)**.

```mermaid
flowchart LR
    ActorBuyer(("Khách Hàng<br/>(Customer)"))
    ActorSeller(("Người Bán<br/>(Seller)"))
    ActorAdmin(("Quản Trị Viên<br/>(Admin)"))

    subgraph SystemBoundary ["HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ AETHELGARD MALL"]
        UC_Auth(["Đăng ký / Đăng nhập / Đổi MK"])
        UC_Search(["Tìm kiếm Thông minh & Autocomplete"])
        UC_AI(["Tư vấn phối đồ AI Stylist"])
        UC_Cart(["Quản lý Giỏ hàng Toàn cục"])
        UC_Order(["Đặt hàng & Khóa Tồn kho"])
        UC_TrackOrder(["Tra cứu Trạng thái Vận đơn"])

        UC_ManageInv(["Quản lý Kho & Nhập Thêm Hàng"])
        UC_ManageOrder(["Cập nhật Tiến độ Đơn hàng"])
        UC_ViewStats(["Xem Thống kê Doanh số & Lợi nhuận"])

        UC_ManageUsers(["Phân quyền & Quản lý Tài khoản"])
        UC_ManageStores(["Quản lý Danh mục & Cửa hàng"])
        UC_Seed(["Khởi tạo Dữ liệu Mẫu (Seeder)"])
    end

    ActorBuyer --> UC_Auth
    ActorBuyer --> UC_Search
    ActorBuyer --> UC_AI
    ActorBuyer --> UC_Cart
    ActorBuyer --> UC_Order
    ActorBuyer --> UC_TrackOrder

    ActorSeller --> UC_Auth
    ActorSeller --> UC_ManageInv
    ActorSeller --> UC_ManageOrder
    ActorSeller --> UC_ViewStats

    ActorAdmin --> UC_Auth
    ActorAdmin --> UC_ManageUsers
    ActorAdmin --> UC_ManageStores
    ActorAdmin --> UC_Seed
    ActorAdmin --> UC_ManageOrder
```

---

### 2. Biểu đồ Use Case Chi tiết Phân hệ Người mua (Customer)

```mermaid
flowchart LR
    Customer(("Khách Mua Hàng"))

    subgraph ShoppingContext ["Phân Hệ Mua Sắm & Đặt Hàng"]
        UC1(["Tìm kiếm với Autocomplete & Gợi ý Brand"])
        UC2(["Xem chi tiết sản phẩm & Chọn Size/Màu"])
        UC3(["Nhận gợi ý phối đồ từ AI Stylist"])
        UC4(["Thêm sản phẩm vào giỏ hàng"])
        UC5(["Cập nhật số lượng & Xóa mặt hàng"])
        UC6(["Tiến hành Đặt hàng (Checkout)"])
        UC7(["Kiểm tra số lượng tồn kho khả dụng"])
        UC8(["Tạo đơn hàng & Nhận mã AG-XXXX"])
        UC9(["Nhận thông báo cập nhật đơn hàng"])

        UC6 -.->|"(include)"| UC7
        UC6 -.->|"(include)"| UC8
        UC2 -.->|"(extend)"| UC3
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

    subgraph SellerContext ["Phân Hệ Vận Hành & Bán Hàng"]
        S_UC1(["Xem 4 KPI Kho hàng & Bảng SKU"])
        S_UC2(["Nhập thêm hàng hóa (Restock Modal)"])
        S_UC3(["Xem 4 KPI Đơn hàng & Bộ lọc Trạng thái"])
        S_UC4(["Mở Drawer tra cứu hành trình vận đơn"])
        S_UC5(["Cập nhật trạng thái đơn (Shipped/Delivered)"])
        S_UC6(["Kiểm tra quyền sở hữu đơn hàng của Shop"])
        S_UC7(["Xem Ma trận Doanh thu & Lịch sử dòng tiền"])

        S_UC2 -.->|"(include)"| S_UC1
        S_UC5 -.->|"(include)"| S_UC6
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

Mô hình dữ liệu quan hệ được chuẩn hóa theo chuẩn 3NF, phản ánh chính xác cấu trúc thực tế của hệ thống Database:

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ PRODUCTS : "sells"
    USERS ||--o{ REVIEWS : "writes"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ ORDER_ITEMS : "included_in"
    PRODUCTS ||--o{ REVIEWS : "receives"
    ORDERS ||--|{ ORDER_ITEMS : "consists_of"

    USERS {
        int Id PK
        string FullName
        string Email
        string PasswordHash
        int Role "1: Customer, 2: Seller, 3: Admin"
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
        int SellerId FK "FK -> Users.Id"
        int CategoryId FK "FK -> Categories.Id"
        string Name
        string Slug
        string Sku
        string CollectionName
        string Description
        decimal BasePrice
        decimal OriginalPrice
        int DiscountPercent
        string ImageUrl
        string GalleryUrlsJson
        int StockQuantity
        int StockStatus "1: InStock, 2: LowStock, 3: OutOfStock"
        string Material
        string CountryOfOrigin
        double Rating
        int ReviewCount
        bool IsActive
        datetime CreatedAt
    }

    PRODUCT_VARIANTS {
        int Id PK
        int ProductId FK "FK -> Products.Id"
        string Size
        string Color
        string Sku
        decimal Price
        int StockQuantity
        datetime CreatedAt
    }

    REVIEWS {
        int Id PK
        int ProductId FK "FK -> Products.Id"
        int UserId FK "FK -> Users.Id"
        string CustomerName
        int Rating
        string Comment
        datetime CreatedAt
    }

    ORDERS {
        int Id PK
        string OrderCode UK "Format: AG-2026-XXXX"
        int UserId FK "FK -> Users.Id (Nullable)"
        string CustomerName
        string CustomerEmail
        string CustomerPhone
        string ShippingAddress
        string PaymentMethod
        int Status "1: Pending, 2: Confirmed, 3: Shipped, 4: Delivered, 5: Cancelled"
        int PaymentStatus "1: Unpaid, 2: Paid"
        string Carrier "FedEx Logistics"
        string TrackingCode
        int ProgressStep "1 to 4"
        decimal Subtotal
        decimal ShippingCharge
        decimal Taxes
        decimal TotalAmount
        datetime CreatedAt
    }

    ORDER_ITEMS {
        int Id PK
        int OrderId FK "FK -> Orders.Id"
        int ProductId FK "FK -> Products.Id"
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
        string StoreCode UK "Mã Cửa Hàng"
        string BrandId "Brand Slug"
        string StoreName "Tên Gian Hàng"
        string StoreType "Flagship / Boutique"
        string City "Hà Nội / TP HCM"
        string Address "Địa chỉ chi tiết"
        double Latitude "Tọa độ Map"
        double Longitude "Tọa độ Map"
        string OperatingHours "Giờ mở cửa"
        datetime CreatedAt
    }

    TRANSACTION_RECORDS {
        int Id PK
        string TransactionCode UK "Mã Giao Dịch Đối Soát"
        string CustomerName
        string ProductName
        string Status "Success / Pending"
        int Quantity
        decimal UnitPrice
        decimal TotalAmount
        datetime CreatedAt
    }
```

---

## ⏱️ VI. CÁC BIỂU ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)

### 1. Luồng Xác thực Đăng nhập & Cấp phát Quyền (JWT Authentication & RBAC)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Dùng
    participant UI as Giao Diện Web (Next.js)
    participant AuthContext as React AuthContext
    participant AuthAPI as AuthController (.NET)
    participant AuthService as AuthService (BLL)
    participant DB as SQL Server Database

    User->>UI: Nhập Email và Mật khẩu
    UI->>AuthAPI: POST /api/auth/login (email, password)
    AuthAPI->>AuthService: LoginAsync(email, password)
    AuthService->>DB: Truy vấn User theo Email
    DB-->>AuthService: Trả về bản ghi User kèm PasswordHash và Role
    
    alt Sai mật khẩu hoặc không tìm thấy tài khoản
        AuthService-->>AuthAPI: Quăng lỗi UnauthorizedException
        AuthAPI-->>UI: HTTP 401 Unauthorized
        UI-->>User: Báo lỗi: Email hoặc mật khẩu không chính xác
    else Xác thực thông tin thành công
        AuthService->>AuthService: Verify hash BCrypt và tạo chuỗi JWT Token
        AuthService-->>AuthAPI: Trả về Token và UserDto (FullName, Role, Email)
        AuthAPI-->>UI: HTTP 200 OK kèm Token
        UI->>AuthContext: Lưu Token vào LocalStorage và cập nhật User State
        AuthContext-->>UI: Kích hoạt điều hướng giao diện theo Role tương ứng
        UI-->>User: Đăng nhập thành công và chuyển hướng trang chủ/dashboard
    end
```

---

### 2. Luồng Tìm kiếm Thời gian thực & Gợi ý Thông minh (Real-time Autocomplete Search)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant SearchBar as HeroSection Search Input
    participant Dropdown as Autocomplete Dropdown
    participant State as Frontend Search State
    participant Router as Next.js Router

    Customer->>SearchBar: Gõ từ khóa tìm kiếm (ví dụ: bal)
    SearchBar->>State: Cập nhật searchTerm và kích hoạt lọc gợi ý
    State->>State: Khớp từ khóa với Tên SP, SKU, Thương hiệu, Danh mục
    State-->>Dropdown: Hiển thị Header số lượng kết quả và Quick Tags
    Dropdown-->>Customer: Hiển thị sản phẩm phù hợp kèm Ảnh, Giá, Tồn kho

    alt Khách hàng click vào một sản phẩm gợi ý
        Customer->>Dropdown: Click vào dòng sản phẩm Balenciaga
        Dropdown->>Router: Điều hướng sang /product-detail/[id]
        Router-->>Customer: Mở trang chi tiết sản phẩm Boutique
    else Khách hàng nhấn Enter hoặc Xem tất cả
        Customer->>Dropdown: Nhấn Enter hoặc click Xem tất cả kết quả
        Dropdown->>State: Đóng dropdown
        Dropdown->>SearchBar: Cuộn mượt màn hình xuống danh mục sản phẩm #catalog
        SearchBar-->>Customer: Lưới sản phẩm được lọc theo từ khóa tìm kiếm
    end
```

---

### 3. Luồng Khách hàng Đặt hàng & Khóa Tồn kho Chống Bán Khống (Anti-Overselling Guard)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Mua Hàng
    participant Modal as CheckoutModal (React)
    participant OrderAPI as OrdersController
    participant OrderService as OrderService (BLL)
    participant UnitOfWork as IUnitOfWork (DAL)
    participant DB as SQL Server (MSSQL)

    Customer->>Modal: Bấm nút Xác Nhận Đặt Hàng
    Modal->>OrderAPI: POST /api/orders (CreateOrderDto + Items)
    OrderAPI->>OrderService: CreateOrderAsync(dto, currentUserId)
    
    rect rgb(240, 248, 255)
        note over OrderService, UnitOfWork: Bắt đầu Database Transaction bảo vệ toàn vẹn
        OrderService->>UnitOfWork: BeginTransactionAsync()
        loop Duyệt qua từng sản phẩm trong đơn
            OrderService->>DB: Lấy Product và Variants (Lock hàng để kiểm tra)
            DB-->>OrderService: Trả về StockQuantity khả dụng
            
            alt Số lượng đặt vượt quá tồn kho khả dụng
                OrderService-->>OrderAPI: Quăng lỗi InvalidOperationException (Hết hàng)
                OrderAPI-->>Modal: HTTP 400 Bad Request (Sản phẩm chỉ còn X sản phẩm)
                Modal-->>Customer: Báo lỗi đỏ từ chối thanh toán
            else Tồn kho hợp lệ
                OrderService->>OrderService: Trừ Product.StockQuantity -= Quantity
                OrderService->>OrderService: Cập nhật trạng thái StockStatus (InStock/LowStock/OutOfStock)
            end
        end

        OrderService->>DB: Tạo bản ghi Order AG-2026-XXXX và OrderItems
        OrderService->>DB: Lưu các thay đổi SaveChangesAsync()
        OrderService->>UnitOfWork: CommitTransactionAsync()
    end

    OrderService-->>OrderAPI: Trả về OrderDto hoàn tất
    OrderAPI-->>Modal: HTTP 201 Created kèm orderCode
    Modal->>Modal: Xóa giỏ hàng LocalStorage (clearCart)
    Modal-->>Customer: Mở OrderSuccessModal thông báo đặt hàng thành công!
```

---

### 4. Luồng Người bán Nhập thêm hàng vào kho (Restock Inventory)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Chủ Shop (Seller)
    participant InvUI as Trang Kho Hàng (/inventory)
    participant RestockModal as Modal Nhập Thêm Hàng
    participant InvAPI as InventoryAndStatsControllers
    participant InvService as InventoryService (BLL)
    participant DB as SQL Server Database

    Seller->>InvUI: Bấm nút Nhập Thêm trên dòng sản phẩm
    InvUI->>RestockModal: Mở popup nhập số lượng
    Seller->>RestockModal: Nhập số lượng bổ sung (ví dụ: +50) và Lưu
    RestockModal->>InvAPI: POST /api/inventory/restock (productId, additionalQuantity: 50)
    
    note over InvAPI: Kiểm tra quyền: Bearer Token phải thuộc Role Seller hoặc Admin
    InvAPI->>InvService: RestockProductAsync(productId, 50)
    InvService->>DB: Truy vấn Product theo Id
    DB-->>InvService: Bản ghi Product hiện tại
    
    InvService->>InvService: StockQuantity += 50
    InvService->>InvService: Cập nhật StockStatus = InStock
    InvService->>DB: SaveChangesAsync()
    DB-->>InvService: Ghi nhận thành công
    
    InvService-->>InvAPI: Trả về InventoryItemDto mới
    InvAPI-->>RestockModal: HTTP 200 OK
    RestockModal-->>InvUI: Đóng modal và kích hoạt reload dữ liệu
    InvUI-->>Seller: Bảng kiểm kê và các KPI kho cập nhật tức thì
```

---

### 5. Luồng Cập nhật Trạng thái Đơn hàng & Tra cứu Vận chuyển

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Chủ Shop
    participant OrdersUI as Trang Đơn Hàng (/orders)
    participant Drawer as Drawer Tra Cứu Vận Đơn
    participant OrderAPI as OrdersController
    participant OrderService as OrderService (BLL)
    participant DB as SQL Server Database

    Seller->>OrdersUI: Click vào mã đơn hàng AG-2026-XXXX
    OrdersUI->>Drawer: Mở khay trượt xem chi tiết lộ trình vận chuyển
    Seller->>Drawer: Nhấp nút Giao Cho Vận Chuyển (chuyển sang SHIPPED)
    Drawer->>OrderAPI: PUT /api/orders/[id]/status (status: SHIPPED)
    
    note over OrderAPI: Kiểm tra Authorization: Seller chỉ được sửa đơn hàng có sản phẩm của mình
    OrderAPI->>OrderService: UpdateOrderStatusAsync(orderId, SHIPPED, sellerId)
    OrderService->>DB: Lấy Order và OrderItems
    DB-->>OrderService: Thông tin đơn hàng
    
    OrderService->>OrderService: Cập nhật Status = Shipped và ProgressStep = 3
    OrderService->>OrderService: Cập nhật vị trí LastUpdateLocation = Kho Trung Chuyển
    OrderService->>DB: SaveChangesAsync()
    DB-->>OrderService: Cập nhật hoàn tất
    
    OrderService-->>OrderAPI: Trả về OrderDto mới nhất
    OrderAPI-->>Drawer: HTTP 200 OK
    Drawer->>Drawer: Timeline vận chuyển đổi sang trạng thái Đang Giao
    Drawer-->>Seller: Đổi badge trạng thái đơn hàng thành công
```

---

## 🌐 VII. KIẾN TRÚC ĐÓNG GÓI VÀ TRIỂN KHAI DOCKER (CONTAINERIZED DEPLOYMENT ARCHITECTURE)

Hệ thống được đóng gói hoàn chỉnh thành các Docker Container độc lập và quản lý tập trung thông qua **Docker Compose**:

```mermaid
flowchart TD
    subgraph ClientHost ["Thiết Bị Người Dùng & Quản Trị"]
        UserBrowser["Trình Duyệt Khách Hàng (Desktop / Mobile)"]
        AdminBrowser["Trình Duyệt Seller / Admin"]
    end

    subgraph DockerHost ["Hạ Tầng Ảo Hóa Docker Compose Host (aethelgard-network)"]
        subgraph WebContainer ["Container 1: ecommerce-web"]
            direction TB
            NextEngine["Next.js 15 Standalone Server<br/>Node.js 22 Alpine Base Image<br/>Port Container: 3000<br/>Port Host: 3001"]
        end

        subgraph ApiContainer ["Container 2: ecommerce-api"]
            direction TB
            DotNetEngine["ASP.NET Core 10 Web API<br/>.NET 10 Runtime Alpine Base Image<br/>Port Container: 5000<br/>Port Host: 5000<br/>Swagger UI tại /swagger"]
        end

        subgraph DbContainer ["Container 3: ecommerce-db"]
            direction TB
            MssqlEngine["Microsoft SQL Server 2022<br/>Image: mcr.microsoft.com/mssql/server:2022-latest<br/>Port Container: 1433<br/>Port Host: 1433"]
        end

        subgraph StorageVolume ["Persistent Volume Lưu Trữ"]
            VolData[("mssql_data Volume<br/>Duy trì dữ liệu DB không bị mất khi restart")]
        end
    end

    UserBrowser -->|Truy cập giao diện Web / Port 3001| NextEngine
    AdminBrowser -->|Truy cập giao diện Quản trị / Port 3001| NextEngine
    UserBrowser -->|Gọi RESTful API trực tiếp / Port 5000| DotNetEngine
    NextEngine -->|Server-Side Fetch nội bộ / Bridge Network| DotNetEngine
    DotNetEngine -->|Kết nối ADO.NET TCP / Port 1433| MssqlEngine
    MssqlEngine --- VolData
```

### 1. Chi tiết cấu hình các dịch vụ Docker Compose:
| Tên Dịch Vụ | Base Image | Port Ánh Xạ (Host:Container) | Vai Trò | Phụ Thuộc (Depends On) |
|---|---|---|---|---|
| **`ecommerce-db`** | `mcr.microsoft.com/mssql/server:2022-latest` | `1433:1433` | Cơ sở dữ liệu quan hệ MSSQL, gắn volume `mssql_data` | Không |
| **`ecommerce-api`** | Multi-stage: SDK 10 Build $\to$ ASP.NET 10 Runtime | `5000:5000` | Cung cấp RESTful API, tự động migrate và seed DB | `ecommerce-db` |
| **`ecommerce-web`** | Multi-stage: Node 22 Build $\to$ Standalone Next.js | `3001:3000` | Giao diện thời trang AI khách hàng và Dashboard | `ecommerce-api` |

### 2. Lệnh khởi chạy và quản trị hệ thống:
* **Khởi động toàn bộ cụm dịch vụ**:
  ```bash
  docker compose up -d --build
  ```
* **Theo dõi nhật ký vận hành (Logs)**:
  ```bash
  docker compose logs -f ecommerce-api
  docker compose logs -f ecommerce-web
  ```
* **Dừng và giải phóng tài nguyên**:
  ```bash
  docker compose down
  ```

---

## 🛡️ VIII. MA TRẬN PHÂN QUYỀN TRUY CẬP (ROLE-BASED ACCESS CONTROL - RBAC)

Hệ thống thiết lập hàng rào bảo mật nghiêm ngặt 3 lớp giữa Khách hàng (Customer), Chủ shop (Seller), và Quản trị viên (Admin):

```mermaid
flowchart LR
    Request["Yêu cầu Người dùng gửi tới Hệ thống"]
    
    subgraph GuardLayer ["Hàng Rào Kiểm Tra Phân Quyền (RBAC Guard)"]
        TokenCheck{"Có JWT Token hợp lệ?"}
        RoleCheck{"Kiểm tra Role Claim"}
        OwnerCheck{"Kiểm tra Quyền Sở Hữu"}
    end

    subgraph Targets ["Tài Nguyên Mục Tiêu"]
        PublicRes["Tài Nguyên Công Khai (Xem SP, Danh mục, Đặt hàng COD)"]
        SellerRes["Tài Nguyên Người Bán (/inventory, /orders, Restock)"]
        AdminRes["Tài Nguyên Quản Trị (/admin, Seed DB, Quản lý Cửa Hàng)"]
    end

    Request --> TokenCheck
    TokenCheck -- "Không" --> PublicRes
    TokenCheck -- "Có" --> RoleCheck
    
    RoleCheck -- "Customer" --> PublicRes
    RoleCheck -- "Seller" --> OwnerCheck
    OwnerCheck -- "Đúng Shop của mình" --> SellerRes
    OwnerCheck -- "Không khớp Shop" --> Deny["Từ chối truy cập (HTTP 403 Forbidden)"]
    RoleCheck -- "Admin" --> AdminRes
    RoleCheck -- "Admin" --> SellerRes
```

### Bảng Ma trận Phân quyền Chi tiết:

| Khu Vực / Tính Năng | Khách Vãng Lai (Guest) | Khách Hàng (Customer) | Người Bán (Seller) | Quản Trị Viên (Admin) |
|---|:---:|:---:|:---:|:---:|
| **Khám phá sản phẩm & Tìm kiếm AI** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **Xem chi tiết sản phẩm Boutique** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **Thêm vào giỏ & Đặt hàng** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **Kênh thông báo cá nhân** | ❌ Không | ✅ Thông báo Khách | ✅ Thông báo Shop | ✅ Toàn quyền |
| **Quản lý kho hàng (`/inventory`)** | ❌ Chặn | ❌ Chặn | ✅ Kho của Shop | ✅ Xem mọi kho |
| **Nhập thêm hàng hóa (Restock)** | ❌ Chặn | ❌ Chặn | ✅ Hàng của Shop | ✅ Mọi sản phẩm |
| **Đổi trạng thái đơn (`/orders`)** | ❌ Chặn | ❌ Chặn | ✅ Đơn thuộc Shop | ✅ Mọi đơn hàng |
| **Xem báo cáo tài chính (`/stats`)** | ❌ Chặn | ❌ Chặn | ✅ Shop của mình | ✅ Doanh thu toàn sàn |
| **Quản trị người dùng & Seed DB** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ✅ Toàn quyền |

---

*Báo cáo được hoàn thiện và đồng bộ hóa tự động theo kiến trúc mã nguồn thực tế của dự án Aethelgard Mall.*
