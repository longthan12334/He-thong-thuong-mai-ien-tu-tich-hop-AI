'use strict';
const { Role, Permission, User } = require('../models');
const { roleCache, userCache } = require('./cache.service');

/**
 * Trả về tập quyền của một mã vai trò, có đệm 5 phút.
 * @param {string} roleCode ví dụ 'SELLER'
 * @returns {Promise<string[]>}
 */
async function permissionsOfRole(roleCode) {
  const cached = roleCache.get(roleCode);
  if (cached) return cached;

  const role = await Role.findOne({
    where: { role_code: roleCode },
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  const codes = role ? role.permissions.map((p) => p.permission_code) : [];
  return roleCache.set(roleCode, codes);
}

/** Gộp quyền của nhiều vai trò, loại trùng. */
async function permissionsOfRoles(roleCodes) {
  const lists = await Promise.all(roleCodes.map(permissionsOfRole));
  return [...new Set(lists.flat())];
}

/**
 * Nạp thông tin định danh của người dùng phục vụ phân quyền.
 * Luôn đọc trạng thái tài khoản để khóa tài khoản có hiệu lực ngay,
 * không phải chờ access token hết hạn.
 */
async function loadPrincipal(userId) {
  const cached = userCache.get(String(userId));
  if (cached) return cached;

  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
  });
  if (!user) return null;

  const roles = user.roles.map((r) => r.role_code);
  const principal = {
    userId: Number(user.user_id),
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    status: user.status,
    roles,
    permissions: await permissionsOfRoles(roles),
  };
  return userCache.set(String(userId), principal);
}

/** Gọi sau khi gán hoặc gỡ vai trò để đệm không trả về dữ liệu cũ. */
function invalidateUser(userId) {
  userCache.invalidate(String(userId));
}

/** Gọi sau khi sửa bảng role_permissions. */
function invalidateRoles() {
  roleCache.invalidate();
  userCache.invalidate();
}

module.exports = {
  permissionsOfRole, permissionsOfRoles, loadPrincipal,
  invalidateUser, invalidateRoles,
};
