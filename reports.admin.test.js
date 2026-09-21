'use strict';
/**
 * HTTMDTTHA-70 — Kiểm thử API báo cáo và thống kê doanh thu.
 *
 * Ngoài việc endpoint chạy được, các ca ở đây còn đối chiếu số liệu báo cáo
 * với truy vấn tính tay trên cơ sở dữ liệu, để bắt lỗi logic gom nhóm.
 */
const test = require('node:test');
const assert = require('node:assert');
const h = require('./helpers');
const { sequelize } = require('../src/database/models');

let admin;
let seller;
let member;

const RANGE = 'from=2026-08-01&to=2026-08-31';

test.before(async () => {
  await h.startServer();
  admin = await h.login('admin');
  seller = await h.login('techzone');
  member = await h.login('nguyenvanan');
});

test.after(async () => { await h.stopServer(); });

const get = (path, token = admin.accessToken) => h.call('GET', path, { token });

/* ================= Phân quyền ================= */

test('Chỉ quản trị viên truy cập được nhóm báo cáo', async () => {
  assert.strictEqual((await get(`/admin/reports/overview?${RANGE}`)).status, 200);
  assert.strictEqual((await get(`/admin/reports/overview?${RANGE}`, seller.accessToken)).status, 403);
  assert.strictEqual((await get(`/admin/reports/overview?${RANGE}`, member.accessToken)).status, 403);
  assert.strictEqual((await h.call('GET', `/admin/reports/overview?${RANGE}`)).status, 401);
});

/* ================= Tổng quan ================= */

test('Tổng quan trả đủ 8 chỉ số kèm so sánh kỳ trước', async () => {
  const res = await get(`/admin/reports/overview?${RANGE}`);
  assert.strictEqual(res.status, 200);
  const d = res.body.data;
  assert.strictEqual(d.kpis.length, 8);
  for (const k of d.kpis) {
    assert.ok(k.label, 'mỗi chỉ số phải có nhãn tiếng Việt');
    assert.strictEqual(typeof k.value, 'number');
    assert.strictEqual(typeof k.growth, 'number');
    assert.ok(['currency', 'number', 'percent'].includes(k.format));
  }
  assert.ok(d.previousRange.from && d.previousRange.to);
});

test('Doanh thu trong báo cáo khớp với truy vấn tính tay trên CSDL', async () => {
  const res = await get(`/admin/reports/overview?${RANGE}`);
  const reported = res.body.data.current.revenue;

  const [row] = await sequelize.query(`
    SELECT COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    WHERE placed_at BETWEEN :from AND :to
      AND order_status IN ('DELIVERED', 'COMPLETED')
  `, {
    replacements: { from: '2026-08-01 00:00:00', to: '2026-08-31 23:59:59' },
    type: sequelize.QueryTypes.SELECT,
  });

  assert.strictEqual(reported, Number(row.revenue),
    'doanh thu báo cáo phải bằng tổng tính tay');
});

test('Chỉ đơn đã giao mới được tính vào doanh thu', async () => {
  const before = (await get(`/admin/reports/overview?${RANGE}`)).body.data.current.revenue;

  // Đơn mới ở trạng thái chờ xác nhận, không được làm phồng doanh thu
  await h.createTestOrder({ shopId: 1, status: h.ORDER_STATUS.PENDING });

  const after = (await get(`/admin/reports/overview?${RANGE}`)).body.data.current.revenue;
  assert.strictEqual(after, before, 'đơn đang chờ không được cộng vào doanh thu');
});

/* ================= Chuỗi thời gian ================= */

test('Chuỗi doanh thu theo ngày trả đủ mọi mốc, kể cả ngày không có đơn', async () => {
  const res = await get(`/admin/reports/revenue?${RANGE}&granularity=day`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.series.length, 31, 'tháng 8 có 31 ngày');
  assert.ok(res.body.data.series.every((p) => typeof p.revenue === 'number'));
  assert.ok(res.body.data.series.some((p) => p.revenue === 0), 'phải có ngày bằng 0');
});

test('Tổng của chuỗi khớp với tổng doanh thu tổng quan', async () => {
  const series = (await get(`/admin/reports/revenue?${RANGE}&granularity=day`)).body.data;
  const overview = (await get(`/admin/reports/overview?${RANGE}`)).body.data;
  assert.strictEqual(series.totals.revenue, overview.current.revenue);
});

test('Gom nhóm theo tháng và theo tuần đều hoạt động', async () => {
  for (const g of ['week', 'month']) {
    const res = await get(`/admin/reports/revenue?from=2026-06-01&to=2026-08-31&granularity=${g}`);
    assert.strictEqual(res.status, 200, `granularity=${g} phải chạy được`);
    assert.strictEqual(res.body.data.granularity, g);
    assert.ok(res.body.data.series.length > 0);
  }
});

test('Tham số granularity sai bị chặn', async () => {
  const res = await get(`/admin/reports/revenue?${RANGE}&granularity=quy`);
  assert.strictEqual(res.status, 400);
});

