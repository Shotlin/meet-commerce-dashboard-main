import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { AddStoreModal } from '../components/domain/AddStoreModal';
import { queryKeys } from '../services/queryKeys';
import { shopManagementService, Shop } from '../services/shopManagementService';
import { Plus, Store } from 'lucide-react';

export const ShopsPage: React.FC = () => {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: queryKeys.shops.list(),
    queryFn: shopManagementService.getShops,
  });

  const columns: Column<Shop>[] = [
    { header: 'Shop', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral font-mono-num">{row.branch_code}</p></div> },
    { header: 'Location', cell: (row) => <span>{row.city}, {row.state}</span> },
    { header: 'Orders', accessorKey: 'total_orders', isMono: true },
    { header: 'Revenue', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{Number(row.total_revenue).toFixed(2)}</span> },
    { header: 'Commission', cell: (row) => <span className="font-mono-num">{Number(row.commission_rate).toFixed(1)}%</span> },
    { header: 'Status', cell: (row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Shops, Warehouses & Staff Scope"
        subtitle="Physical FC location management, staff shift assignments, coverage radius, and opening hours."
        badge={<Badge variant="brand" icon={<Store className="w-3.5 h-3.5" />}>{shops.length} Active FC Hubs</Badge>}
        actions={<Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddOpen(true)}>Add Store</Button>}
      />

      {error ? (
        <p className="text-xs text-status-danger p-3">{(error as Error).message}</p>
      ) : (
        <Table columns={columns} data={shops} keyExtractor={(r) => r.id} isLoading={isLoading} onRowClick={(r) => navigate(`/shops/${r.id}`)} emptyText="No shops found." />
      )}

      <AddStoreModal isOpen={addOpen} onClose={() => setAddOpen(false)} onCreated={(shop) => { setAddOpen(false); navigate(`/shops/${shop.id}`); }} />
    </div>
  );
};
