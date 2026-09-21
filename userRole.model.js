'use strict';
/** user_roles — Bảng nối người dùng với vai trò */
module.exports = (sequelize, DataTypes) => sequelize.define('user_roles', {
  user_id: { type: DataTypes.BIGINT, primaryKey: true },
  role_id: { type: DataTypes.INTEGER, primaryKey: true },
  assigned_by: DataTypes.BIGINT,
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
