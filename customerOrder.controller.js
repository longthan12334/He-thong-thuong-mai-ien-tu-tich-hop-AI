'use strict';
const service = require('./customerOrder.service');
const { ok, catchAsync } = require('../../shared/http/response');

/** GET /orders — lịch sử đơn hàng của chính khách hàng */
const list = catchAsync(async (req, res) =>
  ok(res, await service.listOrders(req.user.userId, req.query), 'Lấy danh sách đơn hàng thành công'));

/** GET /orders/summary — số đơn theo từng trạng thái, dùng cho các tab */
const summary = catchAsync(async (req, res) => {
  const [statuses, spending] = await Promise.all([
    service.statusSummary(req.user.userId),
    service.spendingSummary(req.user.userId),
  ]);
  return ok(res, { ...statuses, spending }, 'Lấy thống kê đơn hàng thành công');
});

/** GET /orders/:id — chi tiết một đơn */
const detail = catchAsync(async (req, res) =>
  ok(res, await service.getOrderDetail(req.user.userId, req.params.id), 'Lấy chi tiết đơn hàng thành công'));

/** POST /orders/:id/cancel — khách tự hủy đơn khi hàng chưa rời kho */
const cancel = catchAsync(async (req, res) =>
  ok(res, await service.cancelOrder(req.user.userId, req.params.id, req.body.reason), 'Hủy đơn hàng thành công'));

/** POST /orders/:id/confirm-received — khách xác nhận đã nhận hàng */
const confirmReceived = catchAsync(async (req, res) =>
  ok(res, await service.confirmReceived(req.user.userId, req.params.id), 'Xác nhận đã nhận hàng thành công'));

module.exports = { list, summary, detail, cancel, confirmReceived };
