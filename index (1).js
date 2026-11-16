'use strict';
/**
 * Bảng định tuyến gốc.
 * Mỗi module nghiệp vụ tự khai báo router của mình; tệp này chỉ gắn chúng
 * vào tiền tố URL tương ứng, nên thêm một phân hệ mới chỉ là thêm một dòng.
 */
const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const customerOrderRoutes = require('../modules/orders/customerOrder.routes');
const sellerOrderRoutes = require('../modules/orders/sellerOrder.routes');
const reportRoutes = require('../modules/reports/report.routes');

const router = express.Router();

router.get('/health', (_req, res) => res.json({
  success: true,
  message: 'API đang hoạt động',
  data: { uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
}));

router.use('/auth', authRoutes);                  // HTTMDTTHA-7, HTTMDTTHA-8
router.use('/orders', customerOrderRoutes);       // HTTMDTTHA-68
router.use('/seller/orders', sellerOrderRoutes);  // HTTMDTTHA-69
router.use('/admin/reports', reportRoutes);       // HTTMDTTHA-70

module.exports = router;
