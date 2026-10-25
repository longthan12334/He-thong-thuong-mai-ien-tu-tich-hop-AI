import apiClient from './api-client';
import type { Order, UpdateOrderStatus, CreateOrderRequest } from '@/types';
import { fallbackOrders } from '@/lib/mock-data';

export const orderService = {
  async getOrders(status?: string): Promise<Order[]> {
    try {
      const res = await apiClient.get('/orders', { params: { status } });
      return res.data;
    } catch {
      return fallbackOrders;
    }
  },

  async getOrderById(id: number): Promise<Order> {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },

  async getOrderByCode(orderCode: string): Promise<Order> {
    const res = await apiClient.get(`/orders/code/${orderCode}`);
    return res.data;
  },

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },

  async getVnpayUrl(orderId: number, returnUrl?: string): Promise<string> {
    const res = await apiClient.post(`/orders/${orderId}/vnpay-url`, { returnUrl });
    return res.data.paymentUrl;
  },

  /**
   * [Customer] Đơn hàng của khách đang đăng nhập.
   * Backend tự lọc theo UserId khi role = Customer. Không dùng dữ liệu mẫu dự phòng
   * để khách không nhìn thấy đơn hàng không phải của mình.
   */
  async getMyOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders');
    return res.data;
  },

  /** [Customer] Hủy đơn của chính mình khi đơn còn Chờ xác nhận */
  async cancelMyOrder(id: number): Promise<Order> {
    const res = await apiClient.patch(`/orders/${id}/cancel`);
    return res.data;
  },

  async updateOrderStatus(id: number, data: UpdateOrderStatus): Promise<Order> {
    try {
      const res = await apiClient.patch(`/orders/${id}/status`, data);
      return res.data;
    } catch {
      const order = fallbackOrders.find(o => o.id === id);
      if (order) order.status = data.status.toString();
      return order || fallbackOrders[0];
    }
  },
};

