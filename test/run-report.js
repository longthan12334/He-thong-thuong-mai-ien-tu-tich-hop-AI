'use strict';
/* Chạy bộ test rồi kết xuất báo cáo Markdown vào ket-qua/ket-qua-test.md */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GOC = path.join(__dirname, '..');
let raw = '';
try {
  raw = execFileSync('node', ['--test', 'test/test-api.js'],
    { cwd: GOC, encoding: 'utf8', maxBuffer: 1 << 24 });
} catch (e) {
  raw = (e.stdout || '') + (e.stderr || '');
}

const dong = raw.split('\n');
const nhom = [];
let hienTai = null;

/* TAP lồng nhau: nhóm cha nằm ở cột 0, ca con thụt vào 4 dấu cách. */
for (const l of dong) {
  let m = /^# Subtest: (.+)$/.exec(l);              // không trim: cột 0 = nhóm cha
  if (m) { hienTai = { ten: m[1], ca: [] }; nhom.push(hienTai); continue; }
  m = /^ {4}(ok|not ok) \d+ - (.+)$/.exec(l);       // thụt 4 dấu cách = ca con
  if (m && hienTai) hienTai.ca.push({ dat: m[1] === 'ok', ten: m[2] });
}

const so = k => Number((new RegExp(`^# ${k} (\\d+)$`, 'm').exec(raw) || [])[1] || 0);
const tong = so('tests'), dat = so('pass'), hong = so('fail');
const giay = ((new RegExp('^# duration_ms ([\\d.]+)$', 'm').exec(raw) || [])[1] / 1000).toFixed(2);

let md = `# Kết quả kiểm thử — ShopAI

Sinh tự động bởi \`node test/run-report.js\` lúc ${new Date().toLocaleString('vi-VN')}.

| Chỉ số | Giá trị |
|---|---|
| Tổng số ca kiểm thử | **${tong}** |
| Đạt | **${dat}** |
| Hỏng | **${hong}** |
| Tỉ lệ đạt | **${((dat / tong) * 100).toFixed(1)}%** |
| Thời gian chạy | ${giay}s |
| Môi trường | Node ${process.version}, không phụ thuộc thư viện ngoài |

`;

for (const n of nhom) {
  if (!n.ca.length) continue;
  const h = n.ca.filter(c => !c.dat).length;
  md += `\n## ${n.ten}\n\n${n.ca.length} ca · ${n.ca.length - h} đạt${h ? ` · ${h} hỏng` : ''}\n\n`;
  for (const c of n.ca) md += `- ${c.dat ? '✅' : '❌'} ${c.ten}\n`;
}

md += `

## Ghi chú

- Bộ test khởi động máy chủ thật trên một cổng ngẫu nhiên rồi gọi HTTP thật, không dùng mock.
- Mỗi nhóm tự đặt lại dữ liệu mẫu qua \`POST /api/_reset\` nên có thể chạy lặp lại nhiều lần.
- Ca *"Tải ảnh mới sẽ xóa ảnh cũ"* từng phát hiện một lỗi thật: \`fs.rm\` bất đồng bộ khiến phản hồi
  trả về trước khi tệp cũ bị xóa, làm thư mục \`uploads\` đọng rác. Đã sửa sang \`fs.rmSync\`.
`;

fs.mkdirSync(path.join(GOC, 'ket-qua'), { recursive: true });
fs.writeFileSync(path.join(GOC, 'ket-qua', 'ket-qua-test.md'), md, 'utf8');
fs.writeFileSync(path.join(GOC, 'ket-qua', 'test-output.txt'), raw, 'utf8');

console.log(`Đã ghi ket-qua/ket-qua-test.md — ${dat}/${tong} ca đạt.`);
process.exit(hong ? 1 : 0);
