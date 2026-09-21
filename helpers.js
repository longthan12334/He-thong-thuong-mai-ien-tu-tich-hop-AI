'use strict';
/**
 * Tiện ích dùng chung cho các tệp kiểm thử.
 *
 * Mỗi ca kiểm thử tự dựng đơn hàng riêng thay vì mượn đơn trong seed data,
 * nhờ vậy chạy lại bao nhiêu lần cũng cho kết quả giống nhau và các ca
 * không giẫm lên dữ liệu của nhau.
 */
const app = require('../src/app');
const {
  sequelize, Order, OrderItem, OrderStatusHistory, Payment,
  Inventory, ProductVariant, Warehouse,
} = require('../src/database/models');
const {
  ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TXN_STATUS, PAYMENT_METHOD,
} = require('../src/shared/constants/enums');

const PASSWORD = 'Password@123';

let server;
let baseUrl;

async function startServer() {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
  return baseUrl;
}

async function stopServer() {
  if (server) server.close();
  await sequelize.close();
}

async function call(method, path, { body, token, raw } = {}) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const payload = raw || !contentType.includes('json') ? await res.text() : await res.json();
  return { status: res.status, body: payload };
}

/** Đăng nhập và trả về phần data (accessToken, user...). */
async function login(identifier, password = PASSWORD) {
  const res = await call('POST', '/auth/login', { body: { identifier, password } });
  if (res.status !== 200) {
    throw new Error(`Đăng nhập ${identifier} thất bại: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

let orderSeq = 0;

/**
 * Tạo một đơn hàng mới phục vụ kiểm thử, kèm giữ chỗ tồn kho đúng như
 * luồng đặt hàng thật, để các ca kiểm tra tác động kho có số liệu đối chiếu.
 *
 * @returns {{orderId, orderCode, variantId, quantity, before: {onHand, reserved}}}
 */
async function createTestOrder({
  userId = 5,
  shopId = 1,
  status = ORDER_STATUS.PENDING,
  quantity = 2,
  paymentMethod = PAYMENT_METHOD.COD,
  paid = false,
} = {}) {
  orderSeq += 1;
  const code = `TEST${Date.now().toString().slice(-8)}${String(orderSeq).padStart(3, '0')}`;

  // Chọn một biến thể của gian hàng còn đủ hàng khả dụng
  const [variantRow] = await sequelize.query(`
    SELECT v.variant_id, v.sku_code, v.price, p.product_name, i.inventory_id
    FROM product_variants v
    JOIN products p    ON p.product_id = v.product_id
    JOIN inventories i ON i.variant_id = v.variant_id
    JOIN warehouses w  ON w.warehouse_id = i.warehouse_id
    WHERE p.shop_id = :shopId AND (i.qty_on_hand - i.qty_reserved) >= :quantity
    ORDER BY (i.qty_on_hand - i.qty_reserved) DESC
    LIMIT 1
  `, { replacements: { shopId, quantity }, type: sequelize.QueryTypes.SELECT });

  if (!variantRow) throw new Error(`Không tìm thấy biến thể đủ hàng cho gian hàng ${shopId}`);

  const unitPrice = Number(variantRow.price);
  const subtotal = unitPrice * quantity;

  const order = await Order.create({
    order_code: code,
    user_id: userId,
    shop_id: shopId,
    order_status: status,
    payment_status: paid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID,
    subtotal_amount: subtotal,
    discount_amount: 0,
    shipping_fee: 0,
    tax_amount: 0,
    total_amount: subtotal,
    receiver_name: 'Người Nhận Kiểm Thử',
    receiver_phone: '0900000000',
    shipping_address_text: 'Địa chỉ kiểm thử, Hà Nội',
    placed_at: new Date(),
  });

  await OrderItem.create({
    order_id: order.order_id,
    variant_id: variantRow.variant_id,
    product_name_snapshot: variantRow.product_name,
    sku_snapshot: variantRow.sku_code,
    unit_price: unitPrice,
    quantity,
    discount_amount: 0,
    line_total: subtotal,
  });

  await OrderStatusHistory.create({
    order_id: order.order_id,
    from_status: null,
    to_status: status,
    changed_by_user_id: userId,
    note: 'Tạo đơn phục vụ kiểm thử',
    changed_at: new Date(),
  });

  await Payment.create({
    order_id: order.order_id,
    payment_method: paymentMethod,
    provider_name: paymentMethod === PAYMENT_METHOD.COD ? 'Nội bộ' : paymentMethod,
    transaction_code: `TXN${code}`,
    amount: subtotal,
    currency: 'VND',
    payment_status: paid ? PAYMENT_TXN_STATUS.SUCCESS : PAYMENT_TXN_STATUS.INITIATED,
    paid_at: paid ? new Date() : null,
  });

  // Giữ chỗ tồn kho giống luồng đặt hàng thật
  const inventory = await Inventory.findByPk(variantRow.inventory_id);
  inventory.qty_reserved += quantity;
  await inventory.save();

  return {
    orderId: Number(order.order_id),
    orderCode: code,
    variantId: Number(variantRow.variant_id),
    inventoryId: Number(variantRow.inventory_id),
    quantity,
    unitPrice,
    total: subtotal,
  };
}

/** Tổng tồn kho hiện tại của một biến thể, cộng trên mọi kho. */
async function stockOf(variantId) {
  const rows = await Inventory.findAll({
    where: { variant_id: variantId },
    attributes: ['qty_on_hand', 'qty_reserved'],
    raw: true,
  });
  return rows.reduce((acc, r) => ({
    onHand: acc.onHand + Number(r.qty_on_hand),
    reserved: acc.reserved + Number(r.qty_reserved),
    available: acc.available + Number(r.qty_on_hand) - Number(r.qty_reserved),
  }), { onHand: 0, reserved: 0, available: 0 });
}

/** Trạng thái hiện tại của một đơn, đọc thẳng từ cơ sở dữ liệu. */
async function statusOf(orderId) {
  const order = await Order.findByPk(orderId, { attributes: ['order_status', 'payment_status'] });
  return { status: order.order_status, paymentStatus: order.payment_status };
}

module.exports = {
  startServer, stopServer, call, login, baseUrl: () => baseUrl, createTestOrder, stockOf, statusOf,
  PASSWORD, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD,
};
