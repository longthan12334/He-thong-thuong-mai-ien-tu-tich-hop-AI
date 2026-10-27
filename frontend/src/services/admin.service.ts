import apiClient from './api-client';
import type {
  AdminDashboardStats,
  AdminSeller,
  AdminSellerListResponse,
  AdminSellerStatusUpdatePayload,
  AdminUser,
  AdminUserListResponse,
  AdminUserStatusUpdatePayload,
  AdminProduct,
  AdminProductListResponse,
  AdminProductStatusUpdatePayload,
  AdminPayout,
  AdminPayoutActionPayload,
  PlatformSettings,
} from '@/types/admin.types';

export const adminService = {
  // 1. Dashboard & Sellers
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

  // 2. Quản lý người dùng toàn sàn (Task 9, 10, 11)
  async getUsers(params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminUserListResponse> {
    const res = await apiClient.get<AdminUserListResponse>('/admin/users', {
      params,
    });
    return res.data;
  },

  async updateUserStatus(
    id: number,
    payload: AdminUserStatusUpdatePayload
  ): Promise<{ success: boolean; message: string; data: AdminUser }> {
    const res = await apiClient.put(`/admin/users/${id}/status`, payload);
    return res.data;
  },

  // 3. Kiểm duyệt sản phẩm toàn sàn (Task 15)
  async getProducts(params?: {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminProductListResponse> {
    const res = await apiClient.get<AdminProductListResponse>('/admin/products', {
      params,
    });
    return res.data;
  },

  async updateProductStatus(
    id: number,
    payload: AdminProductStatusUpdatePayload
  ): Promise<{ success: boolean; message: string; data: AdminProduct }> {
    const res = await apiClient.put(`/admin/products/${id}/status`, payload);
    return res.data;
  },

  // 4. Đối soát & duyệt lệnh rút tiền (Task 20)
  async getPayouts(params?: { status?: string }): Promise<AdminPayout[]> {
    const res = await apiClient.get<AdminPayout[]>('/admin/payouts', {
      params,
    });
    return res.data;
  },

  async processPayout(
    id: number,
    payload: AdminPayoutActionPayload
  ): Promise<{ success: boolean; message: string; data: AdminPayout }> {
    const res = await apiClient.post(`/admin/payouts/${id}/process`, payload);
    return res.data;
  },

  // 5. Cấu hình sàn & hoa hồng (Task 19)
  async getSettings(): Promise<PlatformSettings> {
    const res = await apiClient.get<PlatformSettings>('/admin/settings');
    return res.data;
  },

  async updateSettings(
    payload: PlatformSettings
  ): Promise<{ success: boolean; message: string; data: PlatformSettings }> {
    const res = await apiClient.put('/admin/settings', payload);
    return res.data;
  },
};
