/**
 * Hằng số dùng chung toàn ứng dụng — nguồn dữ liệu duy nhất
 * Thay thế tất cả hardcoded values rải rác trong các page files
 */

export const APP_NAME = 'Aethelgard Shopping Mall';
export const APP_SHORT_NAME = 'Aethelgard Mall';

/** Cấu hình API */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const API_TIMEOUT = 10000;

/** Khóa lưu trữ localStorage */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'aethelgard_token',
  AUTH_USER: 'aethelgard_user',
  REDIRECT_PATH: 'redirect_after_login',
  STOCK_AUDIT: 'AETHELGARD_STOCK_AUDIT_LOG',
  SHOP_HERO_TITLE: 'AETHELGARD_SHOP_HERO_TITLE',
  SHOP_HERO_SUB: 'AETHELGARD_SHOP_HERO_SUB',
  SHOP_VIEWS: 'AETHELGARD_SHOP_VIEWS',
} as const;

/** Routes — dùng cho navigation, redirect, guards */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SELLER: {
    DASHBOARD: '/',
    PRODUCTS: '/',
    INVENTORY: '/inventory',
    ORDERS: '/orders',
    INCOME: '/income-statistics',
    VOUCHERS: '/vouchers',
    TRANSACTIONS: '/transactions',
    SHOP_PROFILE: '/shop-profile',
  },
} as const;

/** Liên kết điều hướng của Seller */
export const SELLER_NAV_LINKS = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Đơn hàng', href: '/orders' },
  { name: 'Tồn kho', href: '/inventory' },
  { name: 'Doanh thu', href: '/income-statistics' },
  { name: 'Mã giảm giá', href: '/vouchers' },
  { name: 'Giao dịch', href: '/transactions' },
  { name: 'Hồ sơ shop', href: '/shop-profile' },
] as const;

/** Hằng số trạng thái đơn hàng (Item 25) */
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ Xác Nhận',
  CONFIRMED: 'Đã Xác Nhận',
  PROCESSING: 'Đang Xử Lý',
  SHIPPED: 'Đang Vận Chuyển',
  DELIVERED: 'Đã Giao',
  CANCELLED: 'Đã Hủy',
};

/** Trạng thái tồn kho */
export const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

/** Danh sách ảnh mẫu dùng chung (Item 26) */
export const SAMPLE_PRODUCT_IMAGES = [
  '/img/products/gucci-sneaker.jpg',
  '/img/products/gucci-runway.jpg',
  '/img/products/adidas-samba.jpg',
  '/img/products/adidas-sakura-hoodie.jpg',
  '/img/products/sample-velora.jpg',
  '/img/products/gucci-collection.jpg',
] as const;

/** Hằng số chuỗi sự kiện SignalR dùng chung (Item 30) */
export const SIGNALR_EVENTS = {
  RECEIVE_ORDER_CREATED: 'ReceiveOrderCreated',
  RECEIVE_ORDER_STATUS_UPDATED: 'ReceiveOrderStatusUpdated',
  RECEIVE_PAYMENT_CONFIRMED: 'ReceivePaymentConfirmed',
} as const;

/** Pagination */
export const DEFAULT_PAGE_SIZE = 12;

/** Ảnh dự phòng */
export const FALLBACK_IMAGE = '/img/products/adidas-samba.jpg';
