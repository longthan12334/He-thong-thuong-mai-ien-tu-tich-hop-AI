'use strict';
const { body, param, query } = require('express-validator');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../shared/constants/enums');
const { SELLER_ALLOWED } = require('./order.constants');

const STATUSES = Object.values(ORDER_STATUS);

/** Cho phép truyền status một lần hoặc nhiều lần: ?status=PENDING&status=CONFIRMED */
const statusQuery = query('status').optional()
  .customSanitizer((v) => (v === undefined ? v : [].concat(v)))
  .custom((arr) => {
    const bad = arr.filter((s) => !STATUSES.includes(s));
    if (bad.length) throw new Error(`Trạng thái không hợp lệ: ${bad.join(', ')}`);
    return true;
  });

const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit trong khoảng 1 đến 100'),
  statusQuery,
  query('paymentStatus').optional().isIn(Object.values(PAYMENT_STATUS))
    .withMessage('Trạng thái thanh toán không hợp lệ'),
  query('from').optional().isISO8601().withMessage('from phải theo định dạng YYYY-MM-DD'),
  query('to').optional().isISO8601().withMessage('to phải theo định dạng YYYY-MM-DD'),
  query('search').optional().trim().isLength({ max: 100 })
    .withMessage('Từ khóa tìm kiếm tối đa 100 ký tự'),
  query('sortBy').optional()
    .isIn(['placed_at', 'total_amount', 'order_code', 'order_status'])
    .withMessage('Cột sắp xếp không được hỗ trợ'),
  query('sortDir').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Chiều sắp xếp chỉ nhận asc hoặc desc'),
];

const orderIdRule = [
  param('id').isInt({ min: 1 }).withMessage('Mã đơn hàng phải là số nguyên dương').toInt(),
];

const cancelRules = [
  ...orderIdRule,
  body('reason').optional().trim().isLength({ max: 255 })
    .withMessage('Lý do hủy tối đa 255 ký tự'),
];

const updateStatusRules = [
  ...orderIdRule,
  body('toStatus').notEmpty().withMessage('Thiếu trạng thái đích')
    .isIn(SELLER_ALLOWED)
    .withMessage(`Người bán chỉ được chuyển sang: ${SELLER_ALLOWED.join(', ')}`),
  body('note').optional().trim().isLength({ max: 255 })
    .withMessage('Ghi chú tối đa 255 ký tự'),
  body('reason').optional().trim().isLength({ max: 255 })
    .withMessage('Lý do tối đa 255 ký tự'),
];

const bulkUpdateRules = [
  body('orderIds').isArray({ min: 1, max: 50 })
    .withMessage('orderIds phải là mảng từ 1 đến 50 phần tử'),
  body('orderIds.*').isInt({ min: 1 }).withMessage('Mã đơn hàng phải là số nguyên dương'),
  body('toStatus').isIn(SELLER_ALLOWED)
    .withMessage(`Người bán chỉ được chuyển sang: ${SELLER_ALLOWED.join(', ')}`),
  body('note').optional().trim().isLength({ max: 255 }),
  body('reason').optional().trim().isLength({ max: 255 }),
];

const shopScopeRule = [
  query('shopId').optional().isInt({ min: 1 })
    .withMessage('shopId phải là số nguyên dương').toInt(),
];

module.exports = {
  listRules, orderIdRule, cancelRules, updateStatusRules, bulkUpdateRules, shopScopeRule,
};
