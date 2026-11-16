import apiClient from './api-client';
import type { Order, UpdateOrderStatus, CreateOrderRequest } from '@/types';

export const orderService = {
  async getOrders(status?: string): Promise<Order[]> {
    try {
      const res = await apiClient.get('/orders', { params: { status } });
      return res.data;
    } catch {
      return [];
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

  async getMyOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders');
    return res.data;
  },

  async cancelMyOrder(id: number): Promise<Order> {
    const res = await apiClient.patch(`/orders/${id}/cancel`);
    return res.data;
  },

  /** [Customer] Xác nhận đã nhận được hàng */
  async confirmReceived(id: number): Promise<Order> {
    const res = await apiClient.patch(`/orders/${id}/confirm-received`);
    return res.data;
  },

  async updateOrderStatus(id: number, data: UpdateOrderStatus): Promise<Order> {
    const res = await apiClient.patch(`/orders/${id}/status`, data);
    return res.data;
  },
};
