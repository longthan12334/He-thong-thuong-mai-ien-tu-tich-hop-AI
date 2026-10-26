import apiClient from './api-client';
import type { IncomeSummary } from '@/types';

export const statisticsService = {
  async getIncomeStats(): Promise<IncomeSummary> {
    const res = await apiClient.get('/statistics/income');
    return res.data;
  },
};
