'use strict';
/**
 * HTTMDTTHA-69 — Kiểm thử API cập nhật trạng thái đơn hàng cho người bán.
 *
 * Trọng tâm là hai thứ dễ sai nhất: bước chuyển trạng thái có được kiểm soát
 * đúng không, và tồn kho có biến động đúng theo từng bước không.
 */
const test = require('node:test');
const assert = require('node:assert');
const h = require('./helpers');

const { ORDER_STATUS: S } = h;
let seller;   // techzone — chủ gian hàng 1
let other;    // stylehouse — chủ gian hàng 2
let admin;
let member;

test.before(async () => {
  await h.startServer();
  seller = await h.login('techzone');
  other = await h.login('stylehouse');
  admin = await h.login('admin');
  member = await h.login('nguyenvanan');
});

test.after(async () => { await h.stopServer(); });

const setStatus = (orderId, toStatus, extra = {}, token = seller.accessToken) =>
  h.call('PATCH', `/seller/orders/${orderId}/status`, { token, body: { toStatus, ...extra } });

/* ================= Phạm vi dữ liệu ================= */

test('Người bán chỉ thấy đơn của gian hàng mình', async () => {
  const res = await h.call('GET', '/seller/orders?limit=50', { token: seller.accessToken });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.items.every((o) => o.shop.shopId === 1));
});

test('Người bán không thao tác được lên đơn của gian hàng khác', async () => {
  const created = await h.createTestOrder({ shopId: 1 });
  const res = await setStatus(created.orderId, S.CONFIRMED, {}, other.accessToken);
  assert.strictEqual(res.status, 404, 'đơn ngoài phạm vi phải coi như không tồn tại');
});

test('Người bán không mượn được shopId của gian hàng khác', async () => {
  const res = await h.call('GET', '/seller/orders?shopId=2', { token: seller.accessToken });
  assert.strictEqual(res.status, 403);
});

test('Khách hàng thường không vào được nhóm endpoint của người bán', async () => {
  const res = await h.call('GET', '/seller/orders', { token: member.accessToken });
  assert.strictEqual(res.status, 403);
});

/* ================= Máy trạng thái ================= */

test('Chuỗi chuyển trạng thái hợp lệ chạy trọn vẹn từ Chờ xác nhận tới Đã giao', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });

  for (const next of [S.CONFIRMED, S.PACKING, S.SHIPPING, S.DELIVERED]) {
    const res = await setStatus(created.orderId, next);
    assert.strictEqual(res.status, 200, `chuyển sang ${next} phải thành công`);
    assert.strictEqual(res.body.data.toStatus, next);
  }
  const state = await h.statusOf(created.orderId);
  assert.strictEqual(state.status, S.DELIVERED);
});

test('Không cho nhảy cóc trạng thái', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  const res = await setStatus(created.orderId, S.DELIVERED);
  assert.strictEqual(res.status, 400);
  assert.deepStrictEqual(res.body.error.details.allowed, [S.CONFIRMED, S.CANCELLED]);
});

test('Không chuyển tiếp được từ trạng thái kết thúc', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  assert.strictEqual((await setStatus(created.orderId, S.CANCELLED, { reason: 'Hết hàng' })).status, 200);

  const res = await setStatus(created.orderId, S.CONFIRMED);
  assert.strictEqual(res.status, 409);
  assert.match(res.body.error.message, /kết thúc/);
});

test('Chuyển sang đúng trạng thái đang có bị từ chối', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.CONFIRMED });
  const res = await setStatus(created.orderId, S.CONFIRMED);
  assert.strictEqual(res.status, 409);
});

test('Người bán không được tự đánh dấu đơn Hoàn thành thay khách', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.DELIVERED, paid: true });
  const res = await setStatus(created.orderId, S.COMPLETED);
  assert.strictEqual(res.status, 400, 'COMPLETED không nằm trong danh sách người bán được phép');
});

test('Hủy đơn bắt buộc nêu lý do', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  const res = await setStatus(created.orderId, S.CANCELLED);
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error.details.some((d) => d.field === 'reason'));
});

test('Trạng thái đích không hợp lệ bị chặn ngay ở validator', async () => {
  const created = await h.createTestOrder({ shopId: 1 });
  const res = await setStatus(created.orderId, 'KHONG_TON_TAI');
  assert.strictEqual(res.status, 400);
});

/* ================= Tác động tồn kho ================= */

test('Chuyển sang Đang giao thì trừ cả tồn thực lẫn phần giữ chỗ', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PACKING, quantity: 4 });
  const before = await h.stockOf(created.variantId);

  const res = await setStatus(created.orderId, S.SHIPPING);
  assert.strictEqual(res.status, 200);

  const after = await h.stockOf(created.variantId);
  assert.strictEqual(after.onHand, before.onHand - created.quantity, 'tồn thực phải giảm');
  assert.strictEqual(after.reserved, before.reserved - created.quantity, 'giữ chỗ phải giảm');
  assert.strictEqual(after.available, before.available, 'số khả dụng không đổi vì hàng đã bán');
});

