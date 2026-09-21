'use strict';
/**
 * HTTMDTTHA-69 — Định tuyến quản lý đơn hàng cho người bán.
 * Quyền xem tách khỏi quyền đổi trạng thái, nên có thể cấp cho nhân viên
 * vai trò chỉ đọc mà không cho phép thao tác.
 */
const express = require('express');
const ctrl = require('./sellerOrder.controller');
const validate = require('../../shared/middlewares/validate');
const { authenticate } = require('../../shared/middlewares/authenticate');
const { requirePermissions } = require('../../shared/middlewares/authorize');
const { PERMISSIONS: P } = require('../../shared/constants/permissions');
const {
  listRules, orderIdRule, updateStatusRules, bulkUpdateRules, shopScopeRule,
} = require('./order.validator');

const router = express.Router();
router.use(authenticate);

const canView = requirePermissions([P.ORDER_VIEW_SHOP, P.ORDER_VIEW_ALL], { mode: 'any' });
const canUpdate = requirePermissions(P.ORDER_UPDATE_STATUS);

router.get('/', canView, [...listRules, ...shopScopeRule], validate, ctrl.list);
router.get('/stats', canView, shopScopeRule, validate, ctrl.stats);
router.patch('/bulk-status', canUpdate, [...bulkUpdateRules, ...shopScopeRule], validate, ctrl.bulkUpdateStatus);
router.get('/:id', canView, [...orderIdRule, ...shopScopeRule], validate, ctrl.detail);
router.patch('/:id/status', canUpdate, [...updateStatusRules, ...shopScopeRule], validate, ctrl.updateStatus);

module.exports = router;
