'use strict';
const { sequelize, Sequelize } = require('../config/database');
const { DataTypes } = Sequelize;

/* ------------------------------------------------------------------ */
/*  Định nghĩa model                                                   */
/*  Chỉ khai báo các bảng thuộc phạm vi xác thực và phân quyền.        */
/*  Các bảng còn lại của Sprint 2 đã có sẵn trong lược đồ SQL.         */
/* ------------------------------------------------------------------ */

const User = sequelize.define('users', {
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
  defaultScope: { attributes: { exclude: ['password_hash'] } },
  scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
});

const Role = sequelize.define('roles', {
  role_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  role_name: { type: DataTypes.STRING(100), allowNull: false },
  description: DataTypes.STRING(255),
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Permission = sequelize.define('permissions', {
  permission_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  permission_code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  permission_name: { type: DataTypes.STRING(150), allowNull: false },
  module_name: { type: DataTypes.STRING(50), allowNull: false },
});

const UserRole = sequelize.define('user_roles', {
  user_id: { type: DataTypes.BIGINT, primaryKey: true },
  role_id: { type: DataTypes.INTEGER, primaryKey: true },
  assigned_by: DataTypes.BIGINT,
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const RolePermission = sequelize.define('role_permissions', {
  role_id: { type: DataTypes.INTEGER, primaryKey: true },
  permission_id: { type: DataTypes.INTEGER, primaryKey: true },
});

const AuthToken = sequelize.define('auth_tokens', {
  token_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  token_type: { type: DataTypes.STRING(30), allowNull: false },
  device_info: DataTypes.STRING(255),
  ip_address: DataTypes.STRING(45),
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: DataTypes.DATE,
});

const LoginHistory = sequelize.define('login_histories', {
  history_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.BIGINT,
  ip_address: { type: DataTypes.STRING(45), allowNull: false },
  user_agent: DataTypes.STRING(500),
  login_status: { type: DataTypes.STRING(20), allowNull: false },
  failure_reason: DataTypes.STRING(100),
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

/* ------------------------------------------------------------------ */
/*  Quan hệ                                                            */
/* ------------------------------------------------------------------ */
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });
User.hasMany(AuthToken, { foreignKey: 'user_id', as: 'tokens' });
AuthToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'logins' });

module.exports = {
  sequelize, Sequelize,
  User, Role, Permission, UserRole, RolePermission, AuthToken, LoginHistory,
};
