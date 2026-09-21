'use strict';
/** order_items — Dòng chi tiết đơn, đóng băng tên và giá tại thời điểm mua */
module.exports = (sequelize, DataTypes) => sequelize.define('order_items', {
  order_item_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.BIGINT, allowNull: false },
  variant_id: { type: DataTypes.BIGINT, allowNull: false },
  product_name_snapshot: { type: DataTypes.STRING(255), allowNull: false },
  sku_snapshot: { type: DataTypes.STRING(80), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  line_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  review_status: { type: DataTypes.STRING(20), defaultValue: 'NOT_REVIEWED' },
});
