'use strict';

/** Chuẩn hóa phản hồi thành công để phía giao diện luôn đọc cùng một cấu trúc. */
function ok(res, data = null, message = 'Thành công', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function created(res, data, message = 'Tạo mới thành công') {
  return ok(res, data, message, 201);
}

/** Bọc handler bất đồng bộ, đẩy mọi lỗi về middleware xử lý lỗi tập trung. */
function catchAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { ok, created, catchAsync };
