'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

/** Giới hạn thử đăng nhập theo IP — chống tấn công dò mật khẩu (NFR-05). */
const loginLimiter = rateLimit({
  windowMs: env.security.loginWindowMinutes * 60 * 1000,
  max: env.security.loginMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.',
    },
  },
});

/** Giới hạn đăng ký để hạn chế tạo tài khoản hàng loạt. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Vượt quá số lần đăng ký cho phép trong một giờ.' },
  },
});

/** Giới hạn chung cho toàn bộ API. */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter, globalLimiter };
