import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../components/layout/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table, type Column } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/states/EmptyState';
import { useSupplyOrders } from '../hooks/useProcurement';
import { formatDateTime, formatMoney, supplyStatusBadge } from '../utils/procurementStatus';
import type { SupplyOrder } from '../types/procurement.types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'VIDEO_SUBMITTED', label: 'Video Submitted' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED_PENDING_RECEIPT', label: 'Pending Receipt' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function SupplyOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const { data, isLoading } = useSupplyOrders({
    search: search || undefined,
    status: status || undefined,
  });

  const columns = useMemo<Column<SupplyOrder>[]>(
    () => [
      {
        header: 'Supply order',
        accessorKey: 'supply_number',
        isMono: true,
        cell: (row) => (
          <div>
            <div className="text-xs font-bold text-ink">{row.supply_number}</div>
            <div className="text-[11px] text-muted">{row.request_number}</div>
          </div>
        ),
      },
      { header: 'Vendor', accessorKey: 'vendor_name' },
      { header: 'Store', cell: (row) => `${row.shop_name ?? '—'} · ${row.shop_city ?? ''}` },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (row) => {
          const badge = supplyStatusBadge(row.status);
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        header: 'Items',
        cell: (row) =>
          (row.item_summary ?? [])
            .map((item) => `${Number(item.agreed_quantity)} ${item.unit} ${item.item_name}`)
            .join(' | ') || '—',
      },
      { header: 'Value', cell: (row) => formatMoney(row.award_amount) },
      {
        header: 'Video',
        cell: (row) =>
          row.has_evidence ? <Badge variant="success">Submitted</Badge> : <Badge variant="warning">Required before packing</Badge>,
      },
      { header: 'Promised', cell: (row) => formatDateTime(row.promised_delivery_at) },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Supply Orders"
        subtitle="Active vendor fulfilment — processing, evidence, dispatch and receipt"
        badge={<Badge variant="brand">{data?.total ?? 0} total</Badge>}
      />

      <FilterBar
        searchQuery={search}
        onSearchChange={(q) => {
          const next = new URLSearchParams(searchParams);
          if (q) next.set('q', q);
          else next.delete('q');
          setSearchParams(next, { replace: true });
        }}
        statusFilter={status}
        onStatusChange={(value) => {
          const next = new URLSearchParams(searchParams);
          if (value) next.set('status', value);
          else next.delete('status');
          setSearchParams(next, { replace: true });
        }}
        statusOptions={STATUS_OPTIONS}
      />

      <Card padding="none">
        {data && data.supplies.length === 0 && !isLoading ? (
          <div className="p-6">
            <EmptyState
              title="No supply orders yet"
              description="Supply orders appear here after a fixed offer is accepted or an RFQ quote is awarded."
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={data?.supplies ?? []}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyText="No supply orders found"
            onRowClick={(row) => navigate(`/procurement/supplies/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
