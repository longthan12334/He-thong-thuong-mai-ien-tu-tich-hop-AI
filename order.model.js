'use strict';
/**
 * orders — Đơn hàng, tách theo gian hàng.
 * Tên người nhận và địa chỉ được lưu dạng snapshot tại thời điểm đặt,
 * nên khách sửa sổ địa chỉ về sau không làm sai lệch đơn cũ.
 */
module.exports = (sequelize, DataTypes) => sequelize.define('orders', {
  order_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  shop_id: { type: DataTypes.BIGINT, allowNull: false },
  order_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
  payment_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'UNPAID' },
  subtotal_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  shipping_fee: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  receiver_name: { type: DataTypes.STRING(150), allowNull: false },
  receiver_phone: { type: DataTypes.STRING(20), allowNull: false },
  shipping_address_text: { type: DataTypes.STRING(500), allowNull: false },
  customer_note: DataTypes.STRING(500),
  cancel_reason: DataTypes.STRING(255),
  placed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  completed_at: DataTypes.DATE,
});
