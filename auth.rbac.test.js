'use strict';
/**
 * Kiểm thử tự động cho HTTMDTTHA-7 (xác thực, JWT) và HTTMDTTHA-8 (phân quyền RBAC).
 *
 * Yêu cầu trước khi chạy:
 *   1. Đã tạo lược đồ bằng database/01_schema_sprint2_*.sql
 *   2. Đã nạp dữ liệu mẫu bằng database/02_seed_data_*.sql
 *   3. Đã cấu hình .env trỏ đúng cơ sở dữ liệu
 *
 * Chạy: npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { sequelize } = require('../src/database/models');

let server;
let base;
const PWD = 'Password@123';

test.before(async () => {
  server = app.listen(0);
  const { port } = server.address();
  base = `http://127.0.0.1:${port}/api/v1`;
});

test.after(async () => {
  server.close();
  await sequelize.close();
});

async function call(method, path, { body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const login = async (identifier, password = PWD) =>
  (await call('POST', '/auth/login', { body: { identifier, password } })).body;

/* ================= HTTMDTTHA-7 — Xác thực ================= */

test('Đăng nhập bằng email trả về cặp token và danh sách quyền', async () => {
  const r = await login('admin@httmdt.vn');
  assert.strictEqual(r.success, true);
  assert.ok(r.data.accessToken, 'phải có accessToken');
  assert.ok(r.data.refreshToken, 'phải có refreshToken');
  assert.deepStrictEqual(r.data.user.roles, ['ADMIN']);
  assert.ok(r.data.user.permissions.length > 30, 'quản trị viên phải có đủ quyền');
  assert.strictEqual(r.data.user.passwordHash, undefined, 'không được lộ mã băm mật khẩu');
});

test('Đăng nhập được bằng cả username và số điện thoại', async () => {
  assert.strictEqual((await login('nguyenvanan')).success, true);
  assert.strictEqual((await login('0902000002')).success, true);
});

test('Sai mật khẩu trả về 401 và không tiết lộ tài khoản có tồn tại hay không', async () => {
  const a = await call('POST', '/auth/login', { body: { identifier: 'admin@httmdt.vn', password: 'SaiMatKhau1' } });
  const b = await call('POST', '/auth/login', { body: { identifier: 'khong-ton-tai@x.vn', password: 'SaiMatKhau1' } });
  assert.strictEqual(a.status, 401);
  assert.strictEqual(b.status, 401);
  assert.strictEqual(a.body.error.message, b.body.error.message,
    'hai trường hợp phải trả về cùng một thông báo');
});

test('Đăng ký tài khoản mới được gán vai trò MEMBER', async () => {
  const suffix = Date.now().toString().slice(-8);
  const r = await call('POST', '/auth/register', {
    body: {
      username: `kiemthu${suffix}`,
      email: `kiemthu${suffix}@httmdt.vn`,
      password: 'MatKhau@2026',
      confirmPassword: 'MatKhau@2026',
      fullName: 'Tài khoản kiểm thử',
    },
  });
  assert.strictEqual(r.status, 201);
  assert.deepStrictEqual(r.body.data.user.roles, ['MEMBER']);
});

test('Đăng ký trùng email bị từ chối với mã CONFLICT', async () => {
  const r = await call('POST', '/auth/register', {
    body: {
      username: 'trungemail01', email: 'admin@httmdt.vn',
      password: 'MatKhau@2026', fullName: 'Trùng email',
    },
  });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.body.error.code, 'CONFLICT');
});

test('Mật khẩu yếu bị chặn ở tầng kiểm tra dữ liệu', async () => {
  const r = await call('POST', '/auth/register', {
    body: { username: 'matkhauyeu', email: 'yeu@httmdt.vn', password: '123456', fullName: 'Yếu' },
  });
  assert.strictEqual(r.status, 400);
  assert.ok(r.body.error.details.some((d) => d.field === 'password'));
});

test('Refresh token xoay vòng: token cũ bị thu hồi sau khi dùng', async () => {
  const s = (await login('lehoangcuong')).data;
  const first = await call('POST', '/auth/refresh', { body: { refreshToken: s.refreshToken } });
  assert.strictEqual(first.status, 200);
  const reuse = await call('POST', '/auth/refresh', { body: { refreshToken: s.refreshToken } });
  assert.strictEqual(reuse.status, 401);
  assert.strictEqual(reuse.body.error.code, 'REFRESH_TOKEN_REVOKED');
});

