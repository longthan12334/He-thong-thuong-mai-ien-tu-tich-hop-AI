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

/** Danh sách ảnh mẫu dùng chung (Item 26) — 100% ảnh studio chính hãng Cloudinary */
export const SAMPLE_PRODUCT_IMAGES = [
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/262451M134047_1.jpg',
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/261553M202012_1.jpg',
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/262011M236006_1.jpg',
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/262802M178002_1.jpg',
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/262314M243000_1.jpg',
  'https://res.cloudinary.com/ssenseweb/image/upload/b_white,c_lpad,g_south,h_1080,w_1080/c_scale,h_480/f_auto,q_auto/262376M180001_1.jpg',
] as const;

/** Hằng số chuỗi sự kiện SignalR dùng chung (Item 30) */
export const SIGNALR_EVENTS = {
  RECEIVE_ORDER_CREATED: 'ReceiveOrderCreated',
  RECEIVE_ORDER_STATUS_UPDATED: 'ReceiveOrderStatusUpdated',
  RECEIVE_PAYMENT_CONFIRMED: 'ReceivePaymentConfirmed',
} as const;

/** Pagination */
export const DEFAULT_PAGE_SIZE = 12;

/** Ảnh dự phòng — Sử dụng ảnh moodboard thời trang nội bộ luôn tồn tại */
export const FALLBACK_IMAGE = '/img/products/fashion-mood-board.jpg';
