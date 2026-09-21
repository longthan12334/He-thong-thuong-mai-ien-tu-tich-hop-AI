'use strict';
/** role_permissions — Bảng nối vai trò với quyền */
module.exports = (sequelize, DataTypes) => sequelize.define('role_permissions', {
  role_id: { type: DataTypes.INTEGER, primaryKey: true },
  permission_id: { type: DataTypes.INTEGER, primaryKey: true },
});
