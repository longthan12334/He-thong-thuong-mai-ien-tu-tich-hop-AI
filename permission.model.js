'use strict';
/** permissions — Quyền thao tác */
module.exports = (sequelize, DataTypes) => sequelize.define('permissions', {
  permission_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  permission_code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  permission_name: { type: DataTypes.STRING(150), allowNull: false },
  module_name: { type: DataTypes.STRING(50), allowNull: false },
});
