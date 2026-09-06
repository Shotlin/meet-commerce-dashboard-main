import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { loyaltyService, WalletSummary, CustomerAccount } from '../services/loyaltyService';
import { Gift, RefreshCw, AlertCircle, Award, Users, Wallet } from 'lucide-react';

export const LoyaltyPage: React.FC = () => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [walletData, usersData] = await Promise.all([
        loyaltyService.getWalletSummary(),
        loyaltyService.getCustomerAccounts(),
      ]);
      setWallet(walletData);
      setCustomers(usersData);
    } catch (err: any) {
      console.error('[LoyaltyPage] Error fetching loyalty data:', err);
      setError(err.message || 'Failed to load wallet & loyalty ledger from API (http://localhost:4500)');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-berry animate-spin mx-auto" />
        <p className="text-xs font-bold text-ink">Connecting to Live Loyalty & Wallet API (/api/v1/admin/customers)...</p>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">Unable to Load Loyalty Ledger Data</h3>
        <p className="text-xs text-status-neutral">{error}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchLoyaltyData}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Calculate live tier distributions
  const platinumCount = customers.filter((c) => c.tier === 'Platinum').length;
  const goldCount = customers.filter((c) => c.tier === 'Gold').length;
  const silverCount = customers.filter((c) => c.tier === 'Silver').length;
  const formattedPoints = wallet.totalLoyaltyPoints.toLocaleString();

  return (
    <div>
      <PageHeader
        title="Loyalty & Points Program Ledger"
        subtitle="Customer points liability ledger, tier distributions (Silver/Gold/Platinum), and accrual/redemption rules."
        badge={<Badge variant="brand" icon={<Gift className="w-3.5 h-3.5" />}>{formattedPoints} Active Points</Badge>}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchLoyaltyData}>
            Refresh API Data
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-num mb-6">
        <Card title="Total Points Liability" action={<Badge variant="brand" icon={<Wallet className="w-3 h-3" />}>Live API</Badge>}>
          <p className="text-2xl font-extrabold text-brand-berry">{formattedPoints} pts</p>
          <p className="text-xs font-sans text-status-neutral mt-1">₹{wallet.activeRewardsValue.toLocaleString()} Monetary Value</p>
        </Card>

        <Card title="Platinum Tier Accounts" action={<Badge variant="success" icon={<Award className="w-3 h-3" />}>2.5x Multiplier</Badge>}>
          <p className="text-2xl font-bold text-ink">{platinumCount} Accounts</p>
          <p className="text-xs font-sans text-status-neutral mt-1">VIP Priority Dispatch & Dedicated Account Mgr</p>
        </Card>

        <Card title="Gold & Silver Tier Accounts" action={<Badge variant="info" icon={<Users className="w-3 h-3" />}>1.0x - 1.5x Multiplier</Badge>}>
          <p className="text-2xl font-bold text-ink">{goldCount + silverCount} Accounts</p>
          <p className="text-xs font-sans text-status-neutral mt-1">{goldCount} Gold • {silverCount} Silver</p>
        </Card>
      </div>

      {/* Customer Loyalty Ledger Table */}
      <Card title="Customer Loyalty Tier Accounts" subtitle="Active customer accounts with tier ranking and wallet balances">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-status-neutral uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Tier Ranking</th>
                <th className="py-2.5 px-3">Lifetime Spend</th>
                <th className="py-2.5 px-3">Orders Count</th>
                <th className="py-2.5 px-3">Wallet Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-rose-50/40">
                  <td className="py-2.5 px-3 font-bold text-ink">{c.name}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={c.tier === 'Platinum' ? 'brand' : c.tier === 'Gold' ? 'warning' : 'neutral'}>
                      {c.tier} Tier
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-ink">₹{c.spend.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono-num text-status-neutral">{c.ordersCount} orders</td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-brand-berry">₹{c.walletBalance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
