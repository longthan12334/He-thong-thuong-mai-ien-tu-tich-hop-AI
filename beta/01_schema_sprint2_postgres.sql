-- ============================================================================
--  HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TÍCH HỢP AI
--  HTTMDTTHA-5 — Thiết kế CSDL cho Sprint 2
--  Phương ngữ: PostgreSQL 14+
--  Nhóm 2 — Lớp 68CS3
--
--  PH1 + PH2 (nền tảng Sprint 1) dùng CREATE TABLE IF NOT EXISTS
--  nên chạy an toàn trên CSDL đã có sẵn bảng tài khoản.
--  PH3 + PH4 là phạm vi mới của Sprint 2.
-- ============================================================================

-- CREATE EXTENSION IF NOT EXISTS vector;  -- bật khi triển khai phân hệ AI


-- --------------------------------------------------------------------------
--  PH1 — Quản trị Người dùng & Phân quyền
-- --------------------------------------------------------------------------

-- users — Tài khoản người dùng
CREATE TABLE IF NOT EXISTS "users" (
  "user_id" BIGSERIAL NOT NULL,
  "username" VARCHAR(50) NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "phone" VARCHAR(20),
  "password_hash" VARCHAR(255) NOT NULL,
  "full_name" VARCHAR(150) NOT NULL,
  "avatar_url" VARCHAR(500),
  "gender" VARCHAR(10),
  "date_of_birth" DATE,
  "status" VARCHAR(20) NOT NULL,
  "email_verified_at" TIMESTAMP,
  "phone_verified_at" TIMESTAMP,
  "last_login_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id"),
  CONSTRAINT "uq_users_username" UNIQUE ("username"),
  CONSTRAINT "uq_users_email" UNIQUE ("email"),
  CONSTRAINT "uq_users_phone" UNIQUE ("phone"),
  CONSTRAINT "ck_users_gender" CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER')),
  CONSTRAINT "ck_users_status" CHECK ("status" IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'DELETED'))
);

-- roles — Vai trò hệ thống
CREATE TABLE IF NOT EXISTS "roles" (
  "role_id" SERIAL NOT NULL,
  "role_code" VARCHAR(30) NOT NULL,
  "role_name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255),
  "is_system" BOOLEAN DEFAULT FALSE,
  PRIMARY KEY ("role_id"),
  CONSTRAINT "uq_roles_role_code" UNIQUE ("role_code"),
  CONSTRAINT "ck_roles_role_code" CHECK ("role_code" IN ('ADMIN', 'SELLER', 'MEMBER', 'GUEST'))
);

-- permissions — Quyền thao tác
CREATE TABLE IF NOT EXISTS "permissions" (
  "permission_id" SERIAL NOT NULL,
  "permission_code" VARCHAR(80) NOT NULL,
  "permission_name" VARCHAR(150) NOT NULL,
  "module_name" VARCHAR(50) NOT NULL,
  PRIMARY KEY ("permission_id"),
  CONSTRAINT "uq_permissions_permission_code" UNIQUE ("permission_code")
);

