/** Order Type Definitions — camelCase thống nhất */

export interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  specs: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface TimelineItem {
  title: string;
  desc: string;
  time: string;
  status: 'done' | 'current' | 'pending';
}

export interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  placedDateText?: string;
  carrier: string;
  trackingCode: string;
  estimatedDelivery: string;
  lastUpdateLocation?: string;
  lastUpdate?: string;
  lastLocation?: string;
  progressStep: number;
  progressDates?: {
    ordered: string;
    confirmed: string;
    shipped: string;
    delivered: string;
  };
  timeline?: TimelineItem[];
  items: OrderItem[];
  subtotal: number;
  shippingCharge: number;
  taxes: number;
  discount: number;
  totalAmount: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  items: {
    productId: number;
    specs: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: number;
  location?: string;
}

export type UpdateOrderStatus = UpdateOrderStatusRequest;

/** Enum chuẩn trạng thái đơn hàng (đồng bộ với backend SQLite C# OrderStatus) */
export enum OrderStatusEnum {
  Pending = 1,
  Confirmed = 2,
  Processing = 3,
  Shipped = 4,
  Delivered = 5,
  Cancelled = 6,
}

/** Bảng ánh xạ nhãn hiển thị, màu sắc và key trạng thái đơn hàng */
export const ORDER_STATUS_MAP: Record<number, { key: string; label: string; color: string; badgeClass: string }> = {
  [OrderStatusEnum.Pending]: {
    key: 'Pending',
    label: 'Chờ xác nhận',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  [OrderStatusEnum.Confirmed]: {
    key: 'Confirmed',
    label: 'Đã xác nhận',
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  [OrderStatusEnum.Processing]: {
    key: 'Processing',
    label: 'Đang xử lý',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  [OrderStatusEnum.Shipped]: {
    key: 'Shipped',
    label: 'Đang vận chuyển',
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  [OrderStatusEnum.Delivered]: {
    key: 'Delivered',
    label: 'Đã giao hàng',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  [OrderStatusEnum.Cancelled]: {
    key: 'Cancelled',
    label: 'Đã hủy',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

