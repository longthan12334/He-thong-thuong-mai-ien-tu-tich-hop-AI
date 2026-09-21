'use strict';
const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Kết nối Sequelize dùng chung cho toàn ứng dụng.
 * Hỗ trợ cả MySQL và PostgreSQL — chỉ cần đổi DB_DIALECT trong .env,
 * lược đồ bảng của hai phương ngữ đã được sinh sẵn trong thư mục database/.
 */
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.db.logging ? console.log : false,
  // MySQL cần khai báo múi giờ tường minh; PostgreSQL tự xử lý qua kiểu dữ liệu
  ...(env.db.dialect === 'mysql' ? { timezone: '+07:00' } : {}),
  define: {
    timestamps: false,      // các bảng tự quản lý created_at / updated_at
    freezeTableName: true,  // không tự động đổi tên bảng sang số nhiều
    underscored: true,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

module.exports = { sequelize, Sequelize };
