'use strict';
const {
  Op, OrderItem, OrderStatusHistory, Payment, Shipment, ShipmentTrackingLog,
  Carrier, Shop, User, ProductVariant, Product, ProductImage,
} = require('../../database/models');

/**
 * Các mảnh include dùng lại giữa luồng khách hàng và luồng người bán.
 * Gom về một chỗ để hai bên luôn trả về cùng một hình dạng dữ liệu.
 */

/** Sản phẩm kèm ảnh đại diện — dùng cho cả danh sách lẫn chi tiết. */
const variantInclude = {
  model: ProductVariant, as: 'variant', required: false,
  attributes: ['variant_id', 'variant_name', 'image_url', 'sku_code'],
  include: [{
    model: Product, as: 'product', required: false,
    attributes: ['product_id', 'product_name', 'slug'],
    include: [{
      model: ProductImage, as: 'images', required: false,
      attributes: ['image_url'],
      where: { is_primary: true },
    }],
  }],
};

const itemsInclude = (full = true) => ({
  model: OrderItem, as: 'items',
  ...(full ? { include: [variantInclude] } : {}),
});

const shopInclude = {
  model: Shop, as: 'shop', required: false,
  attributes: ['shop_id', 'shop_name', 'logo_url', 'slug'],
};

const customerInclude = {
  model: User, as: 'customer', required: false,
  attributes: ['user_id', 'full_name', 'email', 'phone'],
};

/** Include đầy đủ cho màn hình chi tiết đơn. */
const detailIncludes = () => [
  itemsInclude(true),
  shopInclude,
  customerInclude,
  {
    model: OrderStatusHistory, as: 'statusHistory', required: false,
    include: [{ model: User, as: 'changedBy', required: false, attributes: ['user_id', 'full_name'] }],
  },
  { model: Payment, as: 'payments', required: false },
  {
    model: Shipment, as: 'shipments', required: false,
    include: [
      { model: Carrier, as: 'carrier', required: false },
      { model: ShipmentTrackingLog, as: 'trackingLogs', required: false },
    ],
  },
];

/** Include gọn cho danh sách — chỉ lấy dòng hàng để dựng ảnh xem trước. */
const listIncludes = () => [itemsInclude(true), shopInclude, customerInclude];

/**
 * Dựng mệnh đề WHERE từ bộ lọc của giao diện.
 * Dùng chung cho danh sách của khách và của người bán.
 */
function buildWhere({ scope, status, search, from, to, paymentStatus }) {
  const where = { ...scope };

  if (status) {
    where.order_status = Array.isArray(status) ? { [Op.in]: status } : status;
  }
  if (paymentStatus) {
    where.payment_status = paymentStatus;
  }
  if (from || to) {
    where.placed_at = {};
    if (from) where.placed_at[Op.gte] = from;
    if (to) where.placed_at[Op.lte] = to;
  }
  if (search) {
    const like = { [Op.like]: `%${search.trim()}%` };
    where[Op.or] = [
      { order_code: like },
      { receiver_name: like },
      { receiver_phone: like },
    ];
  }
  return where;
}

/** Các cột cho phép sắp xếp — danh sách trắng để chặn SQL injection qua query string. */
const SORTABLE = Object.freeze({
  placed_at: 'placed_at',
  total_amount: 'total_amount',
  order_code: 'order_code',
  order_status: 'order_status',
});

function buildOrder(sortBy, sortDir) {
  const column = SORTABLE[sortBy] || 'placed_at';
  const direction = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return [[column, direction], ['order_id', direction]];
}

module.exports = {
  variantInclude, itemsInclude, shopInclude, customerInclude,
  detailIncludes, listIncludes, buildWhere, buildOrder, SORTABLE,
};
