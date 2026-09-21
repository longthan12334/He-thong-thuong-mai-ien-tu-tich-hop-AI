'use strict';
const { ORDER_STATUS } = require('../../shared/constants/enums');

const S = ORDER_STATUS;

/**
 * Máy trạng thái đơn hàng.
 *
 * Mọi thay đổi trạng thái đều phải đi qua bảng này. Nhờ vậy không thể nhảy cóc
 * từ PENDING thẳng sang DELIVERED, và không thể hồi sinh một đơn đã hủy.
 *
 *   PENDING ─┬─> CONFIRMED ─┬─> PACKING ─┬─> SHIPPING ─┬─> DELIVERED ─┬─> COMPLETED
 *            │              │            │             │              │
 *            └──> CANCELLED ┴────────────┘             └──> RETURNED <─┘
 */
const TRANSITIONS = Object.freeze({
  [S.PENDING]: [S.CONFIRMED, S.CANCELLED],
  [S.CONFIRMED]: [S.PACKING, S.CANCELLED],
  [S.PACKING]: [S.SHIPPING, S.CANCELLED],
  [S.SHIPPING]: [S.DELIVERED, S.RETURNED],
  [S.DELIVERED]: [S.COMPLETED, S.RETURNED],
  [S.COMPLETED]: [],
  [S.CANCELLED]: [],
  [S.RETURNED]: [],
});

/** Trạng thái kết thúc, không chuyển đi đâu được nữa. */
const TERMINAL = Object.freeze([S.COMPLETED, S.CANCELLED, S.RETURNED]);

/** Người bán được phép chuyển đơn sang những trạng thái nào. */
const SELLER_ALLOWED = Object.freeze([
  S.CONFIRMED, S.PACKING, S.SHIPPING, S.DELIVERED, S.CANCELLED, S.RETURNED,
]);

/** Khách hàng chỉ được hủy khi đơn chưa rời kho, và xác nhận khi đã nhận hàng. */
const CUSTOMER_CANCELLABLE = Object.freeze([S.PENDING, S.CONFIRMED]);

/** Nhãn tiếng Việt dùng chung cho API và giao diện. */
const STATUS_LABEL = Object.freeze({
  [S.PENDING]: 'Chờ xác nhận',
  [S.CONFIRMED]: 'Đã xác nhận',
  [S.PACKING]: 'Đang đóng gói',
  [S.SHIPPING]: 'Đang giao',
  [S.DELIVERED]: 'Đã giao',
  [S.COMPLETED]: 'Hoàn thành',
  [S.CANCELLED]: 'Đã hủy',
  [S.RETURNED]: 'Đã trả hàng',
});

/** Ghi chú mặc định khi chuyển trạng thái, để nhật ký luôn có nội dung. */
const STATUS_NOTE = Object.freeze({
  [S.PENDING]: 'Khách đặt hàng thành công',
  [S.CONFIRMED]: 'Người bán xác nhận đơn',
  [S.PACKING]: 'Đang đóng gói tại kho',
  [S.SHIPPING]: 'Đã bàn giao cho đơn vị vận chuyển',
  [S.DELIVERED]: 'Giao hàng thành công',
  [S.COMPLETED]: 'Khách xác nhận đã nhận hàng',
  [S.CANCELLED]: 'Đơn bị hủy',
  [S.RETURNED]: 'Khách trả lại hàng',
});

/**
 * Trạng thái được coi là đã ghi nhận doanh thu.
 * Báo cáo ở Phần báo cáo chỉ cộng doanh thu của các trạng thái này,
 * nên đơn đang chờ hoặc đã hủy không làm phồng số liệu.
 */
const REVENUE_STATUSES = Object.freeze([S.DELIVERED, S.COMPLETED]);

/** Các trạng thái mà hàng đã bị giữ chỗ nhưng chưa xuất kho. */
const RESERVED_STATUSES = Object.freeze([S.PENDING, S.CONFIRMED, S.PACKING]);

/** Các trạng thái mà hàng đã rời kho. */
const SHIPPED_STATUSES = Object.freeze([S.SHIPPING, S.DELIVERED, S.COMPLETED]);

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

function nextStatuses(from) {
  return TRANSITIONS[from] || [];
}

function isTerminal(status) {
  return TERMINAL.includes(status);
}

module.exports = {
  TRANSITIONS, TERMINAL, SELLER_ALLOWED, CUSTOMER_CANCELLABLE,
  STATUS_LABEL, STATUS_NOTE, REVENUE_STATUSES, RESERVED_STATUSES, SHIPPED_STATUSES,
  canTransition, nextStatuses, isTerminal,
};
