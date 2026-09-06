import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Tabs } from '../components/common/Tabs';
import { Table, Column } from '../components/common/Table';
import { CustomerProfileDrawer } from '../components/customers/CustomerProfileDrawer';
import { queryKeys } from '../services/queryKeys';
import { customerService, CustomerListRow, LtvRow, ChurnedRow, VipRow } from '../services/customerService';
import { Users } from 'lucide-react';

type CrmTab = 'all' | 'ltv' | 'vip' | 'churned';

export const CRMPage: React.FC = () => {
  const [tab, setTab] = useState<CrmTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allQuery = useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: () => customerService.getCustomers(),
    enabled: tab === 'all',
  });
  const ltvQuery = useQuery({
    queryKey: queryKeys.customers.ltv(),
    queryFn: customerService.getLTV,
    enabled: tab === 'ltv',
  });
  const vipQuery = useQuery({
    queryKey: queryKeys.customers.vip(),
    queryFn: () => customerService.getVIP(),
    enabled: tab === 'vip',
  });
  const churnedQuery = useQuery({
    queryKey: queryKeys.customers.churned(),
    queryFn: () => customerService.getChurned(),
    enabled: tab === 'churned',
  });

  const allColumns: Column<CustomerListRow>[] = [
    { header: 'Customer', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral">{row.phone}</p></div> },
    { header: 'Orders', accessorKey: 'order_count', isMono: true },
    { header: 'Spend', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.total_spent.toFixed(2)}</span> },
    { header: 'Wallet', cell: (row) => <span className="font-mono-num">₹{row.wallet_balance.toFixed(2)}</span> },
    { header: 'Status', cell: (row) => <Badge variant={row.is_blocked ? 'danger' : row.is_active ? 'success' : 'neutral'}>{row.is_blocked ? 'Blocked' : row.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  const ltvColumns: Column<LtvRow>[] = [
    { header: 'Customer', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral">{row.phone}</p></div> },
    { header: 'LTV', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.ltv.toFixed(2)}</span> },
    { header: 'Orders', accessorKey: 'order_count', isMono: true },
    { header: 'Avg Order', cell: (row) => <span className="font-mono-num">₹{row.avg_order_value.toFixed(2)}</span> },
    { header: 'Customer Since', cell: (row) => <span className="font-mono-num">{row.days_since_signup}d ago</span> },
  ];

  const vipColumns: Column<VipRow>[] = [
    { header: 'Customer', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral">{row.phone}</p></div> },
    { header: 'Orders', accessorKey: 'order_count', isMono: true },
    { header: 'Spend', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.total_spent.toFixed(2)}</span> },
    { header: 'Loyalty Points', accessorKey: 'loyalty_points', isMono: true },
    { header: 'Wallet', cell: (row) => <span className="font-mono-num">₹{row.wallet_balance.toFixed(2)}</span> },
  ];

  const churnedColumns: Column<ChurnedRow>[] = [
    { header: 'Customer', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral">{row.phone}</p></div> },
    { header: 'Past Orders', accessorKey: 'order_count', isMono: true },
    { header: 'Total Spent', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.total_spent.toFixed(2)}</span> },
    { header: 'Last Order', cell: (row) => <span className="text-[11px] text-status-neutral">{new Date(row.last_order_at).toLocaleDateString('en-IN')}</span> },
  ];

  const activeQuery = tab === 'all' ? allQuery : tab === 'ltv' ? ltvQuery : tab === 'vip' ? vipQuery : churnedQuery;
  const count = tab === 'all' ? (allQuery.data?.pagination.total ?? 0) : (activeQuery.data as any[])?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="CRM & Customer Accounts"
        subtitle="Customer cohorts, order histories, wallet balances, and lifetime value."
        badge={<Badge variant="brand" icon={<Users className="w-3.5 h-3.5" />}>{count} Customers</Badge>}
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'All Customers' },
          { id: 'ltv', label: 'Top LTV' },
          { id: 'vip', label: 'VIP' },
          { id: 'churned', label: 'Churned' },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as CrmTab)}
      />

      {activeQuery.error ? (
        <p className="text-xs text-status-danger p-3">{(activeQuery.error as Error).message}</p>
      ) : tab === 'all' ? (
        <Table columns={allColumns} data={allQuery.data?.customers ?? []} keyExtractor={(r) => r.id} isLoading={allQuery.isLoading} onRowClick={(r) => setSelectedId(r.id)} emptyText="No customers found." />
      ) : tab === 'ltv' ? (
        <Table columns={ltvColumns} data={ltvQuery.data ?? []} keyExtractor={(r) => r.id} isLoading={ltvQuery.isLoading} onRowClick={(r) => setSelectedId(r.id)} emptyText="No LTV data yet." />
      ) : tab === 'vip' ? (
        <Table columns={vipColumns} data={vipQuery.data ?? []} keyExtractor={(r) => r.id} isLoading={vipQuery.isLoading} onRowClick={(r) => setSelectedId(r.id)} emptyText="No VIP customers yet (10+ delivered orders)." />
      ) : (
        <Table columns={churnedColumns} data={churnedQuery.data ?? []} keyExtractor={(r) => r.id} isLoading={churnedQuery.isLoading} onRowClick={(r) => setSelectedId(r.id)} emptyText="No churned customers." />
      )}

      <CustomerProfileDrawer customerId={selectedId} open={!!selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};
