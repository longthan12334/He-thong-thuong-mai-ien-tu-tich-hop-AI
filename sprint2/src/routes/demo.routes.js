'use strict';
/**
 * Các endpoint mẫu minh họa cách áp dụng middleware RBAC (HTTMDTTHA-8).
 * Nhóm dùng file này làm khuôn khi hiện thực các phân hệ còn lại của Sprint 2.
 */
const express = require('express');
const { authenticate, optionalAuth } = require('../middlewares/authenticate');
const {
  requirePermissions, requireRoles, requireOwnershipOr, requireAny, requireAdmin,
} = require('../middlewares/authorize');
const { PERMISSIONS: P, ROLES } = require('../constants/permissions');
const { ok } = require('../utils/response');
const { sequelize } = require('../models');

const router = express.Router();

// 1. Công khai, cá nhân hóa nếu đã đăng nhập
router.get('/products', optionalAuth, (req, res) =>
  ok(res, {
    mode: req.user ? 'đã đăng nhập — có thể gắn gợi ý AI' : 'khách vãng lai',
    viewer: req.user?.username || null,
  }));

// 2. Cần một quyền cụ thể
router.post('/products', authenticate, requirePermissions(P.PRODUCT_CREATE), (req, res) =>
  ok(res, { createdBy: req.user.username }, 'Đủ quyền tạo sản phẩm'));

// 3. Cần đồng thời nhiều quyền
router.patch('/inventories/:id', authenticate,
  requirePermissions([P.INVENTORY_VIEW, P.INVENTORY_UPDATE]), (req, res) =>
    ok(res, { inventoryId: req.params.id }, 'Đủ quyền cập nhật tồn kho'));

// 4. Chỉ cần một trong các quyền
router.get('/orders', authenticate,
  requirePermissions([P.ORDER_VIEW_ALL, P.ORDER_VIEW_SHOP], { mode: 'any' }), (req, res) =>
    ok(res, { scope: req.user.permissions.includes(P.ORDER_VIEW_ALL) ? 'toàn sàn' : 'gian hàng' }));

// 5. Chủ sở hữu hoặc quyền vượt cấp
router.get('/orders/:id', authenticate,
  requireOwnershipOr(async (req) => {
    const [rows] = await sequelize.query(
      'SELECT user_id FROM orders WHERE order_id = :id',
      { replacements: { id: Number(req.params.id) } },
    );
    return rows[0]?.user_id ?? null;
  }, [P.ORDER_VIEW_ALL]),
  (req, res) => ok(res, { orderId: req.params.id }, 'Được phép xem đơn hàng này'));

// 6. Nhiều con đường hợp lệ
router.patch('/orders/:id/status', authenticate,
  requireAny(
    requirePermissions(P.ORDER_VIEW_ALL),
    requirePermissions(P.ORDER_UPDATE_STATUS),
  ),
  (req, res) => ok(res, { orderId: req.params.id }, 'Được phép chuyển trạng thái đơn'));

// 7. Theo vai trò
router.get('/seller/dashboard', authenticate, requireRoles(ROLES.SELLER, ROLES.ADMIN), (req, res) =>
  ok(res, { roles: req.user.roles }, 'Bảng điều khiển người bán'));

// 8. Chỉ quản trị viên
router.get('/admin/config', authenticate, requireAdmin, (req, res) =>
  ok(res, { by: req.user.username }, 'Cấu hình hệ thống'));

module.exports = router;