test('Khoảng thời gian đảo ngược bị từ chối', async () => {
  const res = await get('/admin/reports/overview?from=2026-08-31&to=2026-08-01');
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error.message, /trước hoặc bằng/);
});

/* ================= Phân bố và xếp hạng ================= */

test('Phân bố trạng thái trả đủ 8 trạng thái và tổng phần trăm bằng 100', async () => {
  const res = await get(`/admin/reports/orders-by-status?${RANGE}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.items.length, 8);
  const sumCount = res.body.data.items.reduce((s, x) => s + x.count, 0);
  assert.strictEqual(sumCount, res.body.data.total);
  const sumPct = res.body.data.items.reduce((s, x) => s + x.percentage, 0);
  assert.ok(Math.abs(sumPct - 100) < 0.5, `tổng phần trăm phải xấp xỉ 100, đang là ${sumPct}`);
});

test('Top sản phẩm sắp theo doanh thu giảm dần và tôn trọng limit', async () => {
  const res = await get(`/admin/reports/top-products?${RANGE}&limit=3`);
  assert.strictEqual(res.status, 200);
  const items = res.body.data.items;
  assert.ok(items.length <= 3);
  for (let i = 1; i < items.length; i += 1) {
    assert.ok(items[i - 1].revenue >= items[i].revenue, 'phải sắp giảm dần theo doanh thu');
    assert.strictEqual(items[i].rank, i + 1);
  }
  assert.ok(items.every((p) => p.productName && p.shopName));
});

test('Top gian hàng có tỉ trọng cộng lại xấp xỉ 100', async () => {
  const res = await get(`/admin/reports/top-shops?${RANGE}`);
  assert.strictEqual(res.status, 200);
  const sum = res.body.data.items.reduce((s, x) => s + x.share, 0);
  assert.ok(Math.abs(sum - 100) < 0.5 || res.body.data.items.length === 0);
});

test('Doanh thu theo danh mục quy đúng về danh mục gốc', async () => {
  const res = await get(`/admin/reports/revenue-by-category?${RANGE}`);
  assert.strictEqual(res.status, 200);
  const items = res.body.data.items;
  assert.ok(items.length > 0);
  // Các danh mục gốc trong seed đều là danh mục cấp 1, không phải danh mục lá
  assert.ok(items.every((c) => c.categoryName && typeof c.revenue === 'number'));
  const sum = items.reduce((s, x) => s + x.revenue, 0);
  assert.strictEqual(sum, res.body.data.total);
});

test('Phân bố phương thức thanh toán chỉ tính giao dịch thành công', async () => {
  const res = await get(`/admin/reports/payment-methods?${RANGE}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.items.every((m) => m.amount > 0));
  const sum = res.body.data.items.reduce((s, x) => s + x.share, 0);
  assert.ok(Math.abs(sum - 100) < 0.5 || res.body.data.items.length === 0);
});

/* ================= Gói dữ liệu và xuất tệp ================= */

test('Endpoint dashboard gói đủ bảy khối dữ liệu trong một lần gọi', async () => {
  const res = await get(`/admin/reports/dashboard?${RANGE}`);
  assert.strictEqual(res.status, 200);
  for (const key of ['overview', 'revenue', 'byStatus', 'topProducts', 'topShops', 'byCategory', 'payments']) {
    assert.ok(res.body.data[key], `thiếu khối ${key}`);
  }
});

test('Xuất CSV trả đúng kiểu nội dung và có BOM cho Excel', async () => {
  // Phải kiểm tra ở mức byte: fetch().text() tự bóc BOM khi giải mã UTF-8,
  // nên so sánh chuỗi sẽ luôn báo là thiếu BOM dù tệp thực sự có.
  const raw = await fetch(`${h.baseUrl()}/admin/reports/export?type=orders&${RANGE}`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  assert.strictEqual(raw.status, 200);
  assert.match(raw.headers.get('content-type'), /text\/csv/);
  assert.match(raw.headers.get('content-disposition'), /attachment; filename=/);

  const bytes = new Uint8Array(await raw.arrayBuffer());
  assert.deepStrictEqual([bytes[0], bytes[1], bytes[2]], [0xEF, 0xBB, 0xBF],
    'phải mở đầu bằng BOM UTF-8 để Excel không lỗi font tiếng Việt');

  const lines = Buffer.from(bytes).toString('utf8').replace(/^﻿/, '').split('\r\n');
  assert.ok(lines.length >= 2, 'phải có dòng tiêu đề và ít nhất một dòng dữ liệu');
  assert.match(lines[0], /Mã đơn/);
});

test('Xuất CSV hỗ trợ cả báo cáo doanh thu và sản phẩm', async () => {
  for (const type of ['revenue', 'products']) {
    const res = await h.call('GET', `/admin/reports/export?type=${type}&${RANGE}`,
      { token: admin.accessToken, raw: true });
    assert.strictEqual(res.status, 200, `xuất ${type} phải thành công`);
    assert.ok(res.body.length > 10);
  }
});

test('Không truyền khoảng thời gian thì mặc định lấy 30 ngày gần nhất', async () => {
  const res = await get('/admin/reports/overview');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.range.days, 30);
});
