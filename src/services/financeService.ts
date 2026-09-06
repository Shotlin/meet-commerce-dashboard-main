import { FinanceSummary } from '../types';
import { apiClient } from './apiClient';

// The backend has no single platform-wide finance summary endpoint — finance
// is modeled per-shop (/api/v1/admin/finance/financials, one row per shop
// per period). Adapt by summing across periods into the dashboard's shape.
const adaptFinance = (periods: any[]): FinanceSummary => {
  const gmv = periods.reduce((sum, p) => sum + Number(p.total_revenue ?? p.gross_revenue ?? 0), 0);
  const netRevenue = periods.reduce((sum, p) => sum + Number(p.net_revenue ?? 0), 0);
  const platformFees = periods.reduce((sum, p) => sum + Number(p.commission_amount ?? p.platform_commission ?? 0), 0);
  const refundsTotal = periods.reduce((sum, p) => sum + Number(p.refund_amount ?? 0), 0);
  const pendingSettlements = periods.filter((p) => p.payout_status === 'PENDING' || p.payout_status === 'PROCESSING').length;

  return {
    gmv,
    netRevenue,
    platformFees,
    refundsTotal,
    payoutHealth: pendingSettlements > 0 ? 'Review Required' : 'Optimal',
    pendingSettlements,
    recentSettlements: periods.map((p) => ({
      id: p.id,
      vendorName: p.shop_name || 'Vendor Partner',
      amount: Number(p.payout_amount ?? 0),
      period: `${new Date(p.period_start).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })} - ${new Date(p.period_end).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}`,
      status: p.payout_status === 'PAID' ? 'Settled' : p.payout_status === 'PROCESSING' ? 'Processing' : 'On Hold',
      processedAt: p.paid_at || p.updated_at || '',
    })),
  };
};

export const financeService = {
  async getFinanceSummary(): Promise<FinanceSummary> {
    const response = await apiClient.get<any>('/api/v1/admin/finance/financials?limit=50');
    if (response.success && response.data) {
      const periods = Array.isArray(response.data.financials) ? response.data.financials : [];
      return adaptFinance(periods);
    }
    throw new Error('Failed to fetch finance summary from API');
  },
};
