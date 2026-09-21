'use strict';
const authService = require('./auth.service');
const { ok, created, catchAsync } = require('../../shared/http/response');

/** Gom thông tin ngữ cảnh request để ghi nhật ký và gắn vào refresh token. */
function context(req) {
  return { ip: req.ip, userAgent: req.get('user-agent') };
}

/** POST /auth/register — HTTMDTTHA-7 */
const register = catchAsync(async (req, res) => {
  const result = await authService.register({
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    fullName: req.body.fullName,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
  }, context(req));
  return created(res, result, 'Đăng ký tài khoản thành công');
});

/** POST /auth/login — HTTMDTTHA-7 */
const login = catchAsync(async (req, res) => {
  const result = await authService.login({
    identifier: req.body.identifier,
    password: req.body.password,
  }, context(req));
  return ok(res, result, 'Đăng nhập thành công');
});

/** POST /auth/refresh — cấp lại cặp token, thu hồi token cũ */
const refresh = catchAsync(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken, context(req));
  return ok(res, result, 'Làm mới phiên đăng nhập thành công');
});

/** POST /auth/logout — thu hồi refresh token của thiết bị hiện tại */
const logout = catchAsync(async (req, res) => {
  const result = await authService.logout(req.body.refreshToken);
  return ok(res, result, 'Đăng xuất thành công');
});

/** POST /auth/logout-all — thu hồi toàn bộ phiên của người dùng */
const logoutAll = catchAsync(async (req, res) => {
  const result = await authService.logoutAll(req.user.userId);
  return ok(res, result, 'Đã đăng xuất khỏi mọi thiết bị');
});

/** GET /auth/me — thông tin phiên hiện tại kèm vai trò và quyền */
const me = catchAsync(async (req, res) => ok(res, { user: req.user }, 'Lấy thông tin thành công'));

module.exports = { register, login, refresh, logout, logoutAll, me };
