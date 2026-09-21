'use strict';
/** users — Tài khoản người dùng */
module.exports = (sequelize, DataTypes) => sequelize.define('users', {
  user_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20), unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  full_name: { type: DataTypes.STRING(150), allowNull: false },
  avatar_url: DataTypes.STRING(500),
  gender: DataTypes.STRING(10),
  date_of_birth: DataTypes.DATEONLY,
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
  email_verified_at: DataTypes.DATE,
  phone_verified_at: DataTypes.DATE,
  last_login_at: DataTypes.DATE,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  // Mặc định không bao giờ trả ra mã băm mật khẩu
  defaultScope: { attributes: { exclude: ['password_hash'] } },
  scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
});
