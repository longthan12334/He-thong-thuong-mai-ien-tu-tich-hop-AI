'use strict';
/* =============================================================
   Bộ test tích hợp — chạy: npm test
   Khởi động máy chủ thật trên cổng ngẫu nhiên rồi gọi HTTP thật.
   Không cần cài thư viện: dùng node:test có sẵn từ Node 18.
   ============================================================= */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { khoiDong, server } = require('../src/backend/server');

const TOKEN = 'shopai-demo-token';
let GOC = '';

/** PNG 1×1 hợp lệ, dùng làm ảnh đại diện giả lập */
const PNG_1x1 = 'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function goi(duongDan, tuyChon = {}) {
  const res = await fetch(GOC + duongDan, {
    ...tuyChon,
    headers: {
      'Content-Type': 'application/json',
      ...(tuyChon.khongToken ? {} : { Authorization: `Bearer ${TOKEN}` }),
      ...(tuyChon.headers || {})
    }
  });
  let body = null;
  try { body = await res.json(); } catch { /* rỗng */ }
  return { status: res.status, body };
}

const datLai = () => goi('/api/_reset', { method: 'POST' });

before(async () => {
  await khoiDong(0);                       // cổng 0 = hệ điều hành tự chọn
  GOC = `http://127.0.0.1:${server.address().port}`;
  await datLai();
});
after(() => server.close());

/* ============================================================
   HTTMDTTHA-48 — API xem & cập nhật hồ sơ cá nhân
   ============================================================ */
describe('HTTMDTTHA-48 · Hồ sơ cá nhân', () => {

  test('GET /api/profile trả về hồ sơ đầy đủ', async () => {
    const { status, body } = await goi('/api/profile');
    assert.equal(status, 200);
    assert.equal(body.thanhCong, true);
    assert.equal(body.duLieu.email, 'ducmanh@shopai.vn');
    assert.equal(body.duLieu.soNgayLuuTru, 30);
  });

  test('GET /api/profile không bao giờ lộ hash mật khẩu', async () => {
    const { body } = await goi('/api/profile');
    assert.equal('matKhauHash' in body.duLieu, false);
  });

  test('Thiếu token thì bị chặn 401', async () => {
    const { status, body } = await goi('/api/profile', { khongToken: true });
    assert.equal(status, 401);
    assert.equal(body.thanhCong, false);
  });

  test('PUT /api/profile cập nhật được thông tin và cấu hình AI', async () => {
    const { status, body } = await goi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        hoTen: 'Nguyễn Đức Mạnh', email: 'ducmanh@shopai.vn',
        dienThoai: '0912345678', tinhThanh: 'Đà Nẵng',
        cheDoAI: 'Ngắn gọn (ưu tiên câu trả lời)', soNgayLuuTru: 90, ghiNhoNguCanh: false
      })
    });
    assert.equal(status, 200);
    assert.equal(body.duLieu.tinhThanh, 'Đà Nẵng');
    assert.equal(body.duLieu.soNgayLuuTru, 90);
    assert.equal(body.duLieu.ghiNhoNguCanh, false);
  });

  test('Dữ liệu thay đổi được lưu bền, đọc lại vẫn đúng', async () => {
    const { body } = await goi('/api/profile');
    assert.equal(body.duLieu.tinhThanh, 'Đà Nẵng');
  });

  test('Email sai định dạng bị từ chối 422 kèm lỗi từng trường', async () => {
    const { status, body } = await goi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ hoTen: 'A B', email: 'sai-dinh-dang',
        dienThoai: '0912345678', tinhThanh: 'Hà Nội' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.email);
  });

  test('Họ tên quá ngắn và điện thoại thiếu số đều báo lỗi', async () => {
    const { status, body } = await goi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ hoTen: 'A', email: 'a@b.vn', dienThoai: '123', tinhThanh: 'Hà Nội' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.hoTen);
    assert.ok(body.chiTiet.dienThoai);
  });

  test('soNgayLuuTru ngoài khoảng 1–365 bị chặn', async () => {
    const { status, body } = await goi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ hoTen: 'A B', email: 'a@b.vn', dienThoai: '0912345678',
        tinhThanh: 'Hà Nội', soNgayLuuTru: 9999 })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.soNgayLuuTru);
  });

  test('Đổi email làm mất trạng thái đã xác minh', async () => {
    const { body } = await goi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ hoTen: 'Nguyễn Đức Mạnh', email: 'moi@shopai.vn',
        dienThoai: '0912345678', tinhThanh: 'Hà Nội' })
    });
    assert.equal(body.duLieu.emailDaXacMinh, false);
    await datLai();
  });

  test('Phương thức không hỗ trợ trả 405', async () => {
    const { status } = await goi('/api/profile', { method: 'DELETE' });
    assert.equal(status, 405);
  });
});

