import apiClient from './api-client';
import type {
  AdminDashboardStats,
  AdminSeller,
  AdminSellerListResponse,
  AdminSellerStatusUpdatePayload,
} from '@/types/admin.types';

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard-stats');
    return res.data;
  },

  async getSellers(params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminSellerListResponse> {
    const res = await apiClient.get<AdminSellerListResponse>('/admin/sellers', {
      params,
    });
    return res.data;
  },

  async getSellerById(id: number): Promise<AdminSeller> {
    const res = await apiClient.get<AdminSeller>(`/admin/sellers/${id}`);
    return res.data;
  },

  async updateSellerStatus(
    id: number,
    payload: AdminSellerStatusUpdatePayload
  ): Promise<{ success: boolean; message: string; data: AdminSeller }> {
    const res = await apiClient.put(`/admin/sellers/${id}/status`, payload);
    return res.data;
  },
};
