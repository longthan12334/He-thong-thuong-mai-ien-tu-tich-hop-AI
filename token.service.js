'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../../config/env');
const { AuthToken } = require('../../database/models');
const ApiError = require('../../shared/errors/ApiError');

const TYPE = { ACCESS: 'access', REFRESH: 'refresh' };

/** Băm refresh token trước khi lưu — cơ sở dữ liệu không bao giờ giữ bản rõ. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Quy đổi chuỗi dạng '15m', '7d' sang mốc thời gian hết hạn. */
function expiryDate(spec) {
  const m = /^(\d+)([smhd])$/.exec(spec);
  if (!m) throw new Error(`Định dạng thời hạn không hợp lệ: ${spec}`);
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
  return new Date(Date.now() + Number(m[1]) * unit);
}

/**
 * Sinh access token. Payload cố ý gọn: chỉ chứa định danh và vai trò.
 * Danh sách quyền chi tiết được nạp lại ở middleware để việc thu hồi quyền
 * có hiệu lực ngay, không phải chờ token hết hạn.
 */
function signAccessToken(principal) {
  return jwt.sign(
    { sub: String(principal.userId), username: principal.username,
      roles: principal.roles, typ: TYPE.ACCESS },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires, issuer: env.jwt.issuer, jwtid: crypto.randomUUID() },
  );
}

function signRefreshToken(principal) {
  return jwt.sign(
    { sub: String(principal.userId), typ: TYPE.REFRESH },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires, issuer: env.jwt.issuer, jwtid: crypto.randomUUID() },
  );
}

/** Sinh cặp token và lưu refresh token (đã băm) vào bảng auth_tokens. */
async function issueTokenPair(principal, context = {}) {
  const accessToken = signAccessToken(principal);
  const refreshToken = signRefreshToken(principal);

  await AuthToken.create({
    user_id: principal.userId,
    token_hash: hashToken(refreshToken),
    token_type: 'REFRESH',
    device_info: (context.userAgent || '').slice(0, 255) || null,
    ip_address: context.ip || null,
    expires_at: expiryDate(env.jwt.refreshExpires),
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.jwt.accessExpires,
  };
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, { issuer: env.jwt.issuer });
    if (payload.typ !== TYPE.ACCESS) {
      throw ApiError.unauthorized('Sai loại token', 'INVALID_TOKEN_TYPE');
    }
    return payload;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Phiên đăng nhập đã hết hạn', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Token không hợp lệ', 'INVALID_TOKEN');
  }
}

/**
 * Kiểm tra refresh token: vừa xác thực chữ ký, vừa đối chiếu bản ghi
 * trong cơ sở dữ liệu để token đã đăng xuất không dùng lại được.
 */
async function verifyRefreshToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret, { issuer: env.jwt.issuer });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token đã hết hạn', 'REFRESH_TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Refresh token không hợp lệ', 'INVALID_REFRESH_TOKEN');
  }
  if (payload.typ !== TYPE.REFRESH) {
    throw ApiError.unauthorized('Sai loại token', 'INVALID_TOKEN_TYPE');
  }

  const record = await AuthToken.findOne({
    where: {
      token_hash: hashToken(token),
      token_type: 'REFRESH',
      revoked_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!record) {
    throw ApiError.unauthorized('Refresh token đã bị thu hồi', 'REFRESH_TOKEN_REVOKED');
  }
  return { payload, record };
}

/** Thu hồi một refresh token cụ thể (đăng xuất khỏi thiết bị hiện tại). */
async function revokeToken(token) {
  const [count] = await AuthToken.update(
    { revoked_at: new Date() },
    { where: { token_hash: hashToken(token), revoked_at: null } },
  );
  return count > 0;
}

/** Thu hồi toàn bộ refresh token của người dùng (đăng xuất mọi thiết bị). */
async function revokeAllTokens(userId) {
  const [count] = await AuthToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, token_type: 'REFRESH', revoked_at: null } },
  );
  return count;
}

module.exports = {
  TYPE, hashToken, expiryDate,
  signAccessToken, signRefreshToken, issueTokenPair,
  verifyAccessToken, verifyRefreshToken, revokeToken, revokeAllTokens,
};
