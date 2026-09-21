'use strict';
/** inventory_transactions — Nhật ký biến động kho, chỉ ghi thêm, không sửa xóa */
module.exports = (sequelize, DataTypes) => sequelize.define('inventory_transactions', {
  transaction_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  inventory_id: { type: DataTypes.BIGINT, allowNull: false },
  transaction_type: { type: DataTypes.STRING(20), allowNull: false },
  qty_change: { type: DataTypes.INTEGER, allowNull: false },
  ref_type: DataTypes.STRING(30),
  ref_id: DataTypes.BIGINT,
  created_by: DataTypes.BIGINT,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
