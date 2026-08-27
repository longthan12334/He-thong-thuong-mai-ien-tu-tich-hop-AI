'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { sequelize, User, Role, UserRole, LoginHistory } = require('../models');
const tokenService = require('./token.service');
const rbac = require('./rbac.service');
const { ROLES } = require('../constants/permissions');

const USER_STATUS = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', LOCKED: 'LOCKED', DELETED: 'DELETED' };

/** Ghi nhật ký mỗi lần đăng nhập, kể cả thất bại — phục vụ phát hiện dò mật khẩu. */
async function logLogin(userId, ctx, status, reason = null) {
  await LoginHistory.create({
    user_id: userId,
    ip_address: ctx.ip || '0.0.0.0',
    user_agent: (ctx.userAgent || '').slice(0, 500) || null,
    login_status: status,
    failure_reason: reason,
  });
}

/**
 * HTTMDTTHA-7 — Đăng ký tài khoản.
 * Toàn bộ thao tác nằm trong một giao dịch: nếu gán vai trò thất bại
 * thì bản ghi người dùng cũng được quay lui, không để lại tài khoản mồ côi.
 */
async function register(payload, ctx = {}) {
  const { username, email, phone, password, fullName, gender, dateOfBirth } = payload;

  const existing = await User.findOne({
    where: { [Op.or]: [{ email }, { username }, ...(phone ? [{ phone }] : [])] },
    attributes: ['user_id', 'email', 'username', 'phone'],
  });
  if (existing) {
    const field = existing.email === email ? 'email'
      : existing.username === username ? 'username' : 'phone';
    const label = { email: 'Email', username: 'Tên đăng nhập', phone: 'Số điện thoại' }[field];
    throw ApiError.conflict(`${label} đã được sử dụng`, { field });
  }

  const passwordHash = await bcrypt.hash(password, env.security.bcryptRounds);

  const user = await sequelize.transaction(async (t) => {
    const created = await User.create({
      username, email, phone: phone || null,
      password_hash: passwordHash,
      full_name: fullName,
      gender: gender || null,
      date_of_birth: dateOfBirth || null,
      status: USER_STATUS.ACTIVE,
      created_at: new Date(), updated_at: new Date(),
    }, { transaction: t });

    const memberRole = await Role.findOne({
      where: { role_code: ROLES.MEMBER }, transaction: t,
    });
    if (!memberRole) {
      throw ApiError.badRequest('Chưa có vai trò MEMBER trong hệ thống. Hãy chạy seed data trước.');
    }
    await UserRole.create({
      user_id: created.user_id, role_id: memberRole.role_id, assigned_at: new Date(),
    }, { transaction: t });

    return created;
  });

  const principal = await rbac.loadPrincipal(user.user_id);
  const tokens = await tokenService.issueTokenPair(principal, ctx);
  await logLogin(user.user_id, ctx, 'SUCCESS');

  return { user: toPublic(principal), ...tokens };
}

/**
 * HTTMDTTHA-7 — Đăng nhập.
 * Chấp nhận đăng nhập bằng email, tên đăng nhập hoặc số điện thoại.
 * Thông báo lỗi cố tình không phân biệt "sai tài khoản" với "sai mật khẩu"
 * để không giúp kẻ tấn công dò xem email nào đã tồn tại.
 */
async function login({ identifier, password }, ctx = {}) {
  const user = await User.scope('withPassword').findOne({
    where: {
      [Op.or]: [{ email: identifier }, { username: identifier }, { phone: identifier }],
    },
  });

  const GENERIC = 'Thông tin đăng nhập không chính xác';

  if (!user) {
    await logLogin(null, ctx, 'FAILED', 'Tài khoản không tồn tại');
    throw ApiError.unauthorized(GENERIC, 'INVALID_CREDENTIALS');
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    await logLogin(user.user_id, ctx, 'FAILED', 'Sai mật khẩu');
    throw ApiError.unauthorized(GENERIC, 'INVALID_CREDENTIALS');
  }

  if (user.status === USER_STATUS.LOCKED) {
    await logLogin(user.user_id, ctx, 'FAILED', 'Tài khoản bị khóa');
    throw ApiError.forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    await logLogin(user.user_id, ctx, 'FAILED', `Trạng thái ${user.status}`);
    throw ApiError.forbidden('Tài khoản chưa được kích hoạt');
  }

  await User.update(
    { last_login_at: new Date() }, { where: { user_id: user.user_id } },
  );
  rbac.invalidateUser(user.user_id);

  const principal = await rbac.loadPrincipal(user.user_id);
  const tokens = await tokenService.issueTokenPair(principal, ctx);
  await logLogin(user.user_id, ctx, 'SUCCESS');

  return { user: toPublic(principal), ...tokens };
}

/**
 * HTTMDTTHA-7 — Làm mới phiên.
 * Áp dụng xoay vòng token: refresh token cũ bị thu hồi ngay khi cấp cặp mới,
 * nên nếu token bị đánh cắp thì chỉ dùng được một lần.
 */
async function refresh(refreshToken, ctx = {}) {
  const { payload, record } = await tokenService.verifyRefreshToken(refreshToken);

  const principal = await rbac.loadPrincipal(Number(payload.sub));
  if (!principal) throw ApiError.unauthorized('Tài khoản không còn tồn tại');
  if (principal.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Tài khoản đã bị khóa hoặc chưa kích hoạt');
  }

  await record.update({ revoked_at: new Date() });
  const tokens = await tokenService.issueTokenPair(principal, ctx);
  return { user: toPublic(principal), ...tokens };
}

async function logout(refreshToken) {
  const revoked = await tokenService.revokeToken(refreshToken);
  return { revoked };
}

async function logoutAll(userId) {
  const count = await tokenService.revokeAllTokens(userId);
  return { revokedCount: count };
}

/** Chỉ trả ra ngoài những trường an toàn, không bao giờ lộ mã băm mật khẩu. */
function toPublic(principal) {
  return {
    userId: principal.userId,
    username: principal.username,
    email: principal.email,
    fullName: principal.fullName,
    status: principal.status,
    roles: principal.roles,
    permissions: principal.permissions,
  };
}

module.exports = { register, login, refresh, logout, logoutAll, toPublic, USER_STATUS };
