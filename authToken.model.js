'use strict';
/** auth_tokens — Refresh token và token một lần, lưu dạng băm SHA-256 */
module.exports = (sequelize, DataTypes) => sequelize.define('auth_tokens', {
  token_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  token_type: { type: DataTypes.STRING(30), allowNull: false },
  device_info: DataTypes.STRING(255),
  ip_address: DataTypes.STRING(45),
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: DataTypes.DATE,
});
