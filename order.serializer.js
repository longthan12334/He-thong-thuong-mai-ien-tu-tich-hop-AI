'use strict';
const { STATUS_LABEL, CUSTOMER_CANCELLABLE, nextStatuses } = require('./order.constants');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../shared/constants/enums');

/**
 * Chuyển bản ghi Sequelize thành cấu trúc JSON ổn định cho giao diện.
 *
 * Tầng này tồn tại để giao diện không phải biết tên cột trong cơ sở dữ liệu,
 * và để đổi tên cột về sau không làm vỡ frontend.
 */

const money = (v) => Number(v ?? 0);

function serializeItem(item) {
  const variant = item.variant;
  const product = variant?.product;
  const primaryImage = product?.images?.[0]?.image_url || variant?.image_url || null;
  return {
    orderItemId: Number(item.order_item_id),
    variantId: Number(item.variant_id),
    productId: product ? Number(product.product_id) : null,
    productName: item.product_name_snapshot,
    variantName: variant?.variant_name || null,
    sku: item.sku_snapshot,
    imageUrl: primaryImage,
    unitPrice: money(item.unit_price),
    quantity: item.quantity,
    discountAmount: money(item.discount_amount),
    lineTotal: money(item.line_total),
    reviewStatus: item.review_status,
  };
}

/** Bản rút gọn dùng cho danh sách — chỉ đủ dữ liệu để vẽ một thẻ đơn hàng. */
function serializeSummary(order) {
  const items = order.items || [];
  const first = items[0];
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  return {
    orderId: Number(order.order_id),
    orderCode: order.order_code,
    status: order.order_status,
    statusLabel: STATUS_LABEL[order.order_status] || order.order_status,
    paymentStatus: order.payment_status,
    totalAmount: money(order.total_amount),
    itemCount: items.length,
    totalQuantity,
    placedAt: order.placed_at,
    completedAt: order.completed_at,
    shop: order.shop ? {
      shopId: Number(order.shop.shop_id),
      shopName: order.shop.shop_name,
      logoUrl: order.shop.logo_url,
    } : null,
    customer: order.customer ? {
      userId: Number(order.customer.user_id),
      fullName: order.customer.full_name,
      email: order.customer.email,
      phone: order.customer.phone,
    } : null,
    preview: first ? {
      productName: first.product_name_snapshot,
      imageUrl: serializeItem(first).imageUrl,
      moreCount: Math.max(0, items.length - 1),
    } : null,
    canCancel: CUSTOMER_CANCELLABLE.includes(order.order_status),
    canConfirmReceived: order.order_status === ORDER_STATUS.DELIVERED,
  };
}

/** Bản đầy đủ dùng cho màn hình chi tiết đơn. */
function serializeDetail(order) {
  const base = serializeSummary(order);
  const shipment = (order.shipments || [])[0];

  return {
    ...base,
    subtotalAmount: money(order.subtotal_amount),
    discountAmount: money(order.discount_amount),
    shippingFee: money(order.shipping_fee),
    taxAmount: money(order.tax_amount),
    receiver: {
      name: order.receiver_name,
      phone: order.receiver_phone,
      address: order.shipping_address_text,
    },
    customerNote: order.customer_note,
    cancelReason: order.cancel_reason,
    items: (order.items || []).map(serializeItem),
    statusHistory: (order.statusHistory || []).map((h) => ({
      historyId: Number(h.history_id),
      fromStatus: h.from_status,
      toStatus: h.to_status,
      toStatusLabel: STATUS_LABEL[h.to_status] || h.to_status,
      note: h.note,
      changedAt: h.changed_at,
      changedBy: h.changedBy ? h.changedBy.full_name : null,
    })),
    payments: (order.payments || []).map((p) => ({
      paymentId: Number(p.payment_id),
      method: p.payment_method,
      provider: p.provider_name,
      transactionCode: p.transaction_code,
      amount: money(p.amount),
      status: p.payment_status,
      paidAt: p.paid_at,
    })),
    shipment: shipment ? {
      shipmentId: Number(shipment.shipment_id),
      carrier: shipment.carrier ? shipment.carrier.carrier_name : null,
      carrierCode: shipment.carrier ? shipment.carrier.carrier_code : null,
      trackingCode: shipment.tracking_code,
      status: shipment.shipment_status,
      shippingFee: money(shipment.shipping_fee),
      estimatedDeliveryDate: shipment.estimated_delivery_date,
      deliveredAt: shipment.delivered_at,
      trackingLogs: (shipment.trackingLogs || []).map((l) => ({
        status: l.status,
        location: l.location,
        description: l.description,
        eventTime: l.event_time,
      })),
    } : null,
    nextStatuses: nextStatuses(order.order_status).map((s) => ({
      value: s, label: STATUS_LABEL[s] || s,
    })),
    isPaid: order.payment_status === PAYMENT_STATUS.PAID,
  };
}

module.exports = { serializeSummary, serializeDetail, serializeItem };