test('Hủy đơn chưa xuất kho chỉ nhả giữ chỗ, không đụng tồn thực', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.CONFIRMED, quantity: 3 });
  const before = await h.stockOf(created.variantId);

  assert.strictEqual((await setStatus(created.orderId, S.CANCELLED, { reason: 'Hết hàng' })).status, 200);

  const after = await h.stockOf(created.variantId);
  assert.strictEqual(after.onHand, before.onHand);
  assert.strictEqual(after.reserved, before.reserved - created.quantity);
  assert.strictEqual(after.available, before.available + created.quantity);
});

test('Trả hàng sau khi đã giao thì nhập lại kho', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PACKING, quantity: 2 });
  await setStatus(created.orderId, S.SHIPPING);
  const afterShip = await h.stockOf(created.variantId);

  const res = await setStatus(created.orderId, S.RETURNED, { reason: 'Hàng lỗi' });
  assert.strictEqual(res.status, 200);

  const afterReturn = await h.stockOf(created.variantId);
  assert.strictEqual(afterReturn.onHand, afterShip.onHand + created.quantity,
    'hàng trả phải được nhập lại kho');
});

test('Vận đơn được tạo tự động khi đơn rời kho', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PACKING });
  await setStatus(created.orderId, S.SHIPPING);

  const res = await h.call('GET', `/seller/orders/${created.orderId}`, { token: seller.accessToken });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.shipment, 'phải có vận đơn');
  assert.ok(res.body.data.shipment.trackingCode, 'phải có mã vận đơn');
  assert.ok(res.body.data.shipment.trackingLogs.length >= 1, 'phải có hành trình vận đơn');
});

test('Đơn thanh toán khi nhận hàng được ghi nhận đã thu tiền lúc giao thành công', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.SHIPPING, paid: false });
  const beforeState = await h.statusOf(created.orderId);
  assert.strictEqual(beforeState.paymentStatus, 'UNPAID');

  assert.strictEqual((await setStatus(created.orderId, S.DELIVERED)).status, 200);

  const afterState = await h.statusOf(created.orderId);
  assert.strictEqual(afterState.paymentStatus, 'PAID', 'giao xong thì COD phải chuyển sang đã thu tiền');
});

test('Lịch sử trạng thái ghi lại đủ mọi bước chuyển', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  await setStatus(created.orderId, S.CONFIRMED, { note: 'Đã gọi xác nhận với khách' });
  await setStatus(created.orderId, S.PACKING);

  const res = await h.call('GET', `/seller/orders/${created.orderId}`, { token: seller.accessToken });
  const history = res.body.data.statusHistory;
  assert.ok(history.length >= 3);
  assert.ok(history.some((x) => x.toStatus === S.CONFIRMED && x.note === 'Đã gọi xác nhận với khách'));
  assert.ok(history.every((x) => x.toStatusLabel && x.changedAt));
});

/* ================= Hàng loạt và thống kê ================= */

test('Cập nhật hàng loạt báo rõ đơn nào thành công, đơn nào không', async () => {
  const a = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  const b = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  const c = await h.createTestOrder({ shopId: 1, status: S.SHIPPING });   // không thể sang CONFIRMED

  const res = await h.call('PATCH', '/seller/orders/bulk-status', {
    token: seller.accessToken,
    body: { orderIds: [a.orderId, b.orderId, c.orderId], toStatus: S.CONFIRMED },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.successCount, 2);
  assert.strictEqual(res.body.data.failureCount, 1);
  assert.strictEqual(res.body.data.failed[0].orderId, c.orderId);
});

test('Thống kê gian hàng trả đủ số đếm theo trạng thái và doanh thu', async () => {
  const res = await h.call('GET', '/seller/orders/stats', { token: seller.accessToken });
  assert.strictEqual(res.status, 200);
  const d = res.body.data;
  assert.strictEqual(d.byStatus.length, 8);
  assert.ok(typeof d.revenue === 'number' && d.revenue >= 0);
  assert.strictEqual(d.needsAction, d.counts.pending + d.counts.confirmed);
  const sum = d.byStatus.reduce((s, x) => s + x.count, 0);
  assert.strictEqual(sum, d.counts.total);
});

test('Danh sách đơn kèm sẵn các trạng thái kế tiếp hợp lệ cho người bán', async () => {
  const created = await h.createTestOrder({ shopId: 1, status: S.PENDING });
  const res = await h.call('GET', `/seller/orders?search=${created.orderCode}`, { token: seller.accessToken });
  const item = res.body.data.items[0];
  assert.deepStrictEqual(item.nextStatuses.map((s) => s.value), [S.CONFIRMED, S.CANCELLED]);
});

test('Quản trị viên xem được đơn của gian hàng bất kỳ', async () => {
  const res = await h.call('GET', '/seller/orders?shopId=2&limit=5', { token: admin.accessToken });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.items.every((o) => o.shop.shopId === 2));
});
