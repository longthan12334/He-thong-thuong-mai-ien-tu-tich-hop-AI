'use strict';
const { Op, Order, Shop, sequelize } = require('../../database/models');
const ApiError = require('../../shared/errors/ApiError');
const { parsePagination, buildPage } = require('../../shared/utils/pagination');
const { detailIncludes, listIncludes, buildWhere, buildOrder } = require('./order.query');
const { serializeSummary, serializeDetail } = require('./order.serializer');
const workflow = require('./order.workflow.service');
const { ORDER_STATUS } = require('../../shared/constants/enums');
const { STATUS_LABEL, SELLER_ALLOWED, REVENUE_STATUSES, nextStatuses } = require('./order.constants');
const { PERMISSIONS } = require('../../shared/constants/permissions');

/**
 * HTTMDTTHA-69 — Quản lý và cập nhật trạng thái đơn hàng cho người bán.
 *
 * Ranh giới dữ liệu ở đây là gian hàng, không phải người dùng: một người bán chỉ
 * nhìn thấy và thao tác được trên đơn thuộc gian hàng của chính mình. Quản trị viên
 * có quyền ORDER_VIEW_ALL thì được chỉ định gian hàng bất kỳ.
 */

/**
 * Xác định gian hàng mà người đang đăng nhập được phép thao tác.
 * @param {object} principal req.user
 * @param {number|undefined} requestedShopId shopId truyền qua query (chỉ quản trị viên dùng)
 */
async function resolveShopId(principal, requestedShopId) {
  const isAdmin = principal.permissions.includes(PERMISSIONS.ORDER_VIEW_ALL);

  if (requestedShopId) {
    if (!isAdmin) {
      const own = await Shop.findOne({
        where: { owner_user_id: principal.userId }, attributes: ['shop_id'],
      });
      if (!own || Number(own.shop_id) !== Number(requestedShopId)) {
        throw ApiError.forbidden('Bạn chỉ được xem đơn hàng của gian hàng do mình sở hữu');
      }
    }
    return Number(requestedShopId);
  }

  const shop = await Shop.findOne({
    where: { owner_user_id: principal.userId }, attributes: ['shop_id'],
  });
  if (shop) return Number(shop.shop_id);

  if (isAdmin) return null;   // quản trị viên không truyền shopId thì xem toàn sàn
  throw ApiError.forbidden('Tài khoản của bạn chưa gắn với gian hàng nào');
}

/** Danh sách đơn của gian hàng, có lọc theo trạng thái, khoảng ngày và từ khóa. */
async function listOrders(shopId, query = {}) {
  const page = parsePagination(query);
  const where = buildWhere({
    scope: shopId ? { shop_id: shopId } : {},
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
    distinct: true,
    col: 'order_id',
    subQuery: false,
  });

  return buildPage(
    rows.map((o) => ({
      ...serializeSummary(o),
      nextStatuses: nextStatuses(o.order_status)
        .filter((s) => SELLER_ALLOWED.includes(s))
        .map((s) => ({ value: s, label: STATUS_LABEL[s] })),
    })),
    count, page,
  );
}

/** Chi tiết một đơn thuộc gian hàng. */
async function getOrderDetail(shopId, orderId) {
  const order = await Order.findOne({
    where: { order_id: orderId, ...(shopId ? { shop_id: shopId } : {}) },
    include: detailIncludes(),
  });
  if (!order) throw ApiError.notFound('Không tìm thấy đơn hàng trong gian hàng của bạn');

  const detail = serializeDetail(order);
  detail.nextStatuses = detail.nextStatuses.filter((s) => SELLER_ALLOWED.includes(s.value));
  return detail;
}

/**
 * Cập nhật trạng thái đơn.
 *
 * Đây là điểm vào duy nhất để người bán đổi trạng thái. Việc kiểm tra bước chuyển
 * có hợp lệ hay không, và mọi tác động lên tồn kho, thanh toán, vận đơn đều do
 * order.workflow.service lo, trong cùng một giao dịch.
 */
