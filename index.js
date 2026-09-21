'use strict';
/**
 * Điểm nạp model tập trung.
 *
 * Mỗi bảng nằm trong một tệp riêng theo mẫu `(sequelize, DataTypes) => Model`,
 * tệp này chịu trách nhiệm nạp chúng và khai báo toàn bộ quan hệ ở một chỗ duy nhất
 * để tránh phụ thuộc vòng giữa các tệp model.
 */
const { sequelize, Sequelize } = require('../../config/database');

const { DataTypes } = Sequelize;
const def = (file) => require(`./${file}.model`)(sequelize, DataTypes);

/* ------------------------------------------------------------------ */
/*  Nạp model                                                          */
/* ------------------------------------------------------------------ */
const User = def('user');
const Role = def('role');
const Permission = def('permission');
const UserRole = def('userRole');
const RolePermission = def('rolePermission');
const AuthToken = def('authToken');
const LoginHistory = def('loginHistory');

const Shop = def('shop');
const Warehouse = def('warehouse');

const Category = def('category');
const Brand = def('brand');
const Product = def('product');
const ProductImage = def('productImage');
const ProductVariant = def('productVariant');
const Inventory = def('inventory');
const InventoryTransaction = def('inventoryTransaction');

const Order = def('order');
const OrderItem = def('orderItem');
const OrderStatusHistory = def('orderStatusHistory');
const Payment = def('payment');
const Carrier = def('carrier');
const Shipment = def('shipment');
const ShipmentTrackingLog = def('shipmentTrackingLog');

/* ------------------------------------------------------------------ */
/*  Quan hệ — Phân hệ 1: người dùng và phân quyền                      */
/* ------------------------------------------------------------------ */
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });

User.hasMany(AuthToken, { foreignKey: 'user_id', as: 'tokens' });
AuthToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'logins' });

/* ------------------------------------------------------------------ */
/*  Quan hệ — Phân hệ 2: gian hàng và kho                              */
/* ------------------------------------------------------------------ */
User.hasOne(Shop, { foreignKey: 'owner_user_id', as: 'shop' });
Shop.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' });
Shop.hasMany(Warehouse, { foreignKey: 'shop_id', as: 'warehouses' });
Warehouse.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });

/* ------------------------------------------------------------------ */
/*  Quan hệ — Phân hệ 3: danh mục, sản phẩm, tồn kho                   */
/* ------------------------------------------------------------------ */
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

Shop.hasMany(Product, { foreignKey: 'shop_id', as: 'products' });
Product.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

ProductVariant.hasMany(Inventory, { foreignKey: 'variant_id', as: 'inventories' });
Inventory.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id', as: 'inventories' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

Inventory.hasMany(InventoryTransaction, { foreignKey: 'inventory_id', as: 'transactions' });
InventoryTransaction.belongsTo(Inventory, { foreignKey: 'inventory_id', as: 'inventory' });

/* ------------------------------------------------------------------ */
/*  Quan hệ — Phân hệ 4: đơn hàng, thanh toán, vận chuyển              */
/* ------------------------------------------------------------------ */
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });
Shop.hasMany(Order, { foreignKey: 'shop_id', as: 'orders' });
Order.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
ProductVariant.hasMany(OrderItem, { foreignKey: 'variant_id', as: 'orderItems' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'statusHistory' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderStatusHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changedBy' });

Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Order.hasMany(Shipment, { foreignKey: 'order_id', as: 'shipments' });
Shipment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Shipment.belongsTo(Carrier, { foreignKey: 'carrier_id', as: 'carrier' });
Carrier.hasMany(Shipment, { foreignKey: 'carrier_id', as: 'shipments' });

Shipment.hasMany(ShipmentTrackingLog, { foreignKey: 'shipment_id', as: 'trackingLogs' });
ShipmentTrackingLog.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

module.exports = {
  sequelize, Sequelize, Op: Sequelize.Op, fn: Sequelize.fn, col: Sequelize.col,
  literal: Sequelize.literal, where: Sequelize.where,
  User, Role, Permission, UserRole, RolePermission, AuthToken, LoginHistory,
  Shop, Warehouse,
  Category, Brand, Product, ProductImage, ProductVariant, Inventory, InventoryTransaction,
  Order, OrderItem, OrderStatusHistory, Payment, Carrier, Shipment, ShipmentTrackingLog,
};
