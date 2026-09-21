'use strict';
const {
  sequelize, Order, OrderItem, OrderStatusHistory, Payment, Shipment,
  ShipmentTrackingLog, Carrier, Product, ProductVariant,
} = require('../../database/models');
const ApiError = require('../../shared/errors/ApiError');
const inventoryService = require('./inventory.service');
const {
  ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TXN_STATUS, PAYMENT_METHOD, SHIPMENT_STATUS,
} = require('../../shared/constants/enums');
const {
  canTransition, isTerminal, nextStatuses, STATUS_LABEL, STATUS_NOTE,
  RESERVED_STATUSES, SHIPPED_STATUSES,
} = require('./order.constants');

const S = ORDER_STATUS;

/**
 * Động cơ chuyển trạng thái đơn hàng — dùng chung cho cả người bán và khách hàng.
 *
 * Toàn bộ tác động phụ (tồn kho, thanh toán, vận đơn, số lượng đã bán) chạy trong
 * cùng MỘT giao dịch với việc đổi trạng thái. Nếu bất kỳ bước nào lỗi thì mọi thứ
 * quay lui, không bao giờ để lại đơn đã chuyển trạng thái mà kho chưa trừ.
 */

/** Sinh mã vận đơn giả lập cho môi trường phát triển. */
function generateTrackingCode(orderId) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `VN${stamp}${String(orderId).padStart(6, '0')}`;
}

/** Ghi một mốc vào lịch sử trạng thái. */
function recordHistory(order, from, to, actorId, note, transaction) {
  return OrderStatusHistory.create({
    order_id: order.order_id,
    from_status: from,
    to_status: to,
    changed_by_user_id: actorId || null,
    note: note || STATUS_NOTE[to] || null,
    changed_at: new Date(),
  }, { transaction });
}

/** Danh sách dòng hàng rút gọn phục vụ thao tác kho. */
async function loadItems(orderId, transaction) {
  const rows = await OrderItem.findAll({
    where: { order_id: orderId },
    attributes: ['order_item_id', 'variant_id', 'quantity'],
    transaction,
  });
  return rows.map((r) => ({ variant_id: r.variant_id, quantity: r.quantity }));
}

/** Cộng hoặc trừ số lượng đã bán của sản phẩm tương ứng với các dòng hàng. */
async function adjustSoldCount(items, sign, transaction) {
  for (const item of items) {
    const variant = await ProductVariant.findByPk(item.variant_id, {
      attributes: ['variant_id', 'product_id'], transaction,
    });
    if (!variant) continue;
    await Product.increment(
      { sold_count: sign * item.quantity },
      { where: { product_id: variant.product_id }, transaction },
    );
  }
}

/** Tạo vận đơn nếu đơn chưa có, hoặc cập nhật vận đơn sẵn có. */
async function upsertShipment(order, status, transaction, extra = {}) {
  let shipment = await Shipment.findOne({ where: { order_id: order.order_id }, transaction });

  if (!shipment) {
    const carrier = await Carrier.findOne({ where: { is_active: true }, order: [['carrier_id', 'ASC']], transaction });
    if (!carrier) return null;
    shipment = await Shipment.create({
      order_id: order.order_id,
      carrier_id: carrier.carrier_id,
      tracking_code: generateTrackingCode(order.order_id),
      shipment_status: status,
      shipping_fee: order.shipping_fee || 0,
      estimated_delivery_date: extra.estimatedDeliveryDate || null,
    }, { transaction });
  } else {
    shipment.shipment_status = status;
    if (extra.deliveredAt) shipment.delivered_at = extra.deliveredAt;
    await shipment.save({ transaction });
  }

  await ShipmentTrackingLog.create({
    shipment_id: shipment.shipment_id,
    status,
    location: extra.location || null,
    description: extra.description || null,
    event_time: new Date(),
  }, { transaction });

  return shipment;
}

/** Đơn thanh toán khi nhận hàng: ghi nhận đã thu tiền lúc giao thành công. */
async function settleCodPayment(order, transaction) {
  const payment = await Payment.findOne({
    where: { order_id: order.order_id, payment_method: PAYMENT_METHOD.COD },
    transaction,
  });
  if (!payment || payment.payment_status === PAYMENT_TXN_STATUS.SUCCESS) return;
  payment.payment_status = PAYMENT_TXN_STATUS.SUCCESS;
  payment.paid_at = new Date();
  await payment.save({ transaction });
  order.payment_status = PAYMENT_STATUS.PAID;
}

/** Hủy các giao dịch thanh toán chưa hoàn tất khi đơn bị hủy. */
async function voidPendingPayments(order, transaction) {
  await Payment.update(
    { payment_status: PAYMENT_TXN_STATUS.CANCELLED },
    {
      where: { order_id: order.order_id, payment_status: PAYMENT_TXN_STATUS.INITIATED },
      transaction,
    },
  );
}

/**
 * Bảng tác động phụ theo trạng thái đích.
 * Mỗi hàm nhận (order, items, actorId, transaction, options).
 */
