'use strict';
/**
 * server.js — Máy chủ HTTP thuần Node, không phụ thuộc thư viện ngoài.
 * Vừa phục vụ giao diện tĩnh trong src/frontend, vừa chạy 3 nhóm API:
 *   HTTMDTTHA-48  /api/profile
 *   HTTMDTTHA-49  /api/profile/avatar
 *   HTTMDTTHA-50  /api/addresses
 *
 * Chạy:  node src/backend/server.js        (mặc định cổng 3000)
 *        PORT=4000 node src/backend/server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const store = require('./lib/store');
const mk = require('./lib/password');
const { loi, json, TOKEN_DEMO } = require('./lib/http');
const hoSo = require('./routes/profile');
const anh = require('./routes/avatar');
const diaChi = require('./routes/addresses');

const PORT = Number(process.env.PORT) || 3000;
const FE = path.join(__dirname, '..', 'frontend');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

/* ------------------------- tệp tĩnh ------------------------- */
function tinh(res, goc, duongDan, cache) {
  // chặn path traversal: kết quả bắt buộc nằm trong thư mục gốc
  const p = path.normalize(path.join(goc, decodeURIComponent(duongDan)));
  if (!p.startsWith(goc)) return loi(res, 403, 'Truy cập bị từ chối.');

  fs.readFile(p, (e, buf) => {
    if (e) return loi(res, 404, 'Không tìm thấy tài nguyên.');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': cache || 'no-cache'
    });
    res.end(buf);
  });
}

/* ------------------------- định tuyến ------------------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;
  const m = req.method;

  // CORS cho trường hợp mở frontend từ cổng khác
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (m === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    /* --- tiện ích --- */
    if (p === '/api/health')
      return json(res, 200, {
        thanhCong: true, trangThai: 'ok',
        thuatToanMatKhau: mk.thuatToan(),
        tokenDemo: TOKEN_DEMO,
        thoiGian: new Date().toISOString()
      });

    if (p === '/api/_reset' && m === 'POST') {   // chỉ dùng cho test
      store.datLai();
      store.luuNguoiDung({ matKhauHash: await mk.bam('ShopAI@2026') });
      return json(res, 200, { thanhCong: true, thongBao: 'Đã đặt lại dữ liệu mẫu.' });
    }

    /* --- HTTMDTTHA-49: ảnh đại diện (đặt trước /api/profile) --- */
    if (p === '/api/profile/avatar') {
      if (m === 'POST') return anh.taiLen(req, res);
      if (m === 'DELETE') return anh.xoa(req, res);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }

    /* --- HTTMDTTHA-48: hồ sơ --- */
    if (p === '/api/profile/password') {
      if (m === 'PUT') return hoSo.doiMatKhau(req, res);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }
    if (p === '/api/profile') {
      if (m === 'GET') return hoSo.xemHoSo(req, res);
      if (m === 'PUT') return hoSo.capNhatHoSo(req, res);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }

    /* --- HTTMDTTHA-50: địa chỉ --- */
    if (p === '/api/addresses') {
      if (m === 'GET') return diaChi.danhSach(req, res);
      if (m === 'POST') return diaChi.them(req, res);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }
    let g = /^\/api\/addresses\/([\w-]+)\/default$/.exec(p);
    if (g) {
      if (m === 'PUT') return diaChi.datMacDinh(req, res, g[1]);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }
    g = /^\/api\/addresses\/([\w-]+)$/.exec(p);
    if (g) {
      if (m === 'PUT') return diaChi.sua(req, res, g[1]);
      if (m === 'DELETE') return diaChi.xoa(req, res, g[1]);
      return loi(res, 405, 'Phương thức không được hỗ trợ.');
    }

    if (p.startsWith('/api/')) return loi(res, 404, 'Không tìm thấy endpoint.');

    /* --- tệp tĩnh --- */
    if (m !== 'GET') return loi(res, 405, 'Phương thức không được hỗ trợ.');
    if (p.startsWith('/uploads/'))
      return tinh(res, anh.THU_MUC, p.slice('/uploads'.length), 'public, max-age=31536000, immutable');
    return tinh(res, FE, p === '/' ? '/index.html' : p);

  } catch (e) {
    loi(res, e.code === 413 ? 413 : e.code === 400 ? 400 : 500,
      e.code ? e.message : 'Lỗi máy chủ.', process.env.NODE_ENV === 'development' ? { stack: e.stack } : null);
  }
});

/** Khởi tạo mật khẩu mặc định lần chạy đầu rồi mở cổng */
async function khoiDong(port = PORT) {
  if (!store.layNguoiDung().matKhauHash)
    store.luuNguoiDung({ matKhauHash: await mk.bam('ShopAI@2026') });
  return new Promise(r => server.listen(port, () => r(server)));
}

if (require.main === module) {
  khoiDong().then(() => {
    console.log(`\n  ShopAI — máy chủ đang chạy`);
    console.log(`  Giao diện : http://localhost:${PORT}`);
    console.log(`  API       : http://localhost:${PORT}/api/health`);
    console.log(`  Mật khẩu  : ${mk.thuatToan()}`);
    console.log(`  Tài khoản : ducmanh@shopai.vn / ShopAI@2026\n`);
  });
}

module.exports = { server, khoiDong, PORT };