/* ============================================================
   HTTMDTTHA-48 (phần mật khẩu) — băm Bcrypt/scrypt
   ============================================================ */
describe('HTTMDTTHA-48 · Đổi mật khẩu', () => {

  test('Sai mật khẩu hiện tại bị từ chối 401', async () => {
    const { status, body } = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'SaiRoi123', matKhauMoi: 'MatKhau@2026', nhapLai: 'MatKhau@2026' })
    });
    assert.equal(status, 401);
    assert.ok(body.chiTiet.matKhauCu);
  });

  test('Mật khẩu mới dưới 8 ký tự bị chặn', async () => {
    const { status, body } = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'ShopAI@2026', matKhauMoi: 'abc', nhapLai: 'abc' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.matKhauMoi);
  });

  test('Hai lần nhập không khớp bị chặn', async () => {
    const { status, body } = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'ShopAI@2026', matKhauMoi: 'MatKhau@2026', nhapLai: 'KhacNhau@2026' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.nhapLai);
  });

  test('Đổi mật khẩu thành công và trả về độ mạnh 0–3', async () => {
    const { status, body } = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'ShopAI@2026', matKhauMoi: 'MatKhauRatManh@2026', nhapLai: 'MatKhauRatManh@2026' })
    });
    assert.equal(status, 200);
    assert.equal(body.doManh, 3);
    assert.match(body.thuatToan, /bcrypt|scrypt/);
  });

  test('Mật khẩu mới có hiệu lực ngay, mật khẩu cũ hết dùng được', async () => {
    const cu = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'ShopAI@2026', matKhauMoi: 'ABCdef@123456', nhapLai: 'ABCdef@123456' })
    });
    assert.equal(cu.status, 401);

    const moi = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'MatKhauRatManh@2026', matKhauMoi: 'ABCdef@123456', nhapLai: 'ABCdef@123456' })
    });
    assert.equal(moi.status, 200);
  });

  test('Không cho đặt lại đúng mật khẩu đang dùng', async () => {
    const { status, body } = await goi('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ matKhauCu: 'ABCdef@123456', matKhauMoi: 'ABCdef@123456', nhapLai: 'ABCdef@123456' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.matKhauMoi);
    await datLai();
  });

  test('Hash lưu trong kho không phải văn bản thuần', async () => {
    const store = require('../src/backend/lib/store');
    const hash = store.layNguoiDung().matKhauHash;
    assert.ok(hash && hash.length > 20);
    assert.notEqual(hash, 'ShopAI@2026');
    assert.ok(!hash.includes('ShopAI@2026'));
  });
});

/* ============================================================
   HTTMDTTHA-49 — API tải lên ảnh đại diện
   ============================================================ */
