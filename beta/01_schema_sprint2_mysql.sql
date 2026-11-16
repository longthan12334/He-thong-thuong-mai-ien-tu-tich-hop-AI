-- ============================================================================
--  HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TÍCH HỢP AI
--  HTTMDTTHA-5 — Thiết kế CSDL cho Sprint 2
--  Phương ngữ: MySQL 8.0+
--  Nhóm 2 — Lớp 68CS3
--
--  PH1 + PH2 (nền tảng Sprint 1) dùng CREATE TABLE IF NOT EXISTS
--  nên chạy an toàn trên CSDL đã có sẵn bảng tài khoản.
--  PH3 + PH4 là phạm vi mới của Sprint 2.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- --------------------------------------------------------------------------
--  PH1 — Quản trị Người dùng & Phân quyền
-- --------------------------------------------------------------------------

-- users — Tài khoản người dùng
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng, định danh người dùng',
  `username` VARCHAR(50) NOT NULL COMMENT 'Tên đăng nhập, không trùng',
  `email` VARCHAR(150) NOT NULL COMMENT 'Email đăng nhập và nhận thông báo',
  `phone` VARCHAR(20) COMMENT 'Số điện thoại, dùng cho OTP và giao hàng',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu băm bằng BCrypt (cost 12)',
  `full_name` VARCHAR(150) NOT NULL COMMENT 'Họ tên đầy đủ',
  `avatar_url` VARCHAR(500) COMMENT 'Đường dẫn ảnh đại diện trên Object Storage',
  `gender` VARCHAR(10) COMMENT 'Giới tính: MALE / FEMALE / OTHER',
  `date_of_birth` DATE COMMENT 'Ngày sinh, dùng làm đặc trưng cho mô hình gợi ý',
  `status` VARCHAR(20) NOT NULL COMMENT 'ACTIVE / INACTIVE / LOCKED / DELETED',
  `email_verified_at` DATETIME COMMENT 'Thời điểm xác thực email thành công',
  `phone_verified_at` DATETIME COMMENT 'Thời điểm xác thực số điện thoại',
  `last_login_at` DATETIME COMMENT 'Lần đăng nhập gần nhất',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bản ghi',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `uq_users_username` UNIQUE (`username`),
  CONSTRAINT `uq_users_email` UNIQUE (`email`),
  CONSTRAINT `uq_users_phone` UNIQUE (`phone`),
  CONSTRAINT `ck_users_gender` CHECK (`gender` IN ('MALE', 'FEMALE', 'OTHER')),
  CONSTRAINT `ck_users_status` CHECK (`status` IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản người dùng';

-- roles — Vai trò hệ thống
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `role_code` VARCHAR(30) NOT NULL COMMENT 'Mã vai trò: ADMIN / SELLER / MEMBER / GUEST',
  `role_name` VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị của vai trò',
  `description` VARCHAR(255) COMMENT 'Diễn giải phạm vi trách nhiệm',
  `is_system` TINYINT(1) DEFAULT 0 COMMENT 'Vai trò mặc định của hệ thống, không được xóa',
  PRIMARY KEY (`role_id`),
  CONSTRAINT `uq_roles_role_code` UNIQUE (`role_code`),
  CONSTRAINT `ck_roles_role_code` CHECK (`role_code` IN ('ADMIN', 'SELLER', 'MEMBER', 'GUEST'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vai trò hệ thống';

-- permissions — Quyền thao tác
CREATE TABLE IF NOT EXISTS `permissions` (
  `permission_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `permission_code` VARCHAR(80) NOT NULL COMMENT 'Mã quyền, ví dụ PRODUCT_CREATE',
  `permission_name` VARCHAR(150) NOT NULL COMMENT 'Tên quyền hiển thị',
  `module_name` VARCHAR(50) NOT NULL COMMENT 'Phân hệ chức năng chứa quyền',
  PRIMARY KEY (`permission_id`),
  CONSTRAINT `uq_permissions_permission_code` UNIQUE (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quyền thao tác';

-- user_roles — Gán vai trò cho người dùng
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` BIGINT NOT NULL COMMENT 'Người dùng được gán vai trò',
  `role_id` INT NOT NULL COMMENT 'Vai trò được gán',
  `assigned_by` BIGINT COMMENT 'Quản trị viên thực hiện gán quyền',
  `assigned_at` DATETIME NOT NULL COMMENT 'Thời điểm gán',
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Gán vai trò cho người dùng';

-- role_permissions — Gán quyền cho vai trò
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT NOT NULL COMMENT 'Vai trò',
  `permission_id` INT NOT NULL COMMENT 'Quyền được cấp',
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`permission_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Gán quyền cho vai trò';

-- user_addresses — Sổ địa chỉ giao hàng
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `address_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `user_id` BIGINT NOT NULL COMMENT 'Chủ sở hữu địa chỉ',
  `recipient_name` VARCHAR(150) NOT NULL COMMENT 'Tên người nhận hàng',
  `recipient_phone` VARCHAR(20) NOT NULL COMMENT 'Điện thoại người nhận',
  `province_code` VARCHAR(10) NOT NULL COMMENT 'Mã tỉnh/thành phố',
  `district_code` VARCHAR(10) NOT NULL COMMENT 'Mã quận/huyện',
  `ward_code` VARCHAR(10) NOT NULL COMMENT 'Mã phường/xã',
  `street_address` VARCHAR(255) NOT NULL COMMENT 'Số nhà, tên đường',
  `address_type` VARCHAR(20) COMMENT 'HOME / OFFICE / PICKUP',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT 'Địa chỉ mặc định khi đặt hàng',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo',
  PRIMARY KEY (`address_id`),
  CONSTRAINT `ck_user_addresses_address_type` CHECK (`address_type` IN ('HOME', 'OFFICE', 'PICKUP')),
  CONSTRAINT `fk_user_addresses_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sổ địa chỉ giao hàng';

-- auth_tokens — Token xác thực
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `token_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `user_id` BIGINT NOT NULL COMMENT 'Chủ sở hữu token',
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'Giá trị token đã băm SHA-256',
  `token_type` VARCHAR(30) NOT NULL COMMENT 'REFRESH / RESET_PASSWORD / VERIFY_EMAIL',
  `device_info` VARCHAR(255) COMMENT 'Thông tin thiết bị đăng nhập',
  `ip_address` VARCHAR(45) COMMENT 'Địa chỉ IP phát hành token',
  `expires_at` DATETIME NOT NULL COMMENT 'Thời điểm hết hạn',
  `revoked_at` DATETIME COMMENT 'Thời điểm bị thu hồi (đăng xuất)',
  PRIMARY KEY (`token_id`),
  CONSTRAINT `uq_auth_tokens_token_hash` UNIQUE (`token_hash`),
  CONSTRAINT `ck_auth_tokens_token_type` CHECK (`token_type` IN ('REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL')),
  CONSTRAINT `fk_auth_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token xác thực';

-- login_histories — Nhật ký đăng nhập
CREATE TABLE IF NOT EXISTS `login_histories` (
  `history_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `user_id` BIGINT COMMENT 'Tài khoản thực hiện đăng nhập',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP nguồn',
  `user_agent` VARCHAR(500) COMMENT 'Trình duyệt/thiết bị',
  `login_status` VARCHAR(20) NOT NULL COMMENT 'SUCCESS / FAILED',
  `failure_reason` VARCHAR(100) COMMENT 'Lý do thất bại (sai mật khẩu, khóa tài khoản)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận',
  PRIMARY KEY (`history_id`),
  CONSTRAINT `ck_login_histories_login_status` CHECK (`login_status` IN ('SUCCESS', 'FAILED')),
  CONSTRAINT `fk_login_histories_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký đăng nhập';

-- --------------------------------------------------------------------------
--  PH2 — Người bán & Cửa hàng
-- --------------------------------------------------------------------------

-- shops — Cửa hàng / Gian hàng
CREATE TABLE IF NOT EXISTS `shops` (
  `shop_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `owner_user_id` BIGINT COMMENT 'Tài khoản chủ shop (quan hệ 1-1)',
  `shop_name` VARCHAR(200) NOT NULL COMMENT 'Tên gian hàng',
  `slug` VARCHAR(220) NOT NULL COMMENT 'Đường dẫn thân thiện SEO',
  `logo_url` VARCHAR(500) COMMENT 'Ảnh đại diện gian hàng',
  `description` TEXT COMMENT 'Giới thiệu gian hàng',
  `business_license_no` VARCHAR(50) COMMENT 'Số giấy phép kinh doanh',
  `tax_code` VARCHAR(20) COMMENT 'Mã số thuế',
  `rating_avg` DECIMAL(3,2) DEFAULT 0 COMMENT 'Điểm uy tín trung bình (0.00 - 5.00)',
  `rating_count` INT DEFAULT 0 COMMENT 'Tổng số lượt đánh giá',
  `follower_count` INT DEFAULT 0 COMMENT 'Số người theo dõi',
  `status` VARCHAR(20) NOT NULL COMMENT 'PENDING / ACTIVE / SUSPENDED / CLOSED',
  `verified_at` DATETIME COMMENT 'Thời điểm được duyệt định danh',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đăng ký gian hàng',
  PRIMARY KEY (`shop_id`),
  CONSTRAINT `uq_shops_owner_user_id` UNIQUE (`owner_user_id`),
  CONSTRAINT `uq_shops_slug` UNIQUE (`slug`),
  CONSTRAINT `ck_shops_status` CHECK (`status` IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
  CONSTRAINT `fk_shops_owner_user_id` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cửa hàng / Gian hàng';

-- shop_followers — Theo dõi cửa hàng
CREATE TABLE IF NOT EXISTS `shop_followers` (
  `user_id` BIGINT NOT NULL COMMENT 'Người theo dõi',
  `shop_id` BIGINT NOT NULL COMMENT 'Cửa hàng được theo dõi',
  `followed_at` DATETIME NOT NULL COMMENT 'Thời điểm bắt đầu theo dõi',
  PRIMARY KEY (`user_id`, `shop_id`),
  CONSTRAINT `fk_shop_followers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shop_followers_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`shop_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Theo dõi cửa hàng';

-- warehouses — Kho hàng
CREATE TABLE IF NOT EXISTS `warehouses` (
  `warehouse_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `shop_id` BIGINT NOT NULL COMMENT 'Gian hàng sở hữu kho',
  `warehouse_name` VARCHAR(150) NOT NULL COMMENT 'Tên kho',
  `address` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ kho, dùng tính phí vận chuyển',
  `contact_phone` VARCHAR(20) COMMENT 'Điện thoại liên hệ kho',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT 'Kho lấy hàng mặc định',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động',
  PRIMARY KEY (`warehouse_id`),
  CONSTRAINT `fk_warehouses_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`shop_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kho hàng';

-- --------------------------------------------------------------------------
--  PH3 — Danh mục & Sản phẩm
-- --------------------------------------------------------------------------

-- categories — Danh mục sản phẩm
CREATE TABLE `categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `parent_id` INT COMMENT 'Danh mục cha, NULL nếu là gốc (đệ quy)',
  `category_name` VARCHAR(150) NOT NULL COMMENT 'Tên danh mục',
  `slug` VARCHAR(180) NOT NULL COMMENT 'Đường dẫn thân thiện',
  `icon_url` VARCHAR(500) COMMENT 'Biểu tượng danh mục',
  `level` SMALLINT NOT NULL COMMENT 'Cấp bậc trong cây (1, 2, 3)',
  `path` VARCHAR(255) NOT NULL COMMENT 'Đường dẫn phân cấp, ví dụ /1/15/78',
  `sort_order` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hiển thị',
  PRIMARY KEY (`category_id`),
  CONSTRAINT `uq_categories_slug` UNIQUE (`slug`),
  CONSTRAINT `fk_categories_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm';

-- brands — Thương hiệu
CREATE TABLE `brands` (
  `brand_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `brand_name` VARCHAR(150) NOT NULL COMMENT 'Tên thương hiệu',
  `slug` VARCHAR(180) COMMENT 'Đường dẫn thân thiện',
  `logo_url` VARCHAR(500) COMMENT 'Logo thương hiệu',
  `country` VARCHAR(80) COMMENT 'Quốc gia xuất xứ',
  PRIMARY KEY (`brand_id`),
  CONSTRAINT `uq_brands_brand_name` UNIQUE (`brand_name`),
  CONSTRAINT `uq_brands_slug` UNIQUE (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thương hiệu';

-- products — Sản phẩm
CREATE TABLE `products` (
  `product_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `shop_id` BIGINT NOT NULL COMMENT 'Gian hàng đăng bán',
  `category_id` INT NOT NULL COMMENT 'Danh mục lá của sản phẩm',
  `brand_id` INT COMMENT 'Thương hiệu, có thể NULL',
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm',
  `slug` VARCHAR(280) NOT NULL COMMENT 'Đường dẫn thân thiện',
  `short_description` VARCHAR(500) COMMENT 'Mô tả ngắn, dùng sinh vector nhúng',
  `full_description` TEXT COMMENT 'Mô tả chi tiết dạng HTML',
  `base_price` DECIMAL(15,2) NOT NULL COMMENT 'Giá niêm yết gốc (VND)',
  `status` VARCHAR(20) NOT NULL COMMENT 'DRAFT / ACTIVE / HIDDEN / OUT_OF_STOCK',
  `approval_status` VARCHAR(20) NOT NULL COMMENT 'PENDING / APPROVED / REJECTED (kiểm duyệt AI)',
  `view_count` BIGINT DEFAULT 0 COMMENT 'Số lượt xem, đặc trưng cho mô hình xếp hạng',
  `sold_count` INT DEFAULT 0 COMMENT 'Số lượng đã bán',
  `rating_avg` DECIMAL(3,2) DEFAULT 0 COMMENT 'Điểm đánh giá trung bình',
  `rating_count` INT DEFAULT 0 COMMENT 'Số lượt đánh giá',
  `is_featured` TINYINT(1) DEFAULT 0 COMMENT 'Sản phẩm nổi bật',
  `published_at` DATETIME COMMENT 'Thời điểm lên sàn',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  PRIMARY KEY (`product_id`),
  CONSTRAINT `uq_products_slug` UNIQUE (`slug`),
  CONSTRAINT `ck_products_status` CHECK (`status` IN ('DRAFT', 'ACTIVE', 'HIDDEN', 'OUT_OF_STOCK')),
  CONSTRAINT `ck_products_approval_status` CHECK (`approval_status` IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT `ck_products_base_price_0` CHECK (`base_price` >= 0),
  CONSTRAINT `fk_products_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`shop_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_products_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`brand_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm';

-- product_images — Ảnh sản phẩm
CREATE TABLE `product_images` (
  `image_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `product_id` BIGINT NOT NULL COMMENT 'Sản phẩm chứa ảnh',
  `image_url` VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh trên Object Storage',
  `alt_text` VARCHAR(255) COMMENT 'Văn bản thay thế cho SEO',
  `sort_order` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Ảnh đại diện, nguồn sinh vector ảnh',
  PRIMARY KEY (`image_id`),
  CONSTRAINT `fk_product_images_product_id` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ảnh sản phẩm';

-- product_variants — Biến thể sản phẩm (SKU)
CREATE TABLE `product_variants` (
  `variant_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `product_id` BIGINT NOT NULL COMMENT 'Sản phẩm cha',
  `sku_code` VARCHAR(80) NOT NULL COMMENT 'Mã SKU duy nhất toàn hệ thống',
  `variant_name` VARCHAR(200) NOT NULL COMMENT 'Tên biến thể, ví dụ Đỏ - Size L',
  `price` DECIMAL(15,2) NOT NULL COMMENT 'Giá bán của biến thể',
  `sale_price` DECIMAL(15,2) COMMENT 'Giá khuyến mãi hiện hành',
  `image_url` VARCHAR(500) COMMENT 'Ảnh riêng của biến thể',
  `weight_gram` INT COMMENT 'Trọng lượng, dùng tính cước vận chuyển',
  `barcode` VARCHAR(50) COMMENT 'Mã vạch',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái kinh doanh',
  PRIMARY KEY (`variant_id`),
  CONSTRAINT `uq_product_variants_sku_code` UNIQUE (`sku_code`),
  CONSTRAINT `ck_product_variants_price_0` CHECK (`price` >= 0),
  CONSTRAINT `fk_product_variants_product_id` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biến thể sản phẩm (SKU)';

-- attributes — Thuộc tính
CREATE TABLE `attributes` (
  `attribute_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `attribute_name` VARCHAR(100) NOT NULL COMMENT 'Tên thuộc tính: Màu sắc, Kích cỡ, RAM',
  `data_type` VARCHAR(20) NOT NULL COMMENT 'TEXT / NUMBER / SELECT / COLOR',
  `is_variant_attribute` TINYINT(1) DEFAULT 0 COMMENT 'Có dùng để sinh biến thể hay không',
  `category_id` INT COMMENT 'Danh mục áp dụng thuộc tính',
  PRIMARY KEY (`attribute_id`),
  CONSTRAINT `ck_attributes_data_type` CHECK (`data_type` IN ('TEXT', 'NUMBER', 'SELECT', 'COLOR')),
  CONSTRAINT `fk_attributes_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thuộc tính';

-- attribute_values — Giá trị thuộc tính
CREATE TABLE `attribute_values` (
  `value_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `attribute_id` INT NOT NULL COMMENT 'Thuộc tính chứa giá trị',
  `value_text` VARCHAR(150) NOT NULL COMMENT 'Giá trị cụ thể: Đỏ, Xanh, 128GB',
  `sort_order` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  PRIMARY KEY (`value_id`),
  CONSTRAINT `fk_attribute_values_attribute_id` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`attribute_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giá trị thuộc tính';

-- variant_attribute_values — Tổ hợp thuộc tính của biến thể
CREATE TABLE `variant_attribute_values` (
  `variant_id` BIGINT NOT NULL COMMENT 'Biến thể',
  `attribute_id` INT NOT NULL COMMENT 'Thuộc tính cấu thành',
  `value_id` INT NOT NULL COMMENT 'Giá trị được chọn',
  PRIMARY KEY (`variant_id`, `attribute_id`),
  CONSTRAINT `fk_variant_attribute_values_variant_id` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_variant_attribute_values_attribute_id` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`attribute_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_variant_attribute_values_value_id` FOREIGN KEY (`value_id`) REFERENCES `attribute_values`(`value_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tổ hợp thuộc tính của biến thể';

-- product_attributes — Thông số kỹ thuật sản phẩm
CREATE TABLE `product_attributes` (
  `product_id` BIGINT NOT NULL COMMENT 'Sản phẩm',
  `attribute_id` INT NOT NULL COMMENT 'Thuộc tính mô tả',
  `value_text` VARCHAR(255) NOT NULL COMMENT 'Giá trị thông số, dùng cho bộ lọc tìm kiếm',
  PRIMARY KEY (`product_id`, `attribute_id`),
  CONSTRAINT `fk_product_attributes_product_id` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_attributes_attribute_id` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`attribute_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông số kỹ thuật sản phẩm';

-- inventories — Tồn kho
CREATE TABLE `inventories` (
  `inventory_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `variant_id` BIGINT NOT NULL COMMENT 'Biến thể được quản lý tồn',
  `warehouse_id` BIGINT NOT NULL COMMENT 'Kho lưu trữ',
  `qty_on_hand` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng thực tế trong kho',
  `qty_reserved` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đã giữ chỗ cho đơn chưa hoàn tất',
  `safety_stock` INT DEFAULT 0 COMMENT 'Ngưỡng tồn tối thiểu để cảnh báo nhập hàng',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  PRIMARY KEY (`inventory_id`),
  CONSTRAINT `uq_inventories_variant_id_warehouse_id` UNIQUE (`variant_id`, `warehouse_id`),
  CONSTRAINT `ck_inventories_qty_on_hand_0` CHECK (`qty_on_hand` >= 0),
  CONSTRAINT `ck_inventories_qty_reserved_0` CHECK (`qty_reserved` >= 0),
  CONSTRAINT `ck_inventories_qty_reserved_qty_on_hand` CHECK (`qty_reserved` <= `qty_on_hand`),
  CONSTRAINT `fk_inventories_variant_id` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_inventories_warehouse_id` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`warehouse_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tồn kho';

-- inventory_transactions — Nhật ký biến động kho
CREATE TABLE `inventory_transactions` (
  `transaction_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `inventory_id` BIGINT NOT NULL COMMENT 'Dòng tồn kho bị tác động',
  `transaction_type` VARCHAR(20) NOT NULL COMMENT 'IMPORT / EXPORT / RESERVE / RELEASE / ADJUST / RETURN',
  `qty_change` INT NOT NULL COMMENT 'Lượng thay đổi, âm hoặc dương',
  `ref_type` VARCHAR(30) COMMENT 'Loại chứng từ tham chiếu: ORDER, REFUND',
  `ref_id` BIGINT COMMENT 'Mã chứng từ tham chiếu',
  `created_by` BIGINT COMMENT 'Người thực hiện',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận',
  PRIMARY KEY (`transaction_id`),
  CONSTRAINT `ck_inventory_transactions_transaction_type` CHECK (`transaction_type` IN ('IMPORT', 'EXPORT', 'RESERVE', 'RELEASE', 'ADJUST', 'RETURN')),
  CONSTRAINT `fk_inventory_transactions_inventory_id` FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`inventory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_transactions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký biến động kho';

-- --------------------------------------------------------------------------
--  PH4 — Giỏ hàng, Đơn hàng, Thanh toán & Vận chuyển
-- --------------------------------------------------------------------------

-- carts — Giỏ hàng
CREATE TABLE `carts` (
  `cart_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `user_id` BIGINT COMMENT 'Chủ giỏ hàng, NULL nếu là khách vãng lai',
  `guest_session_id` VARCHAR(100) COMMENT 'Mã phiên cho khách chưa đăng nhập',
  `status` VARCHAR(20) NOT NULL COMMENT 'ACTIVE / CONVERTED / ABANDONED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo giỏ',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm thao tác gần nhất',
  PRIMARY KEY (`cart_id`),
  CONSTRAINT `ck_carts_status` CHECK (`status` IN ('ACTIVE', 'CONVERTED', 'ABANDONED')),
  CONSTRAINT `fk_carts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng';

-- cart_items — Chi tiết giỏ hàng
CREATE TABLE `cart_items` (
  `cart_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `cart_id` BIGINT NOT NULL COMMENT 'Giỏ hàng chứa dòng',
  `variant_id` BIGINT NOT NULL COMMENT 'Biến thể được chọn',
  `quantity` INT NOT NULL COMMENT 'Số lượng đặt mua',
  `price_snapshot` DECIMAL(15,2) NOT NULL COMMENT 'Giá tại thời điểm thêm vào giỏ',
  `is_selected` TINYINT(1) DEFAULT 1 COMMENT 'Có được chọn khi thanh toán hay không',
  `added_at` DATETIME NOT NULL COMMENT 'Thời điểm thêm vào giỏ',
  PRIMARY KEY (`cart_item_id`),
  CONSTRAINT `uq_cart_items_cart_id_variant_id` UNIQUE (`cart_id`, `variant_id`),
  CONSTRAINT `ck_cart_items_quantity_0` CHECK (`quantity` > 0),
  CONSTRAINT `fk_cart_items_cart_id` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`cart_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_variant_id` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết giỏ hàng';

-- orders — Đơn hàng
CREATE TABLE `orders` (
  `order_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_code` VARCHAR(30) NOT NULL COMMENT 'Mã đơn hiển thị cho khách, ví dụ DH20260820001',
  `user_id` BIGINT NOT NULL COMMENT 'Khách hàng đặt đơn',
  `shop_id` BIGINT NOT NULL COMMENT 'Gian hàng xử lý đơn (tách đơn theo shop)',
  `order_status` VARCHAR(20) NOT NULL COMMENT 'PENDING / CONFIRMED / PACKING / SHIPPING / DELIVERED / COMPLETED / CANCELLED / RETURNED',
  `payment_status` VARCHAR(20) NOT NULL COMMENT 'UNPAID / PAID / PARTIAL_REFUND / REFUNDED',
  `subtotal_amount` DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền hàng trước giảm giá',
  `discount_amount` DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng tiền được giảm từ voucher',
  `shipping_fee` DECIMAL(15,2) DEFAULT 0 COMMENT 'Phí vận chuyển',
  `tax_amount` DECIMAL(15,2) DEFAULT 0 COMMENT 'Thuế VAT',
  `total_amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền khách phải trả cuối cùng',
  `receiver_name` VARCHAR(150) NOT NULL COMMENT 'Tên người nhận (ảnh chụp tại thời điểm đặt)',
  `receiver_phone` VARCHAR(20) NOT NULL COMMENT 'Điện thoại người nhận',
  `shipping_address_text` VARCHAR(500) NOT NULL COMMENT 'Địa chỉ giao hàng dạng văn bản đã đóng băng',
  `customer_note` VARCHAR(500) COMMENT 'Ghi chú của khách hàng',
  `cancel_reason` VARCHAR(255) COMMENT 'Lý do hủy đơn',
  `placed_at` DATETIME NOT NULL COMMENT 'Thời điểm đặt hàng',
  `completed_at` DATETIME COMMENT 'Thời điểm hoàn tất đơn',
  PRIMARY KEY (`order_id`),
  CONSTRAINT `uq_orders_order_code` UNIQUE (`order_code`),
  CONSTRAINT `ck_orders_order_status` CHECK (`order_status` IN ('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')),
  CONSTRAINT `ck_orders_payment_status` CHECK (`payment_status` IN ('UNPAID', 'PAID', 'PARTIAL_REFUND', 'REFUNDED')),
  CONSTRAINT `ck_orders_total_amount_0` CHECK (`total_amount` >= 0),
  CONSTRAINT `ck_orders_subtotal_amount_0` CHECK (`subtotal_amount` >= 0),
  CONSTRAINT `ck_orders_discount_amount_0` CHECK (`discount_amount` >= 0),
  CONSTRAINT `ck_orders_shipping_fee_0` CHECK (`shipping_fee` >= 0),
  CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`shop_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn hàng';

-- order_items — Chi tiết đơn hàng
CREATE TABLE `order_items` (
  `order_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_id` BIGINT NOT NULL COMMENT 'Đơn hàng chứa dòng',
  `variant_id` BIGINT NOT NULL COMMENT 'Biến thể được mua',
  `product_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm tại thời điểm mua',
  `sku_snapshot` VARCHAR(80) NOT NULL COMMENT 'Mã SKU tại thời điểm mua',
  `unit_price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá đã chốt',
  `quantity` INT NOT NULL COMMENT 'Số lượng mua',
  `discount_amount` DECIMAL(15,2) DEFAULT 0 COMMENT 'Giảm giá phân bổ cho dòng',
  `line_total` DECIMAL(15,2) NOT NULL COMMENT 'Thành tiền của dòng',
  `review_status` VARCHAR(20) COMMENT 'NOT_REVIEWED / REVIEWED - kiểm soát quyền đánh giá',
  PRIMARY KEY (`order_item_id`),
  CONSTRAINT `ck_order_items_review_status` CHECK (`review_status` IN ('NOT_REVIEWED', 'REVIEWED')),
  CONSTRAINT `ck_order_items_quantity_0` CHECK (`quantity` > 0),
  CONSTRAINT `ck_order_items_unit_price_0` CHECK (`unit_price` >= 0),
  CONSTRAINT `ck_order_items_line_total_0` CHECK (`line_total` >= 0),
  CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_variant_id` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết đơn hàng';

-- order_status_histories — Lịch sử trạng thái đơn
CREATE TABLE `order_status_histories` (
  `history_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_id` BIGINT NOT NULL COMMENT 'Đơn hàng liên quan',
  `from_status` VARCHAR(20) COMMENT 'Trạng thái trước',
  `to_status` VARCHAR(20) NOT NULL COMMENT 'Trạng thái sau',
  `changed_by_user_id` BIGINT COMMENT 'Người thực hiện chuyển trạng thái',
  `note` VARCHAR(255) COMMENT 'Ghi chú kèm theo',
  `changed_at` DATETIME NOT NULL COMMENT 'Thời điểm chuyển',
  PRIMARY KEY (`history_id`),
  CONSTRAINT `fk_order_status_histories_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_status_histories_changed_by_user_id` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử trạng thái đơn';

-- payments — Giao dịch thanh toán
CREATE TABLE `payments` (
  `payment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_id` BIGINT NOT NULL COMMENT 'Đơn hàng được thanh toán',
  `payment_method` VARCHAR(30) NOT NULL COMMENT 'COD / VNPAY / MOMO / ZALOPAY / BANK_TRANSFER / CREDIT_CARD',
  `provider_name` VARCHAR(50) COMMENT 'Tên cổng thanh toán',
  `transaction_code` VARCHAR(100) COMMENT 'Mã giao dịch do cổng thanh toán trả về',
  `amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền giao dịch',
  `currency` CHAR(3) DEFAULT 'VND' COMMENT 'Đơn vị tiền tệ',
  `payment_status` VARCHAR(20) NOT NULL COMMENT 'INITIATED / SUCCESS / FAILED / CANCELLED',
  `paid_at` DATETIME COMMENT 'Thời điểm thanh toán thành công',
  `gateway_response` JSON COMMENT 'Phản hồi thô từ cổng thanh toán, phục vụ đối soát',
  PRIMARY KEY (`payment_id`),
  CONSTRAINT `uq_payments_transaction_code` UNIQUE (`transaction_code`),
  CONSTRAINT `ck_payments_payment_method` CHECK (`payment_method` IN ('COD', 'VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CREDIT_CARD')),
  CONSTRAINT `ck_payments_payment_status` CHECK (`payment_status` IN ('INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED')),
  CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giao dịch thanh toán';

-- refunds — Yêu cầu hoàn tiền
CREATE TABLE `refunds` (
  `refund_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_id` BIGINT NOT NULL COMMENT 'Đơn hàng cần hoàn',
  `payment_id` BIGINT COMMENT 'Giao dịch gốc',
  `refund_amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền hoàn',
  `reason` VARCHAR(255) NOT NULL COMMENT 'Lý do hoàn tiền',
  `refund_status` VARCHAR(20) NOT NULL COMMENT 'REQUESTED / APPROVED / REJECTED / COMPLETED',
  `requested_by` BIGINT COMMENT 'Người yêu cầu',
  `processed_at` DATETIME COMMENT 'Thời điểm xử lý xong',
  PRIMARY KEY (`refund_id`),
  CONSTRAINT `ck_refunds_refund_status` CHECK (`refund_status` IN ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED')),
  CONSTRAINT `fk_refunds_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_refunds_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`payment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_refunds_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yêu cầu hoàn tiền';

-- carriers — Đơn vị vận chuyển
CREATE TABLE `carriers` (
  `carrier_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `carrier_code` VARCHAR(30) NOT NULL COMMENT 'Mã đối tác: GHN, GHTK, VTP, JT',
  `carrier_name` VARCHAR(150) NOT NULL COMMENT 'Tên đơn vị vận chuyển',
  `api_endpoint` VARCHAR(255) COMMENT 'Điểm cuối API tích hợp',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hợp tác',
  PRIMARY KEY (`carrier_id`),
  CONSTRAINT `uq_carriers_carrier_code` UNIQUE (`carrier_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn vị vận chuyển';

-- shipments — Vận đơn
CREATE TABLE `shipments` (
  `shipment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `order_id` BIGINT NOT NULL COMMENT 'Đơn hàng được giao',
  `carrier_id` INT NOT NULL COMMENT 'Đơn vị vận chuyển',
  `tracking_code` VARCHAR(80) COMMENT 'Mã vận đơn tra cứu',
  `shipment_status` VARCHAR(30) NOT NULL COMMENT 'CREATED / PICKED / IN_TRANSIT / DELIVERED / FAILED / RETURNED',
  `shipping_fee` DECIMAL(15,2) NOT NULL COMMENT 'Cước phí thực tế',
  `estimated_delivery_date` DATE COMMENT 'Ngày giao dự kiến',
  `delivered_at` DATETIME COMMENT 'Thời điểm giao thành công',
  PRIMARY KEY (`shipment_id`),
  CONSTRAINT `uq_shipments_tracking_code` UNIQUE (`tracking_code`),
  CONSTRAINT `ck_shipments_shipment_status` CHECK (`shipment_status` IN ('CREATED', 'PICKED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED')),
  CONSTRAINT `fk_shipments_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shipments_carrier_id` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`carrier_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vận đơn';

-- shipment_tracking_logs — Nhật ký hành trình vận đơn
CREATE TABLE `shipment_tracking_logs` (
  `log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính',
  `shipment_id` BIGINT NOT NULL COMMENT 'Vận đơn liên quan',
  `status` VARCHAR(50) NOT NULL COMMENT 'Trạng thái do đối tác trả về',
  `location` VARCHAR(200) COMMENT 'Vị trí bưu cục hiện tại',
  `description` VARCHAR(255) COMMENT 'Diễn giải sự kiện',
  `event_time` DATETIME NOT NULL COMMENT 'Thời điểm phát sinh sự kiện',
  PRIMARY KEY (`log_id`),
  CONSTRAINT `fk_shipment_tracking_logs_shipment_id` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`shipment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký hành trình vận đơn';


-- --------------------------------------------------------------------------
--  CHỈ MỤC ĐỀ XUẤT
-- --------------------------------------------------------------------------
CREATE INDEX `idx_users_status` ON `users` (`status`);
CREATE INDEX `idx_addresses_user_default` ON `user_addresses` (`user_id`, `is_default`);
CREATE INDEX `idx_tokens_user_type` ON `auth_tokens` (`user_id`, `token_type`);
CREATE INDEX `idx_login_user_time` ON `login_histories` (`user_id`, `created_at`);
CREATE INDEX `idx_shops_status` ON `shops` (`status`);
CREATE INDEX `idx_categories_parent` ON `categories` (`parent_id`);
CREATE INDEX `idx_categories_path` ON `categories` (`path`);
CREATE INDEX `idx_products_category_status` ON `products` (`category_id`, `status`);
CREATE INDEX `idx_products_shop_created` ON `products` (`shop_id`, `created_at`);
CREATE INDEX `idx_products_rating` ON `products` (`rating_avg`);
CREATE INDEX `idx_variants_product` ON `product_variants` (`product_id`);
CREATE INDEX `idx_images_product_sort` ON `product_images` (`product_id`, `sort_order`);
CREATE INDEX `idx_inventories_variant` ON `inventories` (`variant_id`);
CREATE INDEX `idx_invtrans_ref` ON `inventory_transactions` (`ref_type`, `ref_id`);
CREATE INDEX `idx_carts_user_status` ON `carts` (`user_id`, `status`);
CREATE INDEX `idx_cartitems_cart` ON `cart_items` (`cart_id`);
CREATE INDEX `idx_orders_user_placed` ON `orders` (`user_id`, `placed_at`);
CREATE INDEX `idx_orders_shop_status` ON `orders` (`shop_id`, `order_status`);
CREATE INDEX `idx_orders_status_placed` ON `orders` (`order_status`, `placed_at`);
CREATE INDEX `idx_orderitems_variant` ON `order_items` (`variant_id`);
CREATE INDEX `idx_osh_order_time` ON `order_status_histories` (`order_id`, `changed_at`);
CREATE INDEX `idx_payments_order_status` ON `payments` (`order_id`, `payment_status`);
CREATE INDEX `idx_shipments_order` ON `shipments` (`order_id`);
CREATE INDEX `idx_track_shipment_time` ON `shipment_tracking_logs` (`shipment_id`, `event_time`);

-- Chỉ mục toàn văn phục vụ tìm kiếm sản phẩm
CREATE FULLTEXT INDEX `ft_products_search` ON `products` (`product_name`, `short_description`);

SET FOREIGN_KEY_CHECKS = 1;
