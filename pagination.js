'use strict';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Chuẩn hóa tham số phân trang từ query string.
 * Chặn trên MAX_LIMIT để một request không thể kéo cả bảng về.
 */
function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const raw = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, raw));
  return { page, limit, offset: (page - 1) * limit };
}

/** Gói kết quả kèm siêu dữ liệu phân trang để giao diện dựng thanh trang. */
function buildPage(rows, total, { page, limit }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items: rows,
    pagination: {
      page, limit, total, totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}

module.exports = { parsePagination, buildPage, DEFAULT_LIMIT, MAX_LIMIT };
