'use strict';
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Bắt mọi route không khớp. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Không tìm thấy endpoint ${req.method} ${req.originalUrl}`));
}

/** Xử lý lỗi tập trung — mọi phản hồi lỗi đều cùng một cấu trúc. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  // Chuyển lỗi của Sequelize sang lỗi nghiệp vụ dễ hiểu
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'dữ liệu';
    error = ApiError.conflict(`Giá trị của trường ${field} đã tồn tại`, { field });
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = ApiError.badRequest('Dữ liệu tham chiếu không tồn tại');
  } else if (err.name === 'SequelizeValidationError') {
    error = ApiError.badRequest('Dữ liệu không hợp lệ',
      err.errors.map((e) => ({ field: e.path, message: e.message })));
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(500, 'INTERNAL_ERROR', 'Lỗi hệ thống, vui lòng thử lại sau');
  }

  if (error.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[LỖI HỆ THỐNG]', err);
  }

  const body = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };
  if (env.nodeEnv !== 'production' && error.statusCode >= 500) {
    body.error.stack = err.stack;
  }

  return res.status(error.statusCode).json(body);
}

module.exports = { notFound, errorHandler };
