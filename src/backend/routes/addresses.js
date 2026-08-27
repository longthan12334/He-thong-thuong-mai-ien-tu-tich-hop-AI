'use strict';
/**
 * HTTMDTTHA-50 — API CRUD địa chỉ giao hàng
 *
 *   GET    /api/addresses              Danh sách, địa chỉ mặc định đứng đầu
 *   POST   /api/addresses              Thêm mới
 *   PUT    /api/addresses/:id          Sửa
 *   DELETE /api/addresses/:id          Xóa
 *   PUT    /api/addresses/:id/default  Đặt làm mặc định
 *
 * Quy tắc nghiệp vụ:
 *   - Luôn có đúng một địa chỉ mặc định (địa chỉ đầu tiên tự động là mặc định).
 *   - Xóa địa chỉ mặc định thì địa chỉ còn lại cũ nhất được nâng lên thay thế.
 *   - Tối đa 10 địa chỉ mỗi tài khoản.
 */
const crypto = require('crypto');
const store = require('../lib/store');
const { ok, loi, docBody, xacThuc, kiemTra, V } = require('../lib/http');

const TOI_DA = 10;
const LOAI = ['Nhà riêng', 'Văn phòng'];

const LUAT = {
  hoTen: [V.hoTen],
  dienThoai: [V.dienThoai],
  tinhThanh: [V.batBuoc('Tỉnh/Thành phố')],
  quanHuyen: [V.batBuoc('Quận/Huyện')],
  phuongXa: [V.batBuoc('Phường/Xã')],
  diaChiCuThe: [V.batBuoc('Địa chỉ cụ thể')],
  loai: [V.thuoc(LOAI), false],
  macDinh: [V.boolean, false]
};

/** Mặc định lên đầu, sau đó tới địa chỉ tạo gần nhất */
const sapXep = ds =>
  [...ds].sort((a, b) => (b.macDinh - a.macDinh) || (b.taoLuc < a.taoLuc ? -1 : 1));

/** Giữ bất biến: đúng một địa chỉ mặc định */
function chuanHoa(ds, idUuTien) {
  if (!ds.length) return ds;
  let chon = idUuTien && ds.find(d => d.id === idUuTien);
  if (!chon) chon = ds.find(d => d.macDinh) || ds[0];
  ds.forEach(d => { d.macDinh = d.id === chon.id; });
  return ds;
}

const lam = (b, cu = {}) => ({
  hoTen: String(b.hoTen ?? cu.hoTen).trim(),
  dienThoai: String(b.dienThoai ?? cu.dienThoai).trim(),
  tinhThanh: String(b.tinhThanh ?? cu.tinhThanh).trim(),
  quanHuyen: String(b.quanHuyen ?? cu.quanHuyen).trim(),
  phuongXa: String(b.phuongXa ?? cu.phuongXa).trim(),
  diaChiCuThe: String(b.diaChiCuThe ?? cu.diaChiCuThe).trim(),
  loai: LOAI.includes(b.loai) ? b.loai : (cu.loai || 'Nhà riêng')
});

async function danhSach(req, res) {
  if (!xacThuc(req, res)) return;
  const ds = sapXep(store.layDiaChi());
  ok(res, { duLieu: ds, tong: ds.length, toiDa: TOI_DA });
}

async function them(req, res) {
  if (!xacThuc(req, res)) return;
  const body = await docBody(req);

  const loiTruong = kiemTra(body, LUAT);
  if (loiTruong) return loi(res, 422, 'Dữ liệu chưa hợp lệ.', loiTruong);

  const ds = store.layDiaChi();
  if (ds.length >= TOI_DA)
    return loi(res, 409, `Mỗi tài khoản chỉ lưu tối đa ${TOI_DA} địa chỉ.`);

  const moi = {
    id: 'a' + crypto.randomBytes(5).toString('hex'),
    nguoiDungId: store.layNguoiDung().id,
    ...lam(body),
    macDinh: false,
    taoLuc: new Date().toISOString()
  };
  ds.push(moi);
  // Địa chỉ đầu tiên, hoặc người dùng tick "đặt làm mặc định"
  chuanHoa(ds, (body.macDinh === true || ds.length === 1) ? moi.id : null);
  store.luuDiaChi(ds);

  ok(res, { thongBao: 'Đã thêm địa chỉ.', duLieu: ds.find(d => d.id === moi.id) });
}

async function sua(req, res, id) {
  if (!xacThuc(req, res)) return;
  const ds = store.layDiaChi();
  const cu = ds.find(d => d.id === id);
  if (!cu) return loi(res, 404, 'Không tìm thấy địa chỉ.');

  const body = await docBody(req);
  const gop = { ...cu, ...body };
  const loiTruong = kiemTra(gop, LUAT);
  if (loiTruong) return loi(res, 422, 'Dữ liệu chưa hợp lệ.', loiTruong);

  Object.assign(cu, lam(body, cu), { suaLuc: new Date().toISOString() });
  chuanHoa(ds, body.macDinh === true ? id : null);
  store.luuDiaChi(ds);

  ok(res, { thongBao: 'Đã cập nhật địa chỉ.', duLieu: cu });
}

async function xoa(req, res, id) {
  if (!xacThuc(req, res)) return;
  const ds = store.layDiaChi();
  const i = ds.findIndex(d => d.id === id);
  if (i === -1) return loi(res, 404, 'Không tìm thấy địa chỉ.');

  const [bo] = ds.splice(i, 1);
  if (bo.macDinh && ds.length) chuanHoa(ds, null); // nâng địa chỉ khác lên mặc định
  store.luuDiaChi(ds);

  ok(res, { thongBao: 'Đã xóa địa chỉ.', duLieu: { id, conLai: ds.length } });
}

async function datMacDinh(req, res, id) {
  if (!xacThuc(req, res)) return;
  const ds = store.layDiaChi();
  if (!ds.some(d => d.id === id)) return loi(res, 404, 'Không tìm thấy địa chỉ.');

  chuanHoa(ds, id);
  store.luuDiaChi(ds);
  ok(res, { thongBao: 'Đã đặt làm địa chỉ mặc định.', duLieu: sapXep(ds) });
}

module.exports = { danhSach, them, sua, xoa, datMacDinh, TOI_DA, LOAI };
