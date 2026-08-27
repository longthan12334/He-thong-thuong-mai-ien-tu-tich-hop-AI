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
const { sequelize } = require('../src/models');

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

test('Thiếu token thì endpoint cần đăng nhập trả về 401', async () => {
  assert.strictEqual((await call('POST', '/demo/products')).status, 401);
});

test('Người bán có quyền tạo sản phẩm, thành viên thì không', async () => {
  const seller = (await login('techzone')).data;
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('POST', '/demo/products', { token: seller.accessToken })).status, 200);
  assert.strictEqual((await call('POST', '/demo/products', { token: member.accessToken })).status, 403);
});

test('Chế độ "all" buộc phải có đủ mọi quyền trong danh sách', async () => {
  const seller = (await login('techzone')).data;
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('PATCH', '/demo/inventories/1', { token: seller.accessToken })).status, 200);
  const denied = await call('PATCH', '/demo/inventories/1', { token: member.accessToken });
  assert.strictEqual(denied.status, 403);
  assert.ok(Array.isArray(denied.body.error.details.missing), 'phản hồi nêu rõ quyền còn thiếu');
});

test('Chế độ "any" chỉ cần một quyền trong danh sách', async () => {
  const admin = (await login('admin')).data;
  const seller = (await login('techzone')).data;
  assert.strictEqual((await call('GET', '/demo/orders', { token: admin.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/demo/orders', { token: seller.accessToken })).status, 200);
});

test('Kiểm tra sở hữu: chỉ xem được đơn của chính mình', async () => {
  const member = (await login('nguyenvanan')).data;   // user_id = 5, sở hữu đơn 1
  assert.strictEqual((await call('GET', '/demo/orders/1', { token: member.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/demo/orders/2', { token: member.accessToken })).status, 403);
});

test('Quyền vượt cấp cho phép quản trị viên xem mọi đơn', async () => {
  const admin = (await login('admin')).data;
  assert.strictEqual((await call('GET', '/demo/orders/2', { token: admin.accessToken })).status, 200);
});

test('Tài nguyên không tồn tại trả về 404 chứ không phải 403', async () => {
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('GET', '/demo/orders/999999', { token: member.accessToken })).status, 404);
});

test('requireRoles chặn đúng theo vai trò', async () => {
  const seller = (await login('techzone')).data;
  const member = (await login('nguyenvanan')).data;
  assert.strictEqual((await call('GET', '/demo/seller/dashboard', { token: seller.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/demo/seller/dashboard', { token: member.accessToken })).status, 403);
});

test('Endpoint chỉ dành cho quản trị viên', async () => {
  const admin = (await login('admin')).data;
  const seller = (await login('techzone')).data;
  assert.strictEqual((await call('GET', '/demo/admin/config', { token: admin.accessToken })).status, 200);
  assert.strictEqual((await call('GET', '/demo/admin/config', { token: seller.accessToken })).status, 403);
});

test('Token hỏng hoặc bị sửa đều bị từ chối', async () => {
  assert.strictEqual((await call('GET', '/auth/me', { token: 'abc.def.ghi' })).status, 401);
  const s = (await login('vothimai')).data;
  const tampered = s.accessToken.slice(0, -4) + 'AAAA';
  assert.strictEqual((await call('GET', '/auth/me', { token: tampered })).status, 401);
});

test('optionalAuth cho khách vãng lai xem được nhưng biết là chưa đăng nhập', async () => {
  const guest = await call('GET', '/demo/products');
  assert.strictEqual(guest.status, 200);
  assert.strictEqual(guest.body.data.viewer, null);

  const member = (await login('nguyenvanan')).data;
  const logged = await call('GET', '/demo/products', { token: member.accessToken });
  assert.strictEqual(logged.body.data.viewer, 'nguyenvanan');
});