test('Sau khi đăng xuất, refresh token không dùng lại được', async () => {
  const s = (await login('phamthidung')).data;
  assert.strictEqual((await call('POST', '/auth/logout', { body: { refreshToken: s.refreshToken } })).status, 200);
  const after = await call('POST', '/auth/refresh', { body: { refreshToken: s.refreshToken } });
  assert.strictEqual(after.status, 401);
});

test('Không thể dùng refresh token thay cho access token', async () => {
  const s = (await login('hoangminhduc')).data;
  const r = await call('GET', '/auth/me', { token: s.refreshToken });
  assert.strictEqual(r.status, 401);
});

/* ================= HTTMDTTHA-8 — Phân quyền ================= */
/*
 * Các ca dưới đây kiểm thử middleware RBAC trên chính những endpoint nghiệp vụ
 * thật của hệ thống, thay vì trên một router demo. Nhờ vậy nếu ai đó gắn sai
 * middleware vào một route thì bộ kiểm thử này phát hiện ngay.
 */

test('Thiếu token thì endpoint cần đăng nhập trả về 401', async () => {
  assert.strictEqual((await call('GET', '/orders')).status, 401);
  assert.strictEqual((await call('GET', '/seller/orders')).status, 401);
  assert.strictEqual((await call('GET', '/admin/reports/overview')).status, 401);
});

test('Quyền xem đơn của gian hàng: người bán có, khách hàng không', async () => {
  const seller = (await login('techzone')).data;
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('GET', '/seller/orders', { token: seller.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/seller/orders', { token: member.accessToken })).status, 403);
});

test('Chế độ "all" buộc có đủ mọi quyền — báo cáo đòi cả REPORT_VIEW lẫn ORDER_VIEW_ALL', async () => {
  const admin = (await login('admin')).data;
  const seller = (await login('techzone')).data;

  assert.strictEqual((await call('GET', '/admin/reports/overview', { token: admin.accessToken })).status, 200);

  // Người bán có REPORT_VIEW nhưng thiếu ORDER_VIEW_ALL nên phải bị chặn
  const denied = await call('GET', '/admin/reports/overview', { token: seller.accessToken });
  assert.strictEqual(denied.status, 403);
  assert.ok(denied.body.error.details.missing.includes('ORDER_VIEW_ALL'),
    'phản hồi phải nêu rõ quyền còn thiếu');
});

test('Chế độ "any" chỉ cần một quyền — cả quản trị viên lẫn người bán đều xem được đơn', async () => {
  const admin = (await login('admin')).data;
  const seller = (await login('techzone')).data;
  assert.strictEqual((await call('GET', '/seller/orders', { token: admin.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/seller/orders', { token: seller.accessToken })).status, 200);
});

test('Phạm vi dữ liệu: khách chỉ đọc được đơn của chính mình', async () => {
  const member = (await login('nguyenvanan')).data;   // user_id = 5, sở hữu đơn 1
  assert.strictEqual((await call('GET', '/orders/1', { token: member.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/orders/2', { token: member.accessToken })).status, 404);
});

test('Tài nguyên không tồn tại trả về 404', async () => {
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('GET', '/orders/999999', { token: member.accessToken })).status, 404);
});

test('Quyền đổi trạng thái tách khỏi quyền xem', async () => {
  const member = (await login('nguyenvanan')).data;
  const res = await call('PATCH', '/seller/orders/1/status',
    { token: member.accessToken, body: { toStatus: 'CONFIRMED' } });
  assert.strictEqual(res.status, 403, 'khách hàng không có ORDER_UPDATE_STATUS');
});

test('Token hỏng hoặc bị sửa đều bị từ chối', async () => {
  assert.strictEqual((await call('GET', '/auth/me', { token: 'abc.def.ghi' })).status, 401);
  const s = (await login('vothimai')).data;
  const tampered = s.accessToken.slice(0, -4) + 'AAAA';
  assert.strictEqual((await call('GET', '/auth/me', { token: tampered })).status, 401);
});

test('Danh sách quyền trả về trong /auth/me khớp với vai trò', async () => {
  const seller = (await login('techzone')).data;
  const res = await call('GET', '/auth/me', { token: seller.accessToken });
  assert.strictEqual(res.status, 200);
  const { roles, permissions } = res.body.data.user;
  assert.ok(roles.includes('SELLER'));
  assert.ok(permissions.includes('ORDER_VIEW_SHOP'));
  assert.ok(permissions.includes('ORDER_UPDATE_STATUS'));
  assert.ok(!permissions.includes('ORDER_VIEW_ALL'), 'người bán không được có quyền xem toàn sàn');
});