describe('HTTMDTTHA-49 · Ảnh đại diện', () => {

  test('POST ảnh PNG hợp lệ trả về đường dẫn công khai', async () => {
    const { status, body } = await goi('/api/profile/avatar', {
      method: 'POST', body: JSON.stringify({ anhDaiDien: PNG_1x1 })
    });
    assert.equal(status, 200);
    assert.match(body.duLieu.anhDaiDien, /^\/uploads\/u1-[0-9a-f]+\.png$/);
    assert.equal(body.duLieu.dinhDang, 'image/png');
  });

  test('Tệp thật sự được ghi xuống đĩa', async () => {
    const { body } = await goi('/api/profile');
    const p = path.join(__dirname, '..', 'src', 'backend', 'uploads',
      path.basename(body.duLieu.anhDaiDien));
    assert.ok(fs.existsSync(p));
    assert.ok(fs.statSync(p).size > 0);
  });

  test('Ảnh tải về được qua HTTP với đúng content-type', async () => {
    const { body } = await goi('/api/profile');
    const res = await fetch(GOC + body.duLieu.anhDaiDien);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
  });

  test('Tải ảnh mới sẽ xóa ảnh cũ, không để rác trên đĩa', async () => {
    const truoc = (await goi('/api/profile')).body.duLieu.anhDaiDien;
    await goi('/api/profile/avatar', { method: 'POST', body: JSON.stringify({ anhDaiDien: PNG_1x1 }) });
    const p = path.join(__dirname, '..', 'src', 'backend', 'uploads', path.basename(truoc));
    assert.equal(fs.existsSync(p), false);
  });

  test('Chuỗi không phải data URL bị từ chối 422', async () => {
    const { status, body } = await goi('/api/profile/avatar', {
      method: 'POST', body: JSON.stringify({ anhDaiDien: 'khong-phai-anh' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.anhDaiDien);
  });

  test('Định dạng ngoài PNG/JPG/WEBP bị từ chối 415', async () => {
    const { status } = await goi('/api/profile/avatar', {
      method: 'POST', body: JSON.stringify({ anhDaiDien: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' })
    });
    assert.equal(status, 415);
  });

  test('Khai mime là PNG nhưng nội dung không phải ảnh thì bị chặn', async () => {
    const gia = 'data:image/png;base64,' + Buffer.from('day khong phai anh').toString('base64');
    const { status, body } = await goi('/api/profile/avatar', {
      method: 'POST', body: JSON.stringify({ anhDaiDien: gia })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.anhDaiDien);
  });

  test('DELETE gỡ ảnh đại diện thành công', async () => {
    const { status } = await goi('/api/profile/avatar', { method: 'DELETE' });
    assert.equal(status, 200);
    const { body } = await goi('/api/profile');
    assert.equal(body.duLieu.anhDaiDien, null);
  });

  test('DELETE khi chưa có ảnh trả 404', async () => {
    const { status } = await goi('/api/profile/avatar', { method: 'DELETE' });
    assert.equal(status, 404);
  });
});

/* ============================================================
   HTTMDTTHA-50 — API CRUD địa chỉ giao hàng
   ============================================================ */
describe('HTTMDTTHA-50 · Sổ địa chỉ', () => {

  const MAU = {
    hoTen: 'Trần Thị B', dienThoai: '0987123456', tinhThanh: 'TP. Hồ Chí Minh',
    quanHuyen: 'Quận 1', phuongXa: 'Bến Nghé', diaChiCuThe: '12 Lê Duẩn', loai: 'Văn phòng'
  };

  test('GET trả về danh sách mẫu, mặc định đứng đầu', async () => {
    await datLai();
    const { status, body } = await goi('/api/addresses');
    assert.equal(status, 200);
    assert.equal(body.tong, 2);
    assert.equal(body.duLieu[0].macDinh, true);
  });

  test('POST thêm địa chỉ mới thành công', async () => {
    const { status, body } = await goi('/api/addresses', { method: 'POST', body: JSON.stringify(MAU) });
    assert.equal(status, 200);
    assert.equal(body.duLieu.quanHuyen, 'Quận 1');
    assert.equal(body.duLieu.macDinh, false);
    assert.equal((await goi('/api/addresses')).body.tong, 3);
  });

  test('Thiếu trường bắt buộc bị chặn 422', async () => {
    const { status, body } = await goi('/api/addresses', {
      method: 'POST', body: JSON.stringify({ hoTen: 'X Y', dienThoai: '0912345678' })
    });
    assert.equal(status, 422);
    assert.ok(body.chiTiet.tinhThanh);
    assert.ok(body.chiTiet.diaChiCuThe);
  });

  test('PUT sửa được địa chỉ đã có', async () => {
    const ds = (await goi('/api/addresses')).body.duLieu;
    const id = ds.find(a => !a.macDinh).id;
    const { status, body } = await goi(`/api/addresses/${id}`, {
      method: 'PUT', body: JSON.stringify({ diaChiCuThe: '99 Nguyễn Huệ' })
    });
    assert.equal(status, 200);
    assert.equal(body.duLieu.diaChiCuThe, '99 Nguyễn Huệ');
  });

  test('Sửa địa chỉ không tồn tại trả 404', async () => {
    const { status } = await goi('/api/addresses/khong-co', {
      method: 'PUT', body: JSON.stringify({ diaChiCuThe: 'X' })
    });
    assert.equal(status, 404);
  });

  test('Đặt mặc định chỉ giữ đúng một địa chỉ mặc định', async () => {
    const ds = (await goi('/api/addresses')).body.duLieu;
    const id = ds.find(a => !a.macDinh).id;
    const { status, body } = await goi(`/api/addresses/${id}/default`, { method: 'PUT' });
    assert.equal(status, 200);
    assert.equal(body.duLieu.filter(a => a.macDinh).length, 1);
    assert.equal(body.duLieu[0].id, id);
  });

  test('Xóa địa chỉ mặc định thì địa chỉ khác được nâng lên thay thế', async () => {
    const truoc = (await goi('/api/addresses')).body.duLieu;
    const idMacDinh = truoc.find(a => a.macDinh).id;
    await goi(`/api/addresses/${idMacDinh}`, { method: 'DELETE' });
    const sau = (await goi('/api/addresses')).body.duLieu;
    assert.equal(sau.length, truoc.length - 1);
    assert.equal(sau.filter(a => a.macDinh).length, 1);
    assert.equal(sau.some(a => a.id === idMacDinh), false);
  });

  test('Xóa địa chỉ không tồn tại trả 404', async () => {
    const { status } = await goi('/api/addresses/khong-co', { method: 'DELETE' });
    assert.equal(status, 404);
  });

  test('Chặn vượt quá 10 địa chỉ mỗi tài khoản', async () => {
    await datLai();
    for (let i = 0; i < 8; i++)
      await goi('/api/addresses', { method: 'POST', body: JSON.stringify({ ...MAU, diaChiCuThe: `Số ${i}` }) });
    assert.equal((await goi('/api/addresses')).body.tong, 10);

    const { status, body } = await goi('/api/addresses', { method: 'POST', body: JSON.stringify(MAU) });
    assert.equal(status, 409);
    assert.match(body.thongBao, /tối đa 10/);
    await datLai();
  });

  test('Địa chỉ đầu tiên tự động trở thành mặc định', async () => {
    const ds = (await goi('/api/addresses')).body.duLieu;
    for (const a of ds) await goi(`/api/addresses/${a.id}`, { method: 'DELETE' });
    assert.equal((await goi('/api/addresses')).body.tong, 0);

    const { body } = await goi('/api/addresses', { method: 'POST', body: JSON.stringify(MAU) });
    assert.equal(body.duLieu.macDinh, true);
    await datLai();
  });

  test('Sổ địa chỉ cũng yêu cầu token', async () => {
    const { status } = await goi('/api/addresses', { khongToken: true });
    assert.equal(status, 401);
  });
});

/* ============================================================
   HTTMDTTHA-52 / 53 — Giao diện được phục vụ đúng
   ============================================================ */
describe('HTTMDTTHA-52 · 53 · Giao diện', () => {

  test('GET / trả về index.html', async () => {
    const res = await fetch(GOC + '/');
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.ok(html.includes('Ảnh Đại Diện'));
    assert.ok(html.includes('Sổ Địa Chỉ'));
  });

  test('style.css và app.js được phục vụ đúng kiểu MIME', async () => {
    const css = await fetch(GOC + '/style.css');
    assert.match(css.headers.get('content-type'), /text\/css/);
    const js = await fetch(GOC + '/app.js');
    assert.match(js.headers.get('content-type'), /javascript/);
  });

  test('Chặn path traversal ra ngoài thư mục frontend', async () => {
    const res = await fetch(GOC + '/../../package.json');
    assert.ok(res.status === 403 || res.status === 404);
  });

  test('Endpoint API không tồn tại trả 404 dạng JSON', async () => {
    const { status, body } = await goi('/api/khong-ton-tai');
    assert.equal(status, 404);
    assert.equal(body.thanhCong, false);
  });

  test('/api/health báo đúng thuật toán băm đang dùng', async () => {
    const { status, body } = await goi('/api/health');
    assert.equal(status, 200);
    assert.match(body.thuatToanMatKhau, /bcrypt|scrypt/);
  });
});
