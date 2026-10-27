import apiClient from './api-client';
import type { IncomeSummary } from '@/types';

export const statisticsService = {
  async getIncomeStats(): Promise<IncomeSummary> {
    try {
      const res = await apiClient.get('/statistics/income');
      return res.data;
    } catch {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalOrders: 0,
        growthPercent: 0,
        monthlyMatrix: [],
        recentTransactions: [],
      };
    }
  },
};
