'use strict';

/**
 * Kết xuất mảng đối tượng thành CSV.
 * Thêm BOM UTF-8 ở đầu tệp để Microsoft Excel trên Windows mở tiếng Việt
 * không bị lỗi font — đây là lỗi hay gặp nhất khi xuất báo cáo.
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','));
  return '﻿' + [header, ...body].join('\r\n');
}

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Chặn công thức bị Excel tự thực thi khi ô bắt đầu bằng = + - @
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

module.exports = { toCsv, escapeCell };
