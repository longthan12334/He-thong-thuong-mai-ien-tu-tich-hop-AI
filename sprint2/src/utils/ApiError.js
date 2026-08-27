'use strict';

/** Lỗi nghiệp vụ có mã HTTP và mã lỗi định danh để phía giao diện xử lý. */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Bạn chưa đăng nhập hoặc phiên đã hết hạn', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }
  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này', details) {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }
  static notFound(message = 'Không tìm thấy dữ liệu') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }
  static tooMany(message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }
}

module.exports = ApiError;
