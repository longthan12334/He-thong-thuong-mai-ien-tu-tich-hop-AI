'use strict';
const ApiError = require('../errors/ApiError');

const DAY_MS = 86_400_000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Chuẩn hóa khoảng thời gian báo cáo.
 * Không truyền gì thì lấy 30 ngày gần nhất tính tới hết hôm nay.
 *
 * @returns {{from: Date, to: Date, days: number}}
 */
function parseDateRange(query = {}, defaultDays = 30) {
  const to = query.to ? endOfDay(query.to) : endOfDay(new Date());
  const from = query.from
    ? startOfDay(query.from)
    : startOfDay(new Date(to.getTime() - (defaultDays - 1) * DAY_MS));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw ApiError.badRequest('Khoảng thời gian không hợp lệ, dùng định dạng YYYY-MM-DD');
  }
  if (from > to) {
    throw ApiError.badRequest('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
  }

  // Đếm theo mốc đầu ngày rồi cộng 1: từ 01/08 tới 30/08 là 30 ngày, không phải 31.
  const days = Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS) + 1;
  if (days > 1095) {
    throw ApiError.badRequest('Khoảng thời gian tối đa là 3 năm');
  }
  return { from, to, days };
}

/**
 * Suy ra kỳ liền trước có cùng độ dài, phục vụ tính mức tăng trưởng.
 * Ví dụ kỳ hiện tại là 01/09–30/09 thì kỳ trước là 02/08–31/08.
 */
function previousPeriod({ from, to }) {
  const days = Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS) + 1;
  const anchor = startOfDay(from).getTime();
  return {
    from: new Date(anchor - days * DAY_MS),
    to: new Date(anchor - 1),          // hết ngày liền trước ngày bắt đầu kỳ hiện tại
  };
}

/** Tỉ lệ tăng trưởng theo phần trăm, an toàn khi kỳ trước bằng 0. */
function growthRate(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c === 0 ? 0 : 100;
  return Number((((c - p) / p) * 100).toFixed(2));
}

module.exports = { parseDateRange, previousPeriod, growthRate, startOfDay, endOfDay, DAY_MS };
