'use strict';
/**
 * HTTMDTTHA-48 — API xem & cập nhật hồ sơ cá nhân
 *
 *   GET  /api/profile           Lấy hồ sơ hiện tại
 *   PUT  /api/profile           Cập nhật thông tin + cấu hình AI
 *   PUT  /api/profile/password  Đổi mật khẩu (băm Bcrypt 10 rounds)
 */
const store = require('../lib/store');
const mk = require('../lib/password');
const { ok, loi, docBody, xacThuc, kiemTra, V } = require('../lib/http');

const CHE_DO_AI = [
  'Phân tích (ưu tiên dữ liệu)',
  'Hội thoại (ưu tiên ngữ cảnh)',
  'Ngắn gọn (ưu tiên câu trả lời)',
  'Hướng dẫn (từng bước)'
];

/** Bỏ trường nhạy cảm trước khi trả về client */
function congKhai(u) {
  const { matKhauHash, ...rest } = u;
  return rest;
}

async function xemHoSo(req, res) {
  if (!xacThuc(req, res)) return;
  ok(res, { duLieu: congKhai(store.layNguoiDung()) });
}

async function capNhatHoSo(req, res) {
  if (!xacThuc(req, res)) return;
  const body = await docBody(req);

  const loiTruong = kiemTra(body, {
    hoTen: [V.hoTen],
    email: [V.email],
    dienThoai: [V.dienThoai],
    tinhThanh: [V.batBuoc('Tỉnh/Thành phố')],
    cheDoAI: [V.thuoc(CHE_DO_AI), false],
    soNgayLuuTru: [V.soTrong(1, 365), false],
    ghiNhoNguCanh: [V.boolean, false]
  });
  if (loiTruong) return loi(res, 422, 'Dữ liệu chưa hợp lệ.', loiTruong);

  const truoc = store.layNguoiDung();
  const patch = {
    hoTen: body.hoTen.trim(),
    email: body.email.trim().toLowerCase(),
    dienThoai: body.dienThoai.trim(),
    tinhThanh: body.tinhThanh.trim()
  };
  if (body.cheDoAI !== undefined) patch.cheDoAI = body.cheDoAI;
  if (body.soNgayLuuTru !== undefined) patch.soNgayLuuTru = body.soNgayLuuTru;
  if (body.ghiNhoNguCanh !== undefined) patch.ghiNhoNguCanh = body.ghiNhoNguCanh;

  // Đổi email thì phải xác minh lại
  if (patch.email !== truoc.email) patch.emailDaXacMinh = false;

  ok(res, { thongBao: 'Đã cập nhật hồ sơ.', duLieu: congKhai(store.luuNguoiDung(patch)) });
}

async function doiMatKhau(req, res) {
  if (!xacThuc(req, res)) return;
  const body = await docBody(req);

  const loiTruong = kiemTra(body, {
    matKhauCu: [V.batBuoc('Mật khẩu hiện tại')],
    matKhauMoi: [v => (typeof v === 'string' && v.length >= 8) || 'Mật khẩu mới cần tối thiểu 8 ký tự.'],
    nhapLai: [V.batBuoc('Xác nhận mật khẩu')]
  });
  if (loiTruong) return loi(res, 422, 'Dữ liệu chưa hợp lệ.', loiTruong);

  if (body.matKhauMoi !== body.nhapLai)
    return loi(res, 422, 'Dữ liệu chưa hợp lệ.', { nhapLai: 'Hai mật khẩu chưa khớp nhau.' });

  const u = store.layNguoiDung();
  if (!(await mk.doiChieu(body.matKhauCu, u.matKhauHash)))
    return loi(res, 401, 'Mật khẩu hiện tại không đúng.', { matKhauCu: 'Mật khẩu hiện tại không đúng.' });

  if (await mk.doiChieu(body.matKhauMoi, u.matKhauHash))
    return loi(res, 422, 'Dữ liệu chưa hợp lệ.', { matKhauMoi: 'Mật khẩu mới phải khác mật khẩu cũ.' });

  store.luuNguoiDung({ matKhauHash: await mk.bam(body.matKhauMoi) });

  ok(res, {
    thongBao: 'Đã đổi mật khẩu.',
    thuatToan: mk.thuatToan(),
    doManh: mk.doDoManh(body.matKhauMoi) // 0–3, khớp thanh đo trên giao diện
  });
}

module.exports = { xemHoSo, capNhatHoSo, doiMatKhau, CHE_DO_AI, congKhai };
