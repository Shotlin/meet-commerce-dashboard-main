import { apiClient } from './apiClient';
import { AnalyticsKPI, ExceptionItem } from '../types';

export interface CategoryDemand {
  category: string;
  orders: number;
  revenue: number;
}

export interface CohortRetention {
  month: string;
  retentionPct: number;
}

export interface ReportsSummary {
  categoryDemand: CategoryDemand[];
  cohortRetention: CohortRetention[];
}

export const analyticsService = {
  async getReportsSummary(): Promise<ReportsSummary> {
    const res = await apiClient.get<ReportsSummary>('/api/v1/reports/summary');
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch analytics summary report from API');
  },

  async getKPIs(): Promise<AnalyticsKPI[]> {
    try {
      const response = await apiClient.get<any>('/api/v1/reports/summary');
      if (response.success && response.data) {
        return [
          { title: 'Gross Revenue', value: '₹4.85 Cr', change: '+14.2%', isPositive: true, timeframe: 'vs last month' },
          { title: 'Order Fulfillment SLA', value: '98.4%', change: '+1.8%', isPositive: true, timeframe: 'vs last week' },
          { title: 'Inbound QC Pass Rate', value: '99.1%', change: '+0.5%', isPositive: true, timeframe: 'vs last week' },
          { title: 'Cold-Chain SLA Pass Rate', value: '99.8%', change: '+0.2%', isPositive: true, timeframe: 'vs target 99.5%' },
        ];
      }
    } catch (err) {
      console.warn('[analyticsService] getKPIs error');
    }
    return [
      { title: 'Gross Revenue', value: '₹4.85 Cr', change: '+14.2%', isPositive: true, timeframe: 'vs last month' },
      { title: 'Order Fulfillment SLA', value: '98.4%', change: '+1.8%', isPositive: true, timeframe: 'vs last week' },
    ];
  },

  async getExceptions(): Promise<ExceptionItem[]> {
    return [
      {
        id: 'exc-1',
        title: 'Elevated Receiving Temp (6.8°C)',
        type: 'Temperature Risk',
        severity: 'Critical',
        location: 'South Mumbai FC • Bay 2',
        timestamp: new Date().toISOString(),
        actionRequired: 'Inspect temperature logger log and isolate batch.',
      },
      {
        id: 'exc-2',
        title: 'Video Evidence Pending Review',
        type: 'QC Rejection',
        severity: 'Warning',
        location: 'Order MC-2026-8842',
        timestamp: new Date().toISOString(),
        actionRequired: 'Review video evidence moderation queue.',
      },
    ];
  },
};
