import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { Tabs } from '../components/common/Tabs';
import { CreateReturnModal } from '../components/domain/CreateReturnModal';
import { ReturnDetailDrawer } from '../components/domain/ReturnDetailDrawer';
import { queryKeys } from '../services/queryKeys';
import { returnRequestService, ReturnRequest, ReturnStatus } from '../services/returnRequestService';

type FilterTab = 'ALL' | ReturnStatus;

export const ReturnsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.returns.list({ status: filter === 'ALL' ? undefined : filter }),
    queryFn: () => returnRequestService.list({ status: filter === 'ALL' ? undefined : filter, limit: 50 }),
  });

  const rows = data?.rows ?? [];

  const columns: Column<ReturnRequest>[] = [
    { header: 'Order', cell: (row) => (
      <div>
        <p className="font-bold text-ink">{row.order_number}</p>
        <p className="text-[11px] text-status-neutral">{row.customer_name ?? row.customer_phone}</p>
      </div>
    ) },
    { header: 'Scope', cell: (row) => <Badge variant="brand" size="sm">{row.scope === 'FULL_ORDER' ? 'Full Order' : 'Items'}</Badge> },
    { header: 'Amount', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{Number(row.computed_amount).toFixed(2)}</span> },
    { header: 'Destination', cell: (row) => <span className="text-xs">{row.refund_destination === 'WALLET' ? 'Wallet' : 'Razorpay'}</span> },
    { header: 'Status', cell: (row) => (
      <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : row.status === 'CANCELLED' ? 'neutral' : 'warning'} size="sm">
        {row.status}
      </Badge>
    ) },
    { header: 'Filed', cell: (row) => <span className="text-[11px] text-status-neutral">{new Date(row.created_at).toLocaleDateString('en-IN')}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Returns & Refunds"
        subtitle="Admin-mediated return requests — file a return on a customer's behalf, then approve to trigger a real refund."
        badge={<Badge variant="brand" icon={<RotateCcw className="w-3.5 h-3.5" />}>{data?.pagination.total ?? 0} Total</Badge>}
        actions={<Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCreateOpen(true)}>New Return</Button>}
      />

      <Tabs
        tabs={[
          { id: 'ALL', label: 'All' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ]}
        activeTab={filter}
        onChange={(id) => setFilter(id as FilterTab)}
      />

      {error ? (
        <p className="text-xs text-status-danger p-3">{(error as Error).message}</p>
      ) : (
        <Table columns={columns} data={rows} keyExtractor={(r) => r.id} isLoading={isLoading} onRowClick={(r) => setSelectedId(r.id)} emptyText="No return requests." />
      )}

      <CreateReturnModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <ReturnDetailDrawer returnId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};
