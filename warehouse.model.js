'use strict';
/** warehouses — Kho hàng của gian hàng */
module.exports = (sequelize, DataTypes) => sequelize.define('warehouses', {
  warehouse_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT, allowNull: false },
  warehouse_name: { type: DataTypes.STRING(150), allowNull: false },
  address: { type: DataTypes.STRING(255), allowNull: false },
  contact_phone: DataTypes.STRING(20),
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