-- user_roles — Gán vai trò cho người dùng
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" BIGINT NOT NULL,
  "role_id" INT NOT NULL,
  "assigned_by" BIGINT,
  "assigned_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_user_roles_assigned_by" FOREIGN KEY ("assigned_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- role_permissions — Gán quyền cho vai trò
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" INT NOT NULL,
  "permission_id" INT NOT NULL,
  PRIMARY KEY ("role_id", "permission_id"),
  CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- user_addresses — Sổ địa chỉ giao hàng
CREATE TABLE IF NOT EXISTS "user_addresses" (
  "address_id" BIGSERIAL NOT NULL,
  "user_id" BIGINT NOT NULL,
  "recipient_name" VARCHAR(150) NOT NULL,
  "recipient_phone" VARCHAR(20) NOT NULL,
  "province_code" VARCHAR(10) NOT NULL,
  "district_code" VARCHAR(10) NOT NULL,
  "ward_code" VARCHAR(10) NOT NULL,
  "street_address" VARCHAR(255) NOT NULL,
  "address_type" VARCHAR(20),
  "is_default" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("address_id"),
  CONSTRAINT "ck_user_addresses_address_type" CHECK ("address_type" IN ('HOME', 'OFFICE', 'PICKUP')),
  CONSTRAINT "fk_user_addresses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- auth_tokens — Token xác thực
CREATE TABLE IF NOT EXISTS "auth_tokens" (
  "token_id" BIGSERIAL NOT NULL,
  "user_id" BIGINT NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "token_type" VARCHAR(30) NOT NULL,
  "device_info" VARCHAR(255),
  "ip_address" VARCHAR(45),
  "expires_at" TIMESTAMP NOT NULL,
  "revoked_at" TIMESTAMP,
  PRIMARY KEY ("token_id"),
  CONSTRAINT "uq_auth_tokens_token_hash" UNIQUE ("token_hash"),
  CONSTRAINT "ck_auth_tokens_token_type" CHECK ("token_type" IN ('REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL')),
  CONSTRAINT "fk_auth_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- login_histories — Nhật ký đăng nhập
CREATE TABLE IF NOT EXISTS "login_histories" (
  "history_id" BIGSERIAL NOT NULL,
  "user_id" BIGINT,
  "ip_address" VARCHAR(45) NOT NULL,
  "user_agent" VARCHAR(500),
  "login_status" VARCHAR(20) NOT NULL,
  "failure_reason" VARCHAR(100),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("history_id"),
  CONSTRAINT "ck_login_histories_login_status" CHECK ("login_status" IN ('SUCCESS', 'FAILED')),
  CONSTRAINT "fk_login_histories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------------
--  PH2 — Người bán & Cửa hàng
-- --------------------------------------------------------------------------

-- shops — Cửa hàng / Gian hàng
CREATE TABLE IF NOT EXISTS "shops" (
  "shop_id" BIGSERIAL NOT NULL,
  "owner_user_id" BIGINT,
  "shop_name" VARCHAR(200) NOT NULL,
  "slug" VARCHAR(220) NOT NULL,
  "logo_url" VARCHAR(500),
  "description" TEXT,
  "business_license_no" VARCHAR(50),
  "tax_code" VARCHAR(20),
  "rating_avg" DECIMAL(3,2) DEFAULT 0,
  "rating_count" INT DEFAULT 0,
  "follower_count" INT DEFAULT 0,
  "status" VARCHAR(20) NOT NULL,
  "verified_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("shop_id"),
  CONSTRAINT "uq_shops_owner_user_id" UNIQUE ("owner_user_id"),
  CONSTRAINT "uq_shops_slug" UNIQUE ("slug"),
  CONSTRAINT "ck_shops_status" CHECK ("status" IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
  CONSTRAINT "fk_shops_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- shop_followers — Theo dõi cửa hàng
CREATE TABLE IF NOT EXISTS "shop_followers" (
  "user_id" BIGINT NOT NULL,
  "shop_id" BIGINT NOT NULL,
  "followed_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("user_id", "shop_id"),
  CONSTRAINT "fk_shop_followers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_shop_followers_shop_id" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- warehouses — Kho hàng
CREATE TABLE IF NOT EXISTS "warehouses" (
  "warehouse_id" BIGSERIAL NOT NULL,
  "shop_id" BIGINT NOT NULL,
  "warehouse_name" VARCHAR(150) NOT NULL,
  "address" VARCHAR(255) NOT NULL,
  "contact_phone" VARCHAR(20),
  "is_default" BOOLEAN DEFAULT FALSE,
  "is_active" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY ("warehouse_id"),
  CONSTRAINT "fk_warehouses_shop_id" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------------
--  PH3 — Danh mục & Sản phẩm
-- --------------------------------------------------------------------------

-- categories — Danh mục sản phẩm
CREATE TABLE "categories" (
  "category_id" SERIAL NOT NULL,
  "parent_id" INT,
  "category_name" VARCHAR(150) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "icon_url" VARCHAR(500),
  "level" SMALLINT NOT NULL,
  "path" VARCHAR(255) NOT NULL,
  "sort_order" INT DEFAULT 0,
  "is_active" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY ("category_id"),
  CONSTRAINT "uq_categories_slug" UNIQUE ("slug"),
  CONSTRAINT "fk_categories_parent_id" FOREIGN KEY ("parent_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- brands — Thương hiệu
CREATE TABLE "brands" (
  "brand_id" SERIAL NOT NULL,
  "brand_name" VARCHAR(150) NOT NULL,
  "slug" VARCHAR(180),
  "logo_url" VARCHAR(500),
  "country" VARCHAR(80),
  PRIMARY KEY ("brand_id"),
  CONSTRAINT "uq_brands_brand_name" UNIQUE ("brand_name"),
  CONSTRAINT "uq_brands_slug" UNIQUE ("slug")
);

-- products — Sản phẩm
CREATE TABLE "products" (
  "product_id" BIGSERIAL NOT NULL,
  "shop_id" BIGINT NOT NULL,
  "category_id" INT NOT NULL,
  "brand_id" INT,
  "product_name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(280) NOT NULL,
  "short_description" VARCHAR(500),
  "full_description" TEXT,
  "base_price" DECIMAL(15,2) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "approval_status" VARCHAR(20) NOT NULL,
  "view_count" BIGINT DEFAULT 0,
  "sold_count" INT DEFAULT 0,
  "rating_avg" DECIMAL(3,2) DEFAULT 0,
  "rating_count" INT DEFAULT 0,
  "is_featured" BOOLEAN DEFAULT FALSE,
  "published_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("product_id"),
  CONSTRAINT "uq_products_slug" UNIQUE ("slug"),
  CONSTRAINT "ck_products_status" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'HIDDEN', 'OUT_OF_STOCK')),
  CONSTRAINT "ck_products_approval_status" CHECK ("approval_status" IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT "ck_products_base_price_0" CHECK ("base_price" >= 0),
  CONSTRAINT "fk_products_shop_id" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_products_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_products_brand_id" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- product_images — Ảnh sản phẩm
CREATE TABLE "product_images" (
  "image_id" BIGSERIAL NOT NULL,
  "product_id" BIGINT NOT NULL,
  "image_url" VARCHAR(500) NOT NULL,
  "alt_text" VARCHAR(255),
  "sort_order" INT DEFAULT 0,
  "is_primary" BOOLEAN DEFAULT FALSE,
  PRIMARY KEY ("image_id"),
  CONSTRAINT "fk_product_images_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- product_variants — Biến thể sản phẩm (SKU)
CREATE TABLE "product_variants" (
  "variant_id" BIGSERIAL NOT NULL,
  "product_id" BIGINT NOT NULL,
  "sku_code" VARCHAR(80) NOT NULL,
  "variant_name" VARCHAR(200) NOT NULL,
  "price" DECIMAL(15,2) NOT NULL,
  "sale_price" DECIMAL(15,2),
  "image_url" VARCHAR(500),
  "weight_gram" INT,
  "barcode" VARCHAR(50),
  "is_active" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY ("variant_id"),
  CONSTRAINT "uq_product_variants_sku_code" UNIQUE ("sku_code"),
  CONSTRAINT "ck_product_variants_price_0" CHECK ("price" >= 0),
  CONSTRAINT "fk_product_variants_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- attributes — Thuộc tính
CREATE TABLE "attributes" (
  "attribute_id" SERIAL NOT NULL,
  "attribute_name" VARCHAR(100) NOT NULL,
  "data_type" VARCHAR(20) NOT NULL,
  "is_variant_attribute" BOOLEAN DEFAULT FALSE,
  "category_id" INT,
  PRIMARY KEY ("attribute_id"),
  CONSTRAINT "ck_attributes_data_type" CHECK ("data_type" IN ('TEXT', 'NUMBER', 'SELECT', 'COLOR')),
  CONSTRAINT "fk_attributes_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- attribute_values — Giá trị thuộc tính
CREATE TABLE "attribute_values" (
  "value_id" SERIAL NOT NULL,
  "attribute_id" INT NOT NULL,
  "value_text" VARCHAR(150) NOT NULL,
  "sort_order" INT DEFAULT 0,
  PRIMARY KEY ("value_id"),
  CONSTRAINT "fk_attribute_values_attribute_id" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("attribute_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- variant_attribute_values — Tổ hợp thuộc tính của biến thể
CREATE TABLE "variant_attribute_values" (
  "variant_id" BIGINT NOT NULL,
  "attribute_id" INT NOT NULL,
  "value_id" INT NOT NULL,
  PRIMARY KEY ("variant_id", "attribute_id"),
  CONSTRAINT "fk_variant_attribute_values_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_variant_attribute_values_attribute_id" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("attribute_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_variant_attribute_values_value_id" FOREIGN KEY ("value_id") REFERENCES "attribute_values"("value_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- product_attributes — Thông số kỹ thuật sản phẩm
CREATE TABLE "product_attributes" (
  "product_id" BIGINT NOT NULL,
  "attribute_id" INT NOT NULL,
  "value_text" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("product_id", "attribute_id"),
  CONSTRAINT "fk_product_attributes_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_product_attributes_attribute_id" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("attribute_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- inventories — Tồn kho
CREATE TABLE "inventories" (
  "inventory_id" BIGSERIAL NOT NULL,
  "variant_id" BIGINT NOT NULL,
  "warehouse_id" BIGINT NOT NULL,
  "qty_on_hand" INT NOT NULL DEFAULT 0,
  "qty_reserved" INT NOT NULL DEFAULT 0,
  "safety_stock" INT DEFAULT 0,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("inventory_id"),
  CONSTRAINT "uq_inventories_variant_id_warehouse_id" UNIQUE ("variant_id", "warehouse_id"),
  CONSTRAINT "ck_inventories_qty_on_hand_0" CHECK ("qty_on_hand" >= 0),
  CONSTRAINT "ck_inventories_qty_reserved_0" CHECK ("qty_reserved" >= 0),
  CONSTRAINT "ck_inventories_qty_reserved_qty_on_hand" CHECK ("qty_reserved" <= "qty_on_hand"),
  CONSTRAINT "fk_inventories_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_inventories_warehouse_id" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- inventory_transactions — Nhật ký biến động kho
CREATE TABLE "inventory_transactions" (
  "transaction_id" BIGSERIAL NOT NULL,
  "inventory_id" BIGINT NOT NULL,
  "transaction_type" VARCHAR(20) NOT NULL,
  "qty_change" INT NOT NULL,
  "ref_type" VARCHAR(30),
  "ref_id" BIGINT,
  "created_by" BIGINT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("transaction_id"),
  CONSTRAINT "ck_inventory_transactions_transaction_type" CHECK ("transaction_type" IN ('IMPORT', 'EXPORT', 'RESERVE', 'RELEASE', 'ADJUST', 'RETURN')),
  CONSTRAINT "fk_inventory_transactions_inventory_id" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("inventory_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_inventory_transactions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------------
--  PH4 — Giỏ hàng, Đơn hàng, Thanh toán & Vận chuyển
-- --------------------------------------------------------------------------

-- carts — Giỏ hàng
CREATE TABLE "carts" (
  "cart_id" BIGSERIAL NOT NULL,
  "user_id" BIGINT,
  "guest_session_id" VARCHAR(100),
  "status" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("cart_id"),
  CONSTRAINT "ck_carts_status" CHECK ("status" IN ('ACTIVE', 'CONVERTED', 'ABANDONED')),
  CONSTRAINT "fk_carts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- cart_items — Chi tiết giỏ hàng
CREATE TABLE "cart_items" (
  "cart_item_id" BIGSERIAL NOT NULL,
  "cart_id" BIGINT NOT NULL,
  "variant_id" BIGINT NOT NULL,
  "quantity" INT NOT NULL,
  "price_snapshot" DECIMAL(15,2) NOT NULL,
  "is_selected" BOOLEAN DEFAULT TRUE,
  "added_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("cart_item_id"),
  CONSTRAINT "uq_cart_items_cart_id_variant_id" UNIQUE ("cart_id", "variant_id"),
  CONSTRAINT "ck_cart_items_quantity_0" CHECK ("quantity" > 0),
  CONSTRAINT "fk_cart_items_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_cart_items_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- orders — Đơn hàng
CREATE TABLE "orders" (
  "order_id" BIGSERIAL NOT NULL,
  "order_code" VARCHAR(30) NOT NULL,
  "user_id" BIGINT NOT NULL,
  "shop_id" BIGINT NOT NULL,
  "order_status" VARCHAR(20) NOT NULL,
  "payment_status" VARCHAR(20) NOT NULL,
  "subtotal_amount" DECIMAL(15,2) NOT NULL,
  "discount_amount" DECIMAL(15,2) DEFAULT 0,
  "shipping_fee" DECIMAL(15,2) DEFAULT 0,
  "tax_amount" DECIMAL(15,2) DEFAULT 0,
  "total_amount" DECIMAL(15,2) NOT NULL,
  "receiver_name" VARCHAR(150) NOT NULL,
  "receiver_phone" VARCHAR(20) NOT NULL,
  "shipping_address_text" VARCHAR(500) NOT NULL,
  "customer_note" VARCHAR(500),
  "cancel_reason" VARCHAR(255),
  "placed_at" TIMESTAMP NOT NULL,
  "completed_at" TIMESTAMP,
  PRIMARY KEY ("order_id"),
  CONSTRAINT "uq_orders_order_code" UNIQUE ("order_code"),
  CONSTRAINT "ck_orders_order_status" CHECK ("order_status" IN ('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')),
  CONSTRAINT "ck_orders_payment_status" CHECK ("payment_status" IN ('UNPAID', 'PAID', 'PARTIAL_REFUND', 'REFUNDED')),
  CONSTRAINT "ck_orders_total_amount_0" CHECK ("total_amount" >= 0),
  CONSTRAINT "ck_orders_subtotal_amount_0" CHECK ("subtotal_amount" >= 0),
  CONSTRAINT "ck_orders_discount_amount_0" CHECK ("discount_amount" >= 0),
  CONSTRAINT "ck_orders_shipping_fee_0" CHECK ("shipping_fee" >= 0),
  CONSTRAINT "fk_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_orders_shop_id" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- order_items — Chi tiết đơn hàng
CREATE TABLE "order_items" (
  "order_item_id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "variant_id" BIGINT NOT NULL,
  "product_name_snapshot" VARCHAR(255) NOT NULL,
  "sku_snapshot" VARCHAR(80) NOT NULL,
  "unit_price" DECIMAL(15,2) NOT NULL,
  "quantity" INT NOT NULL,
  "discount_amount" DECIMAL(15,2) DEFAULT 0,
  "line_total" DECIMAL(15,2) NOT NULL,
  "review_status" VARCHAR(20),
  PRIMARY KEY ("order_item_id"),
  CONSTRAINT "ck_order_items_review_status" CHECK ("review_status" IN ('NOT_REVIEWED', 'REVIEWED')),
  CONSTRAINT "ck_order_items_quantity_0" CHECK ("quantity" > 0),
  CONSTRAINT "ck_order_items_unit_price_0" CHECK ("unit_price" >= 0),
  CONSTRAINT "ck_order_items_line_total_0" CHECK ("line_total" >= 0),
  CONSTRAINT "fk_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_order_items_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- order_status_histories — Lịch sử trạng thái đơn
CREATE TABLE "order_status_histories" (
  "history_id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "from_status" VARCHAR(20),
  "to_status" VARCHAR(20) NOT NULL,
  "changed_by_user_id" BIGINT,
  "note" VARCHAR(255),
  "changed_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("history_id"),
  CONSTRAINT "fk_order_status_histories_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_order_status_histories_changed_by_user_id" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- payments — Giao dịch thanh toán
CREATE TABLE "payments" (
  "payment_id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "payment_method" VARCHAR(30) NOT NULL,
  "provider_name" VARCHAR(50),
  "transaction_code" VARCHAR(100),
  "amount" DECIMAL(15,2) NOT NULL,
  "currency" CHAR(3) DEFAULT 'VND',
  "payment_status" VARCHAR(20) NOT NULL,
  "paid_at" TIMESTAMP,
  "gateway_response" JSONB,
  PRIMARY KEY ("payment_id"),
  CONSTRAINT "uq_payments_transaction_code" UNIQUE ("transaction_code"),
  CONSTRAINT "ck_payments_payment_method" CHECK ("payment_method" IN ('COD', 'VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CREDIT_CARD')),
  CONSTRAINT "ck_payments_payment_status" CHECK ("payment_status" IN ('INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED')),
  CONSTRAINT "fk_payments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- refunds — Yêu cầu hoàn tiền
CREATE TABLE "refunds" (
  "refund_id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "payment_id" BIGINT,
  "refund_amount" DECIMAL(15,2) NOT NULL,
  "reason" VARCHAR(255) NOT NULL,
  "refund_status" VARCHAR(20) NOT NULL,
  "requested_by" BIGINT,
  "processed_at" TIMESTAMP,
  PRIMARY KEY ("refund_id"),
  CONSTRAINT "ck_refunds_refund_status" CHECK ("refund_status" IN ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED')),
  CONSTRAINT "fk_refunds_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_refunds_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fk_refunds_requested_by" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- carriers — Đơn vị vận chuyển
CREATE TABLE "carriers" (
  "carrier_id" SERIAL NOT NULL,
  "carrier_code" VARCHAR(30) NOT NULL,
  "carrier_name" VARCHAR(150) NOT NULL,
  "api_endpoint" VARCHAR(255),
  "is_active" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY ("carrier_id"),
  CONSTRAINT "uq_carriers_carrier_code" UNIQUE ("carrier_code")
);

-- shipments — Vận đơn
CREATE TABLE "shipments" (
  "shipment_id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "carrier_id" INT NOT NULL,
  "tracking_code" VARCHAR(80),
  "shipment_status" VARCHAR(30) NOT NULL,
  "shipping_fee" DECIMAL(15,2) NOT NULL,
  "estimated_delivery_date" DATE,
  "delivered_at" TIMESTAMP,
  PRIMARY KEY ("shipment_id"),
  CONSTRAINT "uq_shipments_tracking_code" UNIQUE ("tracking_code"),
  CONSTRAINT "ck_shipments_shipment_status" CHECK ("shipment_status" IN ('CREATED', 'PICKED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED')),
  CONSTRAINT "fk_shipments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_shipments_carrier_id" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("carrier_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- shipment_tracking_logs — Nhật ký hành trình vận đơn
CREATE TABLE "shipment_tracking_logs" (
  "log_id" BIGSERIAL NOT NULL,
  "shipment_id" BIGINT NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "location" VARCHAR(200),
  "description" VARCHAR(255),
  "event_time" TIMESTAMP NOT NULL,
  PRIMARY KEY ("log_id"),
  CONSTRAINT "fk_shipment_tracking_logs_shipment_id" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("shipment_id") ON DELETE CASCADE ON UPDATE CASCADE
);


-- --------------------------------------------------------------------------
--  CHỈ MỤC ĐỀ XUẤT
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" ("status");
CREATE INDEX IF NOT EXISTS "idx_addresses_user_default" ON "user_addresses" ("user_id", "is_default");
CREATE INDEX IF NOT EXISTS "idx_tokens_user_type" ON "auth_tokens" ("user_id", "token_type");
CREATE INDEX IF NOT EXISTS "idx_login_user_time" ON "login_histories" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_shops_status" ON "shops" ("status");
CREATE INDEX IF NOT EXISTS "idx_categories_parent" ON "categories" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_categories_path" ON "categories" ("path");
CREATE INDEX IF NOT EXISTS "idx_products_category_status" ON "products" ("category_id", "status");
CREATE INDEX IF NOT EXISTS "idx_products_shop_created" ON "products" ("shop_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_products_rating" ON "products" ("rating_avg");
CREATE INDEX IF NOT EXISTS "idx_variants_product" ON "product_variants" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_images_product_sort" ON "product_images" ("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_inventories_variant" ON "inventories" ("variant_id");
CREATE INDEX IF NOT EXISTS "idx_invtrans_ref" ON "inventory_transactions" ("ref_type", "ref_id");
CREATE INDEX IF NOT EXISTS "idx_carts_user_status" ON "carts" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_cartitems_cart" ON "cart_items" ("cart_id");
CREATE INDEX IF NOT EXISTS "idx_orders_user_placed" ON "orders" ("user_id", "placed_at");
CREATE INDEX IF NOT EXISTS "idx_orders_shop_status" ON "orders" ("shop_id", "order_status");
CREATE INDEX IF NOT EXISTS "idx_orders_status_placed" ON "orders" ("order_status", "placed_at");
CREATE INDEX IF NOT EXISTS "idx_orderitems_variant" ON "order_items" ("variant_id");
CREATE INDEX IF NOT EXISTS "idx_osh_order_time" ON "order_status_histories" ("order_id", "changed_at");
CREATE INDEX IF NOT EXISTS "idx_payments_order_status" ON "payments" ("order_id", "payment_status");
CREATE INDEX IF NOT EXISTS "idx_shipments_order" ON "shipments" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_track_shipment_time" ON "shipment_tracking_logs" ("shipment_id", "event_time");

-- Chỉ mục toàn văn phục vụ tìm kiếm sản phẩm
CREATE INDEX IF NOT EXISTS "ft_products_search" ON "products" USING GIN (to_tsvector('simple', coalesce("product_name",'') || ' ' || coalesce("short_description",'')));
