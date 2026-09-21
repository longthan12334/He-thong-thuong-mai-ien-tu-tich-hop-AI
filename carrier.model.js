'use strict';
/** carriers — Đối tác vận chuyển */
module.exports = (sequelize, DataTypes) => sequelize.define('carriers', {
  carrier_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  carrier_code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  carrier_name: { type: DataTypes.STRING(150), allowNull: false },
  api_endpoint: DataTypes.STRING(255),
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
