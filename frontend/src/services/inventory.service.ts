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
    await apiClient.post('/inventory/restock', data);
    return true;
  },
};
