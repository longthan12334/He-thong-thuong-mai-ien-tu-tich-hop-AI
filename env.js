'use strict';
require('dotenv').config();

/** Đọc biến môi trường bắt buộc, dừng hẳn tiến trình nếu thiếu. */
function required(key, fallback) {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === '') {
    // eslint-disable-next-line no-console
    console.error(`[CẤU HÌNH] Thiếu biến môi trường bắt buộc: ${key}`);
    process.exit(1);
  }
  return v;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Danh sách origin được phép gọi API. Mặc định mở cho Next.js chạy máy cục bộ.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean),

  db: {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    name: required('DB_NAME', 'ecom'),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    issuer: process.env.JWT_ISSUER || 'httmdt-api',
  },

  security: {
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
    loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
    loginWindowMinutes: Number(process.env.LOGIN_WINDOW_MINUTES || 15),
  },
};

// Chặn khởi động production nếu vẫn dùng chuỗi bí mật mẫu
if (env.nodeEnv === 'production') {
  for (const k of ['accessSecret', 'refreshSecret']) {
    if (env.jwt[k].startsWith('doi_chuoi_nay')) {
      // eslint-disable-next-line no-console
      console.error(`[CẤU HÌNH] JWT ${k} vẫn là giá trị mẫu. Đổi trước khi chạy production.`);
      process.exit(1);
    }
  }
}

module.exports = env;
