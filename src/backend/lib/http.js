'use strict';
/** http.js — Tiện ích dùng chung cho các route: đọc body, trả JSON, xác thực, validate. */

const GIOI_HAN_BODY = 8 * 1024 * 1024; // 8 MB, đủ chỗ cho ảnh base64 5 MB

/** Token demo. Thực tế thay bằng xác minh JWT. */
const TOKEN_DEMO = 'shopai-demo-token';

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const ok = (res, data) => json(res, 200, { thanhCong: true, ...data });
const loi = (res, code, thongBao, chiTiet) =>
  json(res, code, { thanhCong: false, thongBao, ...(chiTiet ? { chiTiet } : {}) });

function docBody(req) {
  return new Promise((resolve, reject) => {
    let tong = 0;
    const phan = [];
    req.on('data', c => {
      tong += c.length;
      if (tong > GIOI_HAN_BODY) {
        reject(Object.assign(new Error('Body quá lớn'), { code: 413 }));
        req.destroy();
        return;
      }
      phan.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(phan).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(Object.assign(new Error('JSON không hợp lệ'), { code: 400 })); }
    });
    req.on('error', reject);
  });
}

/** Chặn request thiếu Bearer token. Trả true nếu hợp lệ. */
function xacThuc(req, res) {
  const h = req.headers.authorization || '';
  if (h === `Bearer ${TOKEN_DEMO}`) return true;
  loi(res, 401, 'Thiếu hoặc sai token xác thực.');
  return false;
}

/* ------------ Kiểm tra dữ liệu, khớp đúng luật của frontend ------------ */
const V = {
  hoTen: v => (typeof v === 'string' && v.trim().length >= 2) || 'Họ tên cần ít nhất 2 ký tự.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) || 'Email chưa đúng định dạng.',
  dienThoai: v => String(v).replace(/\D/g, '').length >= 9 || 'Số điện thoại cần ít nhất 9 chữ số.',
  batBuoc: nhan => v =>
    (typeof v === 'string' && v.trim().length > 0) || `${nhan} không được để trống.`,
  soTrong: (min, max) => v =>
    (Number.isInteger(v) && v >= min && v <= max) || `Giá trị phải trong khoảng ${min}–${max}.`,
  boolean: v => typeof v === 'boolean' || 'Giá trị phải là true hoặc false.',
  thuoc: ds => v => ds.includes(v) || `Chỉ chấp nhận: ${ds.join(', ')}.`
};

/**
 * Chạy bộ luật trên dữ liệu.
 * @param {object} data dữ liệu gửi lên
 * @param {object} luat  { truong: [hamKiemTra, batBuoc?] }
 * @returns {object|null} bản đồ lỗi, hoặc null nếu hợp lệ
 */
function kiemTra(data, luat) {
  const loiTruong = {};
  for (const [truong, [ham, batBuoc = true]] of Object.entries(luat)) {
    const co = Object.prototype.hasOwnProperty.call(data, truong);
    if (!co) {
      if (batBuoc) loiTruong[truong] = 'Thiếu trường bắt buộc.';
      continue;
    }
    const kq = ham(data[truong]);
    if (kq !== true) loiTruong[truong] = kq;
  }
  return Object.keys(loiTruong).length ? loiTruong : null;
}

module.exports = { json, ok, loi, docBody, xacThuc, kiemTra, V, TOKEN_DEMO, GIOI_HAN_BODY };
