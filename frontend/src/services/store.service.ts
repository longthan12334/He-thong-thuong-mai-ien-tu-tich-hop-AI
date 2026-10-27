import apiClient from './api-client';
import type { StoreBoutique, StoreBrandProfile, UpdateStoreRequest } from '@/types/store.types';

export const storeService = {
  async getStores(brand?: string): Promise<StoreBoutique[]> {
    try {
      const res = await apiClient.get<StoreBoutique[]>('/stores', {
        params: brand ? { brand } : undefined,
      });
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getStoreProfile(brandOrSellerId: string): Promise<StoreBrandProfile | null> {
    try {
      const res = await apiClient.get<StoreBrandProfile>(`/stores/profile/${encodeURIComponent(brandOrSellerId)}`);
      return res.data || null;
    } catch {
      return null;
    }
  },

  async getStoreByCode(storeCode: string): Promise<StoreBoutique | null> {
    try {
      const res = await apiClient.get<StoreBoutique>(`/stores/${encodeURIComponent(storeCode)}`);
      return res.data || null;
    } catch {
      return null;
    }
  },

  async updateStore(storeCode: string, payload: UpdateStoreRequest): Promise<StoreBoutique | null> {
    try {
      const res = await apiClient.put<StoreBoutique>(`/stores/${encodeURIComponent(storeCode)}`, payload);
      return res.data || null;
    } catch {
      return null;
    }
  },
};
