'use strict';
/**
 * HTTMDTTHA-49 — API tải lên ảnh đại diện
 *
 *   POST   /api/profile/avatar   Nhận ảnh đã cắt tròn 512×512 (data URL) từ frontend
 *   DELETE /api/profile/avatar   Gỡ ảnh đại diện
 *
 * Frontend cắt ảnh bằng canvas ngay trên trình duyệt rồi gửi lên chuỗi base64,
 * nên server không cần thư viện xử lý ảnh và không bao giờ nhận file gốc.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('../lib/store');
const { ok, loi, docBody, xacThuc } = require('../lib/http');

const THU_MUC = path.join(__dirname, '..', 'uploads');
const GIOI_HAN = 5 * 1024 * 1024;                    // 5 MB, khớp giới hạn của frontend
const CHO_PHEP = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

/** Tách data URL thành { mime, buffer }. Trả null nếu sai định dạng. */
function docDataURL(s) {
  const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(s || '').trim());
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], 'base64') };
}

/** Kiểm tra magic bytes để chắc chắn nội dung đúng là ảnh, không chỉ tin vào phần mime. */
function dungLaAnh(buf, mime) {
  if (mime === 'image/png')
    return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg')
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/webp')
    return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return false;
}

/**
 * Xóa đồng bộ, không dùng fs.rm bất đồng bộ: phản hồi phải chỉ được trả về
 * sau khi tệp cũ đã thực sự biến mất, nếu không thư mục uploads sẽ đọng rác.
 */
function xoaAnhCu(u) {
  if (!u.anhDaiDien) return;
  const p = path.join(THU_MUC, path.basename(u.anhDaiDien));
  try { fs.rmSync(p, { force: true }); } catch { /* tệp đã không còn */ }
}

async function taiLen(req, res) {
  if (!xacThuc(req, res)) return;
  const body = await docBody(req);

  const anh = docDataURL(body.anhDaiDien);
  if (!anh)
    return loi(res, 422, 'Dữ liệu chưa hợp lệ.', { anhDaiDien: 'Cần chuỗi data URL base64 hợp lệ.' });

  const duoi = CHO_PHEP[anh.mime];
  if (!duoi)
    return loi(res, 415, 'Định dạng không được hỗ trợ.', { anhDaiDien: 'Chỉ nhận PNG, JPG hoặc WEBP.' });

  if (anh.buf.length > GIOI_HAN)
    return loi(res, 413, 'Ảnh vượt quá 5 MB.', { anhDaiDien: 'Ảnh vượt quá 5 MB.' });

  if (!dungLaAnh(anh.buf, anh.mime))
    return loi(res, 422, 'Nội dung tệp không phải ảnh hợp lệ.', { anhDaiDien: 'Tệp không phải ảnh.' });

  const u = store.layNguoiDung();
  xoaAnhCu(u);

  const ten = `${u.id}-${crypto.randomBytes(6).toString('hex')}.${duoi}`;
  fs.mkdirSync(THU_MUC, { recursive: true });
  fs.writeFileSync(path.join(THU_MUC, ten), anh.buf);

  const url = `/uploads/${ten}`;
  store.luuNguoiDung({ anhDaiDien: url });

  ok(res, {
    thongBao: 'Đã cập nhật ảnh đại diện.',
    duLieu: { anhDaiDien: url, kichThuoc: anh.buf.length, dinhDang: anh.mime }
  });
}

async function xoa(req, res) {
  if (!xacThuc(req, res)) return;
  const u = store.layNguoiDung();
  if (!u.anhDaiDien) return loi(res, 404, 'Tài khoản chưa có ảnh đại diện.');
  xoaAnhCu(u);
  store.luuNguoiDung({ anhDaiDien: null });
  ok(res, { thongBao: 'Đã gỡ ảnh đại diện.' });
}

module.exports = { taiLen, xoa, THU_MUC, GIOI_HAN, docDataURL, dungLaAnh };
