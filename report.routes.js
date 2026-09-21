'use strict';
/**
 * HTTMDTTHA-70 — Định tuyến báo cáo và thống kê doanh thu.
 *
 * Toàn bộ nhóm endpoint này đòi hai quyền cùng lúc: REPORT_VIEW để xem báo cáo
 * và ORDER_VIEW_ALL để đọc dữ liệu đơn hàng toàn sàn. Người bán có REPORT_VIEW
 * nhưng không có ORDER_VIEW_ALL nên không thể xem số liệu của gian hàng khác.
 */
const express = require('express');
const ctrl = require('./report.controller');
const validate = require('../../shared/middlewares/validate');
const { authenticate } = require('../../shared/middlewares/authenticate');
const { requirePermissions } = require('../../shared/middlewares/authorize');
const { PERMISSIONS: P } = require('../../shared/constants/permissions');
const { rangeRules, seriesRules, rankingRules, exportRules } = require('./report.validator');

const router = express.Router();

router.use(authenticate);
router.use(requirePermissions([P.REPORT_VIEW, P.ORDER_VIEW_ALL], { mode: 'all' }));

router.get('/dashboard', seriesRules, validate, ctrl.dashboard);
router.get('/overview', rangeRules, validate, ctrl.overview);
router.get('/revenue', seriesRules, validate, ctrl.revenue);
router.get('/orders-by-status', rangeRules, validate, ctrl.ordersByStatus);
router.get('/top-products', rankingRules, validate, ctrl.topProducts);
router.get('/top-shops', rankingRules, validate, ctrl.topShops);
router.get('/revenue-by-category', rangeRules, validate, ctrl.revenueByCategory);
router.get('/payment-methods', rangeRules, validate, ctrl.paymentMethods);
router.get('/export', exportRules, validate, ctrl.exportCsv);

module.exports = router;
