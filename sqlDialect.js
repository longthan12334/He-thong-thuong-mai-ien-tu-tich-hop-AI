'use strict';
const { sequelize } = require('../../config/database');

/**
 * Lớp che khác biệt cú pháp giữa MySQL và PostgreSQL.
 *
 * Báo cáo doanh thu phải gom nhóm theo ngày, tuần hoặc tháng, mà hai hệ quản trị
 * dùng hàm khác nhau. Gom về một chỗ để tầng service viết truy vấn một lần
 * và chạy được trên cả hai.
 */
const dialect = () => sequelize.getDialect();
const isPg = () => dialect() === 'postgres';

const GRANULARITY = { DAY: 'day', WEEK: 'week', MONTH: 'month' };

/**
 * Biểu thức SQL cắt mốc thời gian về đầu kỳ, trả về chuỗi nhãn.
 * @param {string} column tên cột kiểu thời gian, ví dụ 'placed_at'
 * @param {'day'|'week'|'month'} granularity
 */
function dateBucket(column, granularity = GRANULARITY.DAY) {
  const col = quoteIdent(column);
  if (isPg()) {
    const fmt = { day: 'YYYY-MM-DD', week: 'IYYY-"W"IW', month: 'YYYY-MM' }[granularity];
    const trunc = granularity === 'week' ? 'week' : granularity;
    return `TO_CHAR(DATE_TRUNC('${trunc}', ${col}), '${fmt}')`;
  }
  const fmt = { day: '%Y-%m-%d', week: '%x-W%v', month: '%Y-%m' }[granularity];
  return `DATE_FORMAT(${col}, '${fmt}')`;
}

/** Bọc tên cột theo đúng ký tự trích dẫn của từng hệ quản trị. */
function quoteIdent(name) {
  if (name.includes('.') || name.includes('(')) return name;
  return isPg() ? `"${name}"` : `\`${name}\``;
}

/** CAST sang số thực để phép chia không bị làm tròn nguyên trên MySQL. */
function toFloat(expr) {
  return isPg() ? `CAST(${expr} AS DOUBLE PRECISION)` : `CAST(${expr} AS DECIMAL(20,4))`;
}

/** Sinh đủ mọi mốc trong khoảng, kể cả mốc không phát sinh đơn nào. */
function fillBuckets(rows, { from, to }, granularity, keyField = 'bucket') {
  const found = new Map(rows.map((r) => [r[keyField], r]));
  const out = [];
  const cursor = new Date(from);
  const seen = new Set();

  while (cursor <= to) {
    const label = bucketLabel(cursor, granularity);
    if (!seen.has(label)) {
      seen.add(label);
      out.push(found.get(label) || { [keyField]: label, revenue: 0, orderCount: 0, itemCount: 0 });
    }
    if (granularity === GRANULARITY.MONTH) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + (granularity === GRANULARITY.WEEK ? 7 : 1));
  }
  return out;
}

function bucketLabel(d, granularity) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  if (granularity === GRANULARITY.MONTH) return `${y}-${m}`;
  if (granularity === GRANULARITY.WEEK) {
    const t = new Date(Date.UTC(y, d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = { dialect, isPg, dateBucket, quoteIdent, toFloat, fillBuckets, bucketLabel, GRANULARITY };
