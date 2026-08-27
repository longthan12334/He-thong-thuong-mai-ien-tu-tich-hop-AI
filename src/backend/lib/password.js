'use strict';
/**
 * password.js — Băm và đối chiếu mật khẩu.
 *
 * Ưu tiên bcryptjs với 10 salt rounds (đúng như mô tả trên giao diện).
 * Nếu môi trường chưa cài bcryptjs, tự động lùi về scrypt có sẵn trong Node
 * để dự án vẫn chạy được mà không cần `npm install`.
 *
 * Cài bcrypt thật:  npm install bcryptjs
 */
const crypto = require('crypto');

const SALT_ROUNDS = 10;

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch { /* dùng scrypt thay thế */ }

const thuatToan = () => (bcrypt ? `bcrypt (${SALT_ROUNDS} rounds)` : 'scrypt (dự phòng)');

async function bam(matKhau) {
  if (bcrypt) return bcrypt.hash(matKhau, SALT_ROUNDS);
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await new Promise((res, rej) =>
    crypto.scrypt(matKhau, salt, 64, (e, k) => (e ? rej(e) : res(k)))
  );
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function doiChieu(matKhau, hash) {
  if (!hash) return false;
  if (hash.startsWith('scrypt$')) {
    const [, salt, khoa] = hash.split('$');
    const key = await new Promise((res, rej) =>
      crypto.scrypt(matKhau, salt, 64, (e, k) => (e ? rej(e) : res(k)))
    );
    const a = Buffer.from(khoa, 'hex');
    return a.length === key.length && crypto.timingSafeEqual(a, key);
  }
  return bcrypt ? bcrypt.compare(matKhau, hash) : false;
}

/** Trả về điểm 0–3 giống thanh đo 4 cấp trên giao diện */
function doDoManh(p) {
  if (!p) return -1;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^\w\s]/.test(p)) s++;
  return Math.min(3, Math.max(0, s - 1));
}

module.exports = { bam, doiChieu, doDoManh, thuatToan, SALT_ROUNDS };
