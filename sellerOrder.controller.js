'use strict';
const service = require('./sellerOrder.service');
const { ok, catchAsync } = require('../../shared/http/response');

/** GET /seller/orders — danh sách đơn của gian hàng */
const list = catchAsync(async (req, res) => {
  const shopId = await service.resolveShopId(req.user, req.query.shopId);
  return ok(res, await service.listOrders(shopId, req.query), 'Lấy danh sách đơn hàng thành công');
});

/** GET /seller/orders/stats — số liệu nhanh cho bảng điều khiển */
const stats = catchAsync(async (req, res) => {
  const shopId = await service.resolveShopId(req.user, req.query.shopId);
  return ok(res, await service.dashboardStats(shopId), 'Lấy thống kê gian hàng thành công');
});

/** GET /seller/orders/:id — chi tiết đơn của gian hàng */
const detail = catchAsync(async (req, res) => {
  const shopId = await service.resolveShopId(req.user, req.query.shopId);
  return ok(res, await service.getOrderDetail(shopId, req.params.id), 'Lấy chi tiết đơn hàng thành công');
});

/** PATCH /seller/orders/:id/status — cập nhật trạng thái một đơn */
const updateStatus = catchAsync(async (req, res) => {
  const shopId = await service.resolveShopId(req.user, req.query.shopId);
  const result = await service.updateStatus(shopId, req.params.id, req.body, req.user.userId);
  return ok(res, result, `Đã chuyển đơn sang trạng thái ${result.statusLabel}`);
});

/** PATCH /seller/orders/bulk-status — cập nhật trạng thái nhiều đơn cùng lúc */
const bulkUpdateStatus = catchAsync(async (req, res) => {
  const shopId = await service.resolveShopId(req.user, req.query.shopId);
  const result = await service.bulkUpdateStatus(shopId, req.body.orderIds, req.body, req.user.userId);
  return ok(res, result,
    `Cập nhật thành công ${result.successCount}/${result.total} đơn hàng`);
});

module.exports = { list, stats, detail, updateStatus, bulkUpdateStatus };
