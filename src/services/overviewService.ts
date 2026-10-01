import { apiClient } from './apiClient';
import type { OverviewData, OverviewQuery } from '../types/overview.types';

export const overviewService = {
  async getOverview(q: OverviewQuery): Promise<OverviewData> {
    const params: Record<string, string> = { range: q.range };
    if (q.range === 'custom' && q.from && q.to) {
      params.from = q.from;
      params.to = q.to;
    }
    if (q.shopId) params.shopId = q.shopId;
    if (q.pincode) params.pincode = q.pincode;
    const res = await apiClient.get<OverviewData>('/api/v1/admin/overview', params);
    return res.data as OverviewData;
  },
};