async function updateStatus(shopId, orderId, { toStatus, note, reason }, actorId) {
  if (!SELLER_ALLOWED.includes(toStatus)) {
    throw ApiError.forbidden(
      `Người bán không được phép chuyển đơn sang trạng thái ${STATUS_LABEL[toStatus] || toStatus}`,
      { allowed: SELLER_ALLOWED },
    );
  }
  if (toStatus === ORDER_STATUS.CANCELLED && !reason) {
    throw ApiError.badRequest('Phải nêu lý do khi hủy đơn của khách', [
      { field: 'reason', message: 'Bắt buộc nhập lý do hủy' },
    ]);
  }

  return workflow.transition(orderId, toStatus,
    { userId: actorId, allowedTargets: SELLER_ALLOWED },
    { note, reason, scopeWhere: shopId ? { shop_id: shopId } : {} });
}

/** Chuyển trạng thái hàng loạt — tiện khi người bán xác nhận nhiều đơn cùng lúc. */
async function bulkUpdateStatus(shopId, orderIds, { toStatus, note, reason }, actorId) {
  const results = { succeeded: [], failed: [] };

  for (const orderId of orderIds) {
    try {
      const r = await updateStatus(shopId, orderId, { toStatus, note, reason }, actorId);
      results.succeeded.push(r);
    } catch (err) {
      results.failed.push({
        orderId: Number(orderId),
        code: err.code || 'ERROR',
        message: err.message,
      });
    }
  }
  return {
    ...results,
    total: orderIds.length,
    successCount: results.succeeded.length,
    failureCount: results.failed.length,
  };
}

/** Số liệu nhanh cho bảng điều khiển người bán. */
async function dashboardStats(shopId) {
  const scope = shopId ? { shop_id: shopId } : {};

  const byStatus = await Order.findAll({
    where: scope,
    attributes: ['order_status', [sequelize.fn('COUNT', sequelize.col('order_id')), 'count']],
    group: ['order_status'],
    raw: true,
  });
  const counted = Object.fromEntries(byStatus.map((r) => [r.order_status, Number(r.count)]));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [revenueRow, todayRow] = await Promise.all([
    Order.findOne({
      where: { ...scope, order_status: { [Op.in]: REVENUE_STATUSES } },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('order_id')), 'orders'],
      ],
      raw: true,
    }),
    Order.findOne({
      where: { ...scope, placed_at: { [Op.gte]: startOfToday } },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('order_id')), 'orders'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0), 'amount'],
      ],
      raw: true,
    }),
  ]);

  const revenue = Number(revenueRow?.revenue || 0);
  const paidOrders = Number(revenueRow?.orders || 0);

  return {
    counts: {
      total: Object.values(counted).reduce((s, n) => s + n, 0),
      pending: counted[ORDER_STATUS.PENDING] || 0,
      confirmed: counted[ORDER_STATUS.CONFIRMED] || 0,
      packing: counted[ORDER_STATUS.PACKING] || 0,
      shipping: counted[ORDER_STATUS.SHIPPING] || 0,
      delivered: counted[ORDER_STATUS.DELIVERED] || 0,
      completed: counted[ORDER_STATUS.COMPLETED] || 0,
      cancelled: counted[ORDER_STATUS.CANCELLED] || 0,
      returned: counted[ORDER_STATUS.RETURNED] || 0,
    },
    byStatus: Object.values(ORDER_STATUS).map((status) => ({
      status, label: STATUS_LABEL[status], count: counted[status] || 0,
    })),
    revenue,
    paidOrders,
    averageOrderValue: paidOrders ? Math.round(revenue / paidOrders) : 0,
    today: {
      orders: Number(todayRow?.orders || 0),
      amount: Number(todayRow?.amount || 0),
    },
    needsAction: (counted[ORDER_STATUS.PENDING] || 0) + (counted[ORDER_STATUS.CONFIRMED] || 0),
  };
}

module.exports = {
  resolveShopId, listOrders, getOrderDetail, updateStatus, bulkUpdateStatus, dashboardStats,
};
