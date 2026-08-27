'use strict';
const ApiError = require('../utils/ApiError');
const tokenService = require('../services/token.service');
const rbac = require('../services/rbac.service');
const { USER_STATUS } = require('../services/auth.service');

/** Lấy token từ header Authorization: Bearer <token>. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, value] = header.split(' ');
  if (scheme && /^Bearer$/i.test(scheme) && value) return value.trim();
  return null;
}

/**
 * HTTMDTTHA-8 — Bước 1: xác thực.
 * Kiểm tra chữ ký JWT rồi nạp lại vai trò và quyền từ cơ sở dữ liệu.
 * Chủ ý không tin danh sách quyền nằm trong token, vì như vậy quản trị viên
 * thu hồi quyền sẽ có hiệu lực ngay thay vì phải chờ token hết hạn.
 */
async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('Thiếu access token trong header Authorization', 'MISSING_TOKEN');
    }

    const payload = tokenService.verifyAccessToken(token);
    const principal = await rbac.loadPrincipal(Number(payload.sub));

    if (!principal) throw ApiError.unauthorized('Tài khoản không còn tồn tại', 'USER_NOT_FOUND');
    if (principal.status === USER_STATUS.LOCKED) {
      throw ApiError.forbidden('Tài khoản đã bị khóa');
    }
    if (principal.status !== USER_STATUS.ACTIVE) {
      throw ApiError.forbidden('Tài khoản chưa được kích hoạt');
    }

    req.user = principal;
    req.tokenPayload = payload;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Xác thực không bắt buộc: dùng cho các endpoint mà khách vãng lai vẫn xem được
 * nhưng nội dung sẽ được cá nhân hóa nếu người dùng đã đăng nhập
 * (ví dụ danh sách sản phẩm kèm gợi ý AI).
 */
async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = tokenService.verifyAccessToken(token);
    const principal = await rbac.loadPrincipal(Number(payload.sub));
    if (principal && principal.status === USER_STATUS.ACTIVE) {
      req.user = principal;
      req.tokenPayload = payload;
    }
  } catch {
    // Token hỏng thì coi như khách vãng lai, không báo lỗi
  }
  return next();
}

module.exports = { authenticate, optionalAuth, extractToken };
