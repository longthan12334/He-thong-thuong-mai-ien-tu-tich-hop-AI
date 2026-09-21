'use strict';
/**
 * HTTMDTTHA-68 — Kiểm thử API lịch sử đơn hàng cho khách hàng.
 */
const test = require('node:test');
const assert = require('node:assert');
const h = require('./helpers');

const { ORDER_STATUS } = h;
let member;      // nguyenvanan — user_id = 5
let other;       // tranthib   — user_id = 6

test.before(async () => {
  await h.startServer();
  member = await h.login('nguyenvanan');
  other = await h.login('tranthib');
});

test.after(async () => { await h.stopServer(); });

test('Danh sách đơn chỉ trả về đơn của chính người đang đăng nhập', async () => {
  const res = await h.call('GET', '/orders?limit=50', { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data.items));
  assert.ok(res.body.data.pagination.total >= 1);

  const otherRes = await h.call('GET', '/orders?limit=50', { token: other.accessToken });
  const mine = new Set(res.body.data.items.map((o) => o.orderId));
  const theirs = otherRes.body.data.items.map((o) => o.orderId);
  assert.ok(theirs.every((id) => !mine.has(id)), 'hai khách không được thấy đơn của nhau');
});

test('Phân trang trả về đúng siêu dữ liệu', async () => {
  const res = await h.call('GET', '/orders?page=1&limit=1', { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  const { pagination, items } = res.body.data;
  assert.strictEqual(items.length <= 1, true);
  assert.strictEqual(pagination.page, 1);
  assert.strictEqual(pagination.limit, 1);
  assert.strictEqual(pagination.hasPrev, false);
  assert.strictEqual(pagination.totalPages, Math.ceil(pagination.total / 1));
});

test('Lọc theo trạng thái trả đúng tập con', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.PENDING });
  const res = await h.call('GET', `/orders?status=${ORDER_STATUS.PENDING}&limit=50`,
    { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.items.every((o) => o.status === ORDER_STATUS.PENDING));
  assert.ok(res.body.data.items.some((o) => o.orderId === created.orderId));
});

test('Tìm kiếm theo mã đơn hoạt động', async () => {
  const created = await h.createTestOrder({ userId: 5 });
  const res = await h.call('GET', `/orders?search=${created.orderCode}`, { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.items.length, 1);
  assert.strictEqual(res.body.data.items[0].orderCode, created.orderCode);
});

test('Tham số lọc sai bị chặn ở tầng kiểm tra dữ liệu', async () => {
  const res = await h.call('GET', '/orders?status=KHONG_TON_TAI', { token: member.accessToken });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'BAD_REQUEST');

  const res2 = await h.call('GET', '/orders?limit=9999', { token: member.accessToken });
  assert.strictEqual(res2.status, 400);
});

test('Bảng tổng hợp trả đủ 8 trạng thái và số tiền đã chi', async () => {
  const res = await h.call('GET', '/orders/summary', { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.byStatus.length, 8);
  assert.ok(res.body.data.byStatus.every((s) => typeof s.label === 'string' && s.label.length > 0));
  assert.ok(typeof res.body.data.spending.totalSpent === 'number');
  const sum = res.body.data.byStatus.reduce((s, x) => s + x.count, 0);
  assert.strictEqual(sum, res.body.data.total);
});

test('Chi tiết đơn trả đủ dòng hàng, lịch sử trạng thái, thanh toán', async () => {
  const created = await h.createTestOrder({ userId: 5 });
  const res = await h.call('GET', `/orders/${created.orderId}`, { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  const d = res.body.data;
  assert.strictEqual(d.orderCode, created.orderCode);
  assert.strictEqual(d.items.length, 1);
  assert.strictEqual(d.items[0].quantity, created.quantity);
  assert.ok(d.statusHistory.length >= 1);
  assert.ok(d.payments.length >= 1);
  assert.ok(d.receiver.name && d.receiver.address);
});

test('Không xem được đơn của người khác, và trả 404 thay vì 403 để không lộ sự tồn tại', async () => {
  const created = await h.createTestOrder({ userId: 5 });
  const res = await h.call('GET', `/orders/${created.orderId}`, { token: other.accessToken });
  assert.strictEqual(res.status, 404);
});

test('Khách hủy được đơn đang chờ xác nhận, và hàng giữ chỗ được nhả ra', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.PENDING, quantity: 3 });
  const before = await h.stockOf(created.variantId);

  const res = await h.call('POST', `/orders/${created.orderId}/cancel`,
    { token: member.accessToken, body: { reason: 'Đặt nhầm mẫu' } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.toStatus, ORDER_STATUS.CANCELLED);

  const after = await h.stockOf(created.variantId);
  assert.strictEqual(after.reserved, before.reserved - created.quantity,
    'phần giữ chỗ phải được nhả ra');
  assert.strictEqual(after.onHand, before.onHand,
    'tồn thực không đổi vì hàng chưa bao giờ rời kho');
});

test('Không hủy được đơn đã rời kho', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.SHIPPING });
  const res = await h.call('POST', `/orders/${created.orderId}/cancel`,
    { token: member.accessToken, body: { reason: 'Đổi ý' } });
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.error.code, 'CONFLICT');
  assert.ok(res.body.error.details.cancellableFrom.includes(ORDER_STATUS.PENDING));
});

test('Khách xác nhận đã nhận hàng thì đơn chuyển sang Hoàn thành', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.DELIVERED, paid: true });
  const res = await h.call('POST', `/orders/${created.orderId}/confirm-received`,
    { token: member.accessToken });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.toStatus, ORDER_STATUS.COMPLETED);

  const state = await h.statusOf(created.orderId);
  assert.strictEqual(state.status, ORDER_STATUS.COMPLETED);
});

test('Không xác nhận nhận hàng được khi đơn chưa giao', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.PENDING });
  const res = await h.call('POST', `/orders/${created.orderId}/confirm-received`,
    { token: member.accessToken });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error.details.allowed.includes(ORDER_STATUS.CONFIRMED));
});

test('Không hủy được đơn hai lần', async () => {
  const created = await h.createTestOrder({ userId: 5, status: ORDER_STATUS.PENDING });
  const first = await h.call('POST', `/orders/${created.orderId}/cancel`,
    { token: member.accessToken, body: { reason: 'Lý do' } });
  assert.strictEqual(first.status, 200);
  const second = await h.call('POST', `/orders/${created.orderId}/cancel`,
    { token: member.accessToken, body: { reason: 'Lý do' } });
  assert.strictEqual(second.status, 409);
});

test('Mọi endpoint đều đòi đăng nhập', async () => {
  for (const [method, path] of [['GET', '/orders'], ['GET', '/orders/summary'],
    ['GET', '/orders/1'], ['POST', '/orders/1/cancel']]) {
    const res = await h.call(method, path);
    assert.strictEqual(res.status, 401, `${method} ${path} phải trả 401 khi thiếu token`);
  }
});
