'use strict';
const { validationResult } = require('express-validator');
const ApiError = require('../errors/ApiError');

/** Gom lỗi của express-validator thành một lỗi 400 có cấu trúc thống nhất. */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  return next(ApiError.badRequest('Dữ liệu gửi lên không hợp lệ', details));
}

module.exports = validate;