const SIDE_EFFECTS = {
  async [S.CONFIRMED](order, _items, _actorId, transaction) {
    // Hàng vẫn đang giữ chỗ, chỉ đổi trạng thái.
    await upsertShipment(order, SHIPMENT_STATUS.CREATED, transaction, {
      location: 'Kho người bán',
      description: 'Người bán đã xác nhận đơn, chuẩn bị hàng',
    });
  },

  async [S.PACKING](order, _items, _actorId, transaction) {
    await upsertShipment(order, SHIPMENT_STATUS.CREATED, transaction, {
      location: 'Kho người bán',
      description: 'Đang đóng gói',
    });
  },

  async [S.SHIPPING](order, items, actorId, transaction) {
    // Hàng rời kho thật: trừ đồng thời tồn thực và phần giữ chỗ.
    await inventoryService.issue(items, order.shop_id, order.order_id, actorId, transaction);
    const eta = new Date();
    eta.setDate(eta.getDate() + 3);
    await upsertShipment(order, SHIPMENT_STATUS.IN_TRANSIT, transaction, {
      location: 'Bưu cục gửi',
      description: 'Đơn vị vận chuyển đã lấy hàng',
      estimatedDeliveryDate: eta.toISOString().slice(0, 10),
    });
  },

  async [S.DELIVERED](order, items, _actorId, transaction) {
    await upsertShipment(order, SHIPMENT_STATUS.DELIVERED, transaction, {
      location: 'Địa chỉ người nhận',
      description: 'Giao hàng thành công',
      deliveredAt: new Date(),
    });
    await settleCodPayment(order, transaction);
    await adjustSoldCount(items, 1, transaction);
  },

  async [S.COMPLETED](order, _items, _actorId, transaction) {
    order.completed_at = new Date();
    await OrderStatusHistory.findOne({ where: { order_id: order.order_id }, transaction });
  },

  async [S.CANCELLED](order, items, actorId, transaction, options) {
    // Chỉ nhả giữ chỗ khi hàng chưa từng rời kho.
    if (RESERVED_STATUSES.includes(options.fromStatus)) {
      await inventoryService.release(items, order.shop_id, order.order_id, actorId, transaction);
    }
    await voidPendingPayments(order, transaction);
    order.cancel_reason = options.reason || 'Không nêu lý do';
    const shipment = await Shipment.findOne({ where: { order_id: order.order_id }, transaction });
    if (shipment) {
      await upsertShipment(order, SHIPMENT_STATUS.FAILED, transaction, {
        description: 'Đơn bị hủy trước khi giao',
      });
    }
  },

  async [S.RETURNED](order, items, actorId, transaction, options) {
    // Hàng đã rời kho thì nhập lại; nếu chưa thì chỉ nhả giữ chỗ.
    if (SHIPPED_STATUSES.includes(options.fromStatus)) {
      await inventoryService.restock(items, order.shop_id, order.order_id, actorId, transaction);
      if (options.fromStatus === S.DELIVERED) {
        await adjustSoldCount(items, -1, transaction);
      }
    } else {
      await inventoryService.release(items, order.shop_id, order.order_id, actorId, transaction);
    }
    await upsertShipment(order, SHIPMENT_STATUS.RETURNED, transaction, {
      description: 'Hàng được hoàn về kho người bán',
    });
    order.cancel_reason = options.reason || 'Khách trả hàng';
  },
};

/**
 * Chuyển một đơn hàng sang trạng thái mới.
 *
 * @param {number} orderId
 * @param {string} toStatus trạng thái đích
 * @param {object} actor { userId, allowedTargets?: string[] } — allowedTargets giới hạn
 *        theo vai trò, ví dụ khách hàng chỉ được CANCELLED và COMPLETED
 * @param {object} options { note, reason, scopeWhere }
 */
async function transition(orderId, toStatus, actor, options = {}) {
  return sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { order_id: orderId, ...(options.scopeWhere || {}) },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw ApiError.notFound('Không tìm thấy đơn hàng');

    const fromStatus = order.order_status;

    if (fromStatus === toStatus) {
      throw ApiError.conflict(`Đơn hàng đã ở trạng thái ${STATUS_LABEL[toStatus] || toStatus}`);
    }
    if (isTerminal(fromStatus)) {
      throw ApiError.conflict(
        `Đơn ở trạng thái ${STATUS_LABEL[fromStatus]} là trạng thái kết thúc, không thể chuyển tiếp`,
      );
    }
    if (!canTransition(fromStatus, toStatus)) {
      throw ApiError.badRequest(
        `Không thể chuyển từ ${STATUS_LABEL[fromStatus]} sang ${STATUS_LABEL[toStatus] || toStatus}`,
        { from: fromStatus, to: toStatus, allowed: nextStatuses(fromStatus) },
      );
    }
    if (actor.allowedTargets && !actor.allowedTargets.includes(toStatus)) {
      throw ApiError.forbidden(
        `Vai trò của bạn không được phép chuyển đơn sang trạng thái ${STATUS_LABEL[toStatus] || toStatus}`,
        { allowed: actor.allowedTargets },
      );
    }

    const items = await loadItems(order.order_id, t);

    const effect = SIDE_EFFECTS[toStatus];
    if (effect) {
      try {
        await effect(order, items, actor.userId, t, { ...options, fromStatus });
      } catch (err) {
        if (err.code === 'OUT_OF_STOCK') throw ApiError.conflict(err.message);
        throw err;
      }
    }

    order.order_status = toStatus;
    await order.save({ transaction: t });
    await recordHistory(order, fromStatus, toStatus, actor.userId, options.note, t);

    return { orderId: Number(order.order_id), fromStatus, toStatus,
      statusLabel: STATUS_LABEL[toStatus] || toStatus };
  });
}

module.exports = { transition, generateTrackingCode, loadItems };
