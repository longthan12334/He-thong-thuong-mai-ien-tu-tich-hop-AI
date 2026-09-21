'use strict';
/**
 * Tập giá trị hợp lệ của các cột trạng thái, đồng bộ với ràng buộc CHECK
 * trong lược đồ cơ sở dữ liệu. Dùng hằng số thay vì chuỗi rời rạc để
 * tránh gõ sai và để sửa một chỗ là đổi toàn hệ thống.
 */

const USER_STATUS = {
  ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', LOCKED: 'LOCKED', DELETED: 'DELETED',
};

const ORDER_STATUS = {
  PENDING: 'PENDING',        // Khách vừa đặt, chờ người bán xác nhận
  CONFIRMED: 'CONFIRMED',    // Người bán đã xác nhận
  PACKING: 'PACKING',        // Đang đóng gói tại kho
  SHIPPING: 'SHIPPING',      // Đã bàn giao cho đơn vị vận chuyển
  DELIVERED: 'DELIVERED',    // Đơn vị vận chuyển báo đã giao
  COMPLETED: 'COMPLETED',    // Khách xác nhận đã nhận hàng
  CANCELLED: 'CANCELLED',    // Đã hủy
  RETURNED: 'RETURNED',      // Đã trả hàng
};

const PAYMENT_STATUS = {
  UNPAID: 'UNPAID', PAID: 'PAID', PARTIAL_REFUND: 'PARTIAL_REFUND', REFUNDED: 'REFUNDED',
};

const PAYMENT_TXN_STATUS = {
  INITIATED: 'INITIATED', SUCCESS: 'SUCCESS', FAILED: 'FAILED', CANCELLED: 'CANCELLED',
};

const PAYMENT_METHOD = {
  COD: 'COD', VNPAY: 'VNPAY', MOMO: 'MOMO',
  ZALOPAY: 'ZALOPAY', BANK_TRANSFER: 'BANK_TRANSFER', CREDIT_CARD: 'CREDIT_CARD',
};

const SHIPMENT_STATUS = {
  CREATED: 'CREATED', PICKED: 'PICKED', IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED', FAILED: 'FAILED', RETURNED: 'RETURNED',
};

const INVENTORY_TX = {
  IMPORT: 'IMPORT', EXPORT: 'EXPORT', RESERVE: 'RESERVE',
  RELEASE: 'RELEASE', ADJUST: 'ADJUST', RETURN: 'RETURN',
};

const REVIEW_STATUS = { NOT_REVIEWED: 'NOT_REVIEWED', REVIEWED: 'REVIEWED' };

module.exports = {
  USER_STATUS, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TXN_STATUS,
  PAYMENT_METHOD, SHIPMENT_STATUS, INVENTORY_TX, REVIEW_STATUS,
};
