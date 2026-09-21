'use strict';
/**
 * HTTMDTTHA-68 — Định tuyến lịch sử đơn hàng cho khách hàng.
 * Toàn bộ endpoint đều yêu cầu đăng nhập; phạm vi dữ liệu gắn cứng theo user_id.
 */
const express = require('express');
const ctrl = require('./customerOrder.controller');
const validate = require('../../shared/middlewares/validate');
const { authenticate } = require('../../shared/middlewares/authenticate');
const { requirePermissions } = require('../../shared/middlewares/authorize');
const { PERMISSIONS: P } = require('../../shared/constants/permissions');
const { listRules, orderIdRule, cancelRules } = require('./order.validator');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermissions(P.ORDER_VIEW_OWN), listRules, validate, ctrl.list);
router.get('/summary', requirePermissions(P.ORDER_VIEW_OWN), ctrl.summary);
router.get('/:id', requirePermissions(P.ORDER_VIEW_OWN), orderIdRule, validate, ctrl.detail);

router.post('/:id/cancel', requirePermissions(P.ORDER_CANCEL), cancelRules, validate, ctrl.cancel);
router.post('/:id/confirm-received', requirePermissions(P.ORDER_VIEW_OWN), orderIdRule, validate, ctrl.confirmReceived);

module.exports = router;
