'use strict';
const { body } = require('express-validator');

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
const PHONE_RULE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

const registerRules = [
  body('username').trim()
    .isLength({ min: 4, max: 50 }).withMessage('Tên đăng nhập phải từ 4 đến 50 ký tự')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Tên đăng nhập chỉ gồm chữ, số và các ký tự . _ -'),
  body('email').trim().isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone').optional({ values: 'falsy' }).trim()
    .matches(PHONE_RULE).withMessage('Số điện thoại Việt Nam không hợp lệ'),
  body('password')
    .matches(PASSWORD_RULE)
    .withMessage('Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số'),
  body('confirmPassword').custom((v, { req }) => {
    if (v !== undefined && v !== req.body.password) {
      throw new Error('Xác nhận mật khẩu không khớp');
    }
    return true;
  }),
  body('fullName').trim()
    .isLength({ min: 2, max: 150 }).withMessage('Họ tên phải từ 2 đến 150 ký tự'),
  body('gender').optional({ values: 'falsy' })
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Giới tính không hợp lệ'),
  body('dateOfBirth').optional({ values: 'falsy' })
    .isISO8601().withMessage('Ngày sinh phải theo định dạng YYYY-MM-DD'),
];

const loginRules = [
  body('identifier').trim().notEmpty()
    .withMessage('Nhập email, tên đăng nhập hoặc số điện thoại'),
  body('password').notEmpty().withMessage('Nhập mật khẩu'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('Thiếu refresh token'),
];

module.exports = { registerRules, loginRules, refreshRules, PASSWORD_RULE, PHONE_RULE };
