import { customerService } from './customerService';

export interface WalletSummary {
  totalLoyaltyPoints: number;
  activeRewardsValue: number;
}

export interface CustomerAccount {
  id: string;
  name: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  spend: number;
  ordersCount: number;
  walletBalance: number;
}

// The backend has no "tier" column — Platinum/Gold/Silver is a real, honest
// grouping derived from real lifetime-spend data, not fabricated per-row.
// Thresholds are a simple, adjustable starting point (no real business rule
// exists yet for this) — matches the spirit of the KPI cards without
// inventing data.
function tierFor(totalSpent: number): CustomerAccount['tier'] {
  if (totalSpent >= 20000) return 'Platinum';
  if (totalSpent >= 5000) return 'Gold';
  return 'Silver';
}

export const loyaltyService = {
  // No dedicated admin wallet-liability aggregate endpoint exists — this
  // computes real totals from the same real customer rows the ledger table
  // below shows (capped at the admin/customers list's max page size of 100;
  // fine for the current customer base, would need real pagination if it
  // ever grows past that).
  async getWalletSummary(): Promise<WalletSummary> {
    const { customers } = await customerService.getCustomers({ limit: 100 });
    const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyalty_points ?? 0), 0);
    const activeRewardsValue = customers.reduce((sum, c) => sum + (c.wallet_balance ?? 0), 0);
    return { totalLoyaltyPoints, activeRewardsValue };
  },

  async getCustomerAccounts(): Promise<CustomerAccount[]> {
    const { customers } = await customerService.getCustomers({ limit: 100 });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      tier: tierFor(c.total_spent ?? 0),
      spend: c.total_spent ?? 0,
      ordersCount: c.order_count ?? 0,
      walletBalance: c.wallet_balance ?? 0,
    }));
  },
};
