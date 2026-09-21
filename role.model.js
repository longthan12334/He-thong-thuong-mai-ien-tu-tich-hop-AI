'use strict';
/** roles — Vai trò hệ thống */
module.exports = (sequelize, DataTypes) => sequelize.define('roles', {
  role_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  role_name: { type: DataTypes.STRING(100), allowNull: false },
  description: DataTypes.STRING(255),
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
});
