'use strict';
/**
 * inventories — Tồn kho theo cặp (biến thể, kho).
 * qty_on_hand là số thực có trong kho; qty_reserved là số đã giữ chỗ cho đơn
 * chưa hoàn tất. Số bán được = qty_on_hand - qty_reserved.
 */
module.exports = (sequelize, DataTypes) => sequelize.define('inventories', {
  inventory_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.BIGINT, allowNull: false },
  warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
  qty_on_hand: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  qty_reserved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  safety_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
