'use strict';
/**
 * store.js — Kho dữ liệu JSON đơn giản, không cần cài database.
 * Toàn bộ dữ liệu nằm trong src/backend/data/db.json.
 * Khi chuyển sang production chỉ cần thay 4 hàm dưới bằng truy vấn MongoDB / MySQL.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'db.json');

const MAC_DINH = {
  nguoiDung: {
    id: 'u1',
    hoTen: 'Nguyễn Đức Mạnh',
    email: 'ducmanh@shopai.vn',
    dienThoai: '+84 912 345 678',
    tinhThanh: 'Hà Nội',
    emailDaXacMinh: true,
    anhDaiDien: null,
    cheDoAI: 'Phân tích (ưu tiên dữ liệu)',
    soNgayLuuTru: 30,
    ghiNhoNguCanh: true,
    // mật khẩu mặc định: "ShopAI@2026" — băm lúc khởi tạo lần đầu
    matKhauHash: null,
    capNhatLuc: null
  },
  diaChi: [
    {
      id: 'a1', nguoiDungId: 'u1',
      hoTen: 'Nguyễn Đức Mạnh', dienThoai: '0912345678',
      tinhThanh: 'Hà Nội', quanHuyen: 'Cầu Giấy', phuongXa: 'Dịch Vọng Hậu',
      diaChiCuThe: 'Số 8, ngõ 20 Trần Thái Tông',
      loai: 'Nhà riêng', macDinh: true, taoLuc: new Date().toISOString()
    },
    {
      id: 'a2', nguoiDungId: 'u1',
      hoTen: 'Nguyễn Đức Mạnh', dienThoai: '0987654321',
      tinhThanh: 'Hà Nội', quanHuyen: 'Ba Đình', phuongXa: 'Ngọc Khánh',
      diaChiCuThe: 'Tầng 12, tòa Daeha, 360 Kim Mã',
      loai: 'Văn phòng', macDinh: false, taoLuc: new Date().toISOString()
    }
  ]
};

let cache = null;

function doc() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    cache = JSON.parse(JSON.stringify(MAC_DINH));
    ghi();
  }
  return cache;
}

function ghi() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
}

module.exports = {
  layNguoiDung: () => doc().nguoiDung,
  luuNguoiDung(patch) {
    Object.assign(doc().nguoiDung, patch, { capNhatLuc: new Date().toISOString() });
    ghi();
    return doc().nguoiDung;
  },
  layDiaChi: () => doc().diaChi,
  luuDiaChi(ds) { doc().diaChi = ds; ghi(); return ds; },
  /** Dùng cho test: đưa dữ liệu về trạng thái gốc */
  datLai() {
    cache = JSON.parse(JSON.stringify(MAC_DINH));
    ghi();
    return cache;
  },
  FILE
};
