'use strict';
const { Op, Order } = require('../../database/models');
const ApiError = require('../../shared/errors/ApiError');
const { parsePagination, buildPage } = require('../../shared/utils/pagination');
const { detailIncludes, listIncludes, buildWhere, buildOrder } = require('./order.query');
const { serializeSummary, serializeDetail } = require('./order.serializer');
const workflow = require('./order.workflow.service');
const { ORDER_STATUS } = require('../../shared/constants/enums');
const { STATUS_LABEL, CUSTOMER_CANCELLABLE } = require('./order.constants');

/**
 * HTTMDTTHA-68 — Lịch sử đơn hàng cho khách hàng.
 *
 * Mọi truy vấn trong tệp này đều gắn cứng điều kiện user_id của người đang đăng nhập,
 * nên không có đường nào để một khách xem được đơn của khách khác, kể cả khi
 * đoán đúng mã đơn.
 */

/** Danh sách đơn của chính khách hàng, có lọc, tìm kiếm và phân trang. */
async function listOrders(userId, query = {}) {
  const page = parsePagination(query);
  const where = buildWhere({
    scope: { user_id: userId },
    status: query.status,
    paymentStatus: query.paymentStatus,
    search: query.search,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(`${query.to}T23:59:59.999`) : undefined,
  });

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: listIncludes(),
    order: buildOrder(query.sortBy, query.sortDir),
    limit: page.limit,
    offset: page.offset,
    distinct: true,          // tránh đếm trùng do include quan hệ một-nhiều
    col: 'order_id',
    subQuery: false,
  });

  return buildPage(rows.map(serializeSummary), count, page);
}

/**
 * Đếm số đơn theo từng trạng thái — dùng để vẽ các tab trên màn hình lịch sử.
 * Một truy vấn gộp thay vì tám truy vấn riêng.
 */
async function statusSummary(userId) {
  const rows = await Order.findAll({
    where: { user_id: userId },
    attributes: ['order_status', [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count']],
    group: ['order_status'],
    raw: true,
  });

  const counted = Object.fromEntries(rows.map((r) => [r.order_status, Number(r.count)]));
  const byStatus = Object.values(ORDER_STATUS).map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: counted[status] || 0,
  }));

  return {
    total: byStatus.reduce((s, x) => s + x.count, 0),
    byStatus,
  };
}

/** Chi tiết một đơn, kèm dòng hàng, lịch sử trạng thái, thanh toán và vận đơn. */
async function getOrderDetail(userId, orderId) {
  const order = await Order.findOne({
    where: { order_id: orderId, user_id: userId },
    include: detailIncludes(),
    order: [
      [{ model: Order.associations.statusHistory.target, as: 'statusHistory' }, 'changed_at', 'ASC'],
    ],
  });
  if (!order) throw ApiError.notFound('Không tìm thấy đơn hàng của bạn');
  return serializeDetail(order);
}

/**
 * Khách tự hủy đơn.
 * Chỉ cho phép khi đơn chưa rời kho; sau đó phần hàng đang giữ chỗ được nhả ra.
 */
async function cancelOrder(userId, orderId, reason) {
  const order = await Order.findOne({
    where: { order_id: orderId, user_id: userId },
    attributes: ['order_id', 'order_status'],
  });
  if (!order) throw ApiError.notFound('Không tìm thấy đơn hàng của bạn');

  if (!CUSTOMER_CANCELLABLE.includes(order.order_status)) {
    throw ApiError.conflict(
      `Đơn đang ở trạng thái ${STATUS_LABEL[order.order_status]} nên không thể tự hủy. `
      + 'Vui lòng liên hệ người bán để được hỗ trợ.',
      { currentStatus: order.order_status, cancellableFrom: CUSTOMER_CANCELLABLE },
    );
  }

  return workflow.transition(orderId, ORDER_STATUS.CANCELLED,
    { userId, allowedTargets: [ORDER_STATUS.CANCELLED] },
    { reason, note: 'Khách hàng tự hủy đơn', scopeWhere: { user_id: userId } });
}

/** Khách xác nhận đã nhận hàng — chuyển đơn từ Đã giao sang Hoàn thành. */
async function confirmReceived(userId, orderId) {
  return workflow.transition(orderId, ORDER_STATUS.COMPLETED,
    { userId, allowedTargets: [ORDER_STATUS.COMPLETED] },
    { note: 'Khách xác nhận đã nhận hàng', scopeWhere: { user_id: userId } });
}

/**
 * Tổng chi tiêu của khách — hiển thị ở đầu màn hình lịch sử đơn.
 * Chỉ tính các đơn đã giao thành công.
 */
async function spendingSummary(userId) {
  const row = await Order.findOne({
    where: {
      user_id: userId,
      order_status: { [Op.in]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED] },
    },
    attributes: [
      [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'orderCount'],
      [Order.sequelize.fn('COALESCE', Order.sequelize.fn('SUM', Order.sequelize.col('total_amount')), 0), 'totalSpent'],
    ],
    raw: true,
  });
  const orderCount = Number(row?.orderCount || 0);
  const totalSpent = Number(row?.totalSpent || 0);
  return {
    orderCount,
    totalSpent,
    averageOrderValue: orderCount ? Math.round(totalSpent / orderCount) : 0,
  };
}

module.exports = {
  listOrders, statusSummary, getOrderDetail, cancelOrder, confirmReceived, spendingSummary,
};
