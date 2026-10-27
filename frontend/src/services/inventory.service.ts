import apiClient from './api-client';
import type { InventorySummary, RestockRequest } from '@/types';

export const inventoryService = {
  async getInventory(): Promise<InventorySummary> {
    try {
      const res = await apiClient.get('/inventory');
      return res.data;
    } catch {
      return {
        totalSku: 0,
        totalStockItems: 0,
        totalStockValue: 0,
        lowStockAlertCount: 0,
        items: [],
      };
    }
  },

  async restock(data: RestockRequest): Promise<boolean> {
    try {
      const res = await apiClient.post('/inventory/restock', data);
      return res.data?.success ?? true;
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },
};
