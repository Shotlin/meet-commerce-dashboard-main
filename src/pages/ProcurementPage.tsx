import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table, type Column } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/states/EmptyState';
import { useProcurementRequests } from '../hooks/useProcurement';
import { MODE_LABEL, formatDateTime, formatMoney, requestStatusBadge } from '../utils/procurementStatus';
import type { ProcurementRequestListRow } from '../types/procurement.types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'IN_FULFILMENT', label: 'In Fulfilment' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
];

const MODE_OPTIONS = [
  { value: '', label: 'All modes' },
  { value: 'FIXED_OFFER', label: 'Fixed Offer' },
  { value: 'RFQ', label: 'RFQ' },
];

export default function ProcurementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const mode = searchParams.get('mode') ?? '';

  const { data, isLoading } = useProcurementRequests({
    search: search || undefined,
    status: status || undefined,
    mode: mode || undefined,
  });

  const columns = useMemo<Column<ProcurementRequestListRow>[]>(() => {
    const cols: Column<ProcurementRequestListRow>[] = [
      {
        header: 'Request',
        accessorKey: 'request_number',
        isMono: true,
        cell: (row) => (
          <div>
            <div className="text-xs font-bold text-ink">{row.request_number}</div>
            <div className="text-[11px] text-muted">{row.title}</div>
          </div>
        ),
      },
      { header: 'Store', accessorKey: 'shop_name' },
      {
        header: 'Mode',
        accessorKey: 'mode',
        cell: (row) => <Badge variant={row.mode === 'FIXED_OFFER' ? 'brand' : 'info'}>{MODE_LABEL[row.mode]}</Badge>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (row) => {
          const badge = requestStatusBadge(row.status);
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        header: 'Recipients',
        accessorKey: 'recipient_count',
        cell: (row) => `${row.responded_count ?? 0}/${row.recipient_count ?? 0} responded`,
      },
      { header: 'Required by', cell: (row) => formatDateTime(row.required_delivery_at) },
      { header: 'Award value', cell: (row) => formatMoney(row.award_total ?? row.offer_total) },
      { header: 'Awarded to', cell: (row) => row.awarded_vendor_name ?? '—' },
    ];
    return cols;
  }, []);

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="Store purchase requirements, vendor quotes and supply tracking"
        badge={<Badge variant="brand">{data?.total ?? 0} total</Badge>}
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/procurement/new')}>
            Create Requirement
          </Button>
        }
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
        extraActions={
          <select
            value={mode}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('mode', e.target.value);
              else next.delete('mode');
              setSearchParams(next, { replace: true });
            }}
            className="px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none"
            aria-label="Filter by mode"
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
        onRefresh={() => window.location.reload()}
      />

      <Card padding="none">
        {data && data.requests.length === 0 && !isLoading ? (
          <div className="p-6">
            <EmptyState
              title="No procurement requirements yet"
              description="Create a requirement to publish stock needs to eligible vendors."
              actionText="Create Requirement"
              onAction={() => navigate('/procurement/new')}
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={data?.requests ?? []}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyText="No requirements found"
            onRowClick={(row) => navigate(`/procurement/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
