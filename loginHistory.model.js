'use strict';
/** login_histories — Nhật ký đăng nhập, phục vụ phát hiện dò mật khẩu */
module.exports = (sequelize, DataTypes) => sequelize.define('login_histories', {
  history_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.BIGINT,
  ip_address: { type: DataTypes.STRING(45), allowNull: false },
  user_agent: DataTypes.STRING(500),
  login_status: { type: DataTypes.STRING(20), allowNull: false },
  failure_reason: DataTypes.STRING(100),
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
