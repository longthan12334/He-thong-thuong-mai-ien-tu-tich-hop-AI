'use strict';
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./database/models');

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`[CSDL] Kết nối ${env.db.dialect} thành công: ${env.db.name}`);
  } catch (err) {
    console.error('[CSDL] Không kết nối được:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[API] Đang chạy tại http://localhost:${env.port}${env.apiPrefix}`);
  });

  const shutdown = (signal) => {
    console.log(`\n[API] Nhận tín hiệu ${signal}, đang dừng...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
