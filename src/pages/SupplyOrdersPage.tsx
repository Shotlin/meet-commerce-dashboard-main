import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackageCheck, Plus } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table, type Column } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/states/EmptyState';
import { useSupplyOrders } from '../hooks/useProcurement';
import {
  formatDateTime,
  formatMoney,
  supplySourceBadge,
  supplyStatusBadge,
} from '../utils/procurementStatus';
import type { SupplyOrder, SupplySourceType } from '../types/procurement.types';

type SourceTab = 'ALL' | SupplySourceType;

const SOURCE_TABS: Array<{ id: SourceTab; label: string }> = [
  { id: 'ALL', label: 'All supplies' },
  { id: 'VENDOR', label: 'Vendor supplies' },
  { id: 'IN_HOUSE', label: 'In-house purchases' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'ACCEPTED', label: 'Recorded / Accepted' },
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
  const sourceParam = searchParams.get('source');
  const source: SourceTab =
    sourceParam === 'VENDOR' || sourceParam === 'IN_HOUSE' ? sourceParam : 'ALL';

  const { data, isLoading, refetch } = useSupplyOrders({
    search: search || undefined,
    status: status || undefined,
    source_type: source === 'ALL' ? undefined : source,
  });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  const emptyCopy =
    source === 'IN_HOUSE'
      ? {
          title: 'No in-house purchases yet',
          description: 'Record what the store bought directly. No vendor quote or award is needed.',
          action: 'Record In-house Purchase',
        }
      : source === 'VENDOR'
        ? {
            title: 'No vendor supply orders yet',
            description: 'Vendor supply orders appear here after a fixed offer is accepted or an RFQ quote is awarded.',
            action: undefined,
          }
        : {
            title: 'No supply orders yet',
            description: 'Vendor fulfilment and in-house purchases will appear here.',
            action: undefined,
          };

  const columns = useMemo<Column<SupplyOrder>[]>(
    () => [
      {
        header: 'Supply order',
        accessorKey: 'supply_number',
        isMono: true,
        cell: (row) => (
          <div>
            <div className="text-xs font-bold text-ink whitespace-nowrap">{row.supply_number}</div>
            <div className="text-[11px] text-status-neutral">
              {row.source_type === 'IN_HOUSE' ? 'In-house purchase' : row.request_number ?? '—'}
            </div>
          </div>
        ),
      },
      {
        header: 'Source',
        accessorKey: 'source_type',
        cell: (row) => {
          const badge = supplySourceBadge(row.source_type);
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        header: 'Supplier',
        cell: (row) =>
          row.source_type === 'IN_HOUSE'
            ? row.in_house_supplier_name || 'In-house'
            : row.vendor_name || '—',
      },
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
          row.has_evidence ? (
            <Badge variant="success">Submitted</Badge>
          ) : (
            <Badge variant="warning">
              {row.source_type === 'IN_HOUSE' ? 'Required before receipt' : 'Required before packing'}
            </Badge>
          ),
      },
      { header: 'Promised', cell: (row) => formatDateTime(row.promised_delivery_at) },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Supply Orders"
        subtitle="Vendor fulfilment and in-house purchases — evidence, arrival and receipt"
        badge={<Badge variant="neutral">{data?.total ?? 0} total</Badge>}
        actions={
          <>
            <Button
              variant="outline"
              icon={<PackageCheck className="w-4 h-4" />}
              onClick={() => navigate('/procurement')}
            >
              Vendor Requests
            </Button>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/procurement/in-house/new')}
            >
              Record In-house Purchase
            </Button>
          </>
        }
      />

      <div className="inline-flex max-w-full flex-wrap items-center gap-1 p-1 bg-rose-50 border border-border rounded-[12px] mb-4">
        {SOURCE_TABS.map((tab) => {
          const active = source === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setParam('source', tab.id === 'ALL' ? '' : tab.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-colors ${
                active
                  ? 'bg-white text-ink shadow-sm border border-border'
                  : 'text-status-neutral hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <FilterBar
        searchQuery={search}
        onSearchChange={(q) => setParam('q', q)}
        statusFilter={status}
        onStatusChange={(value) => setParam('status', value)}
        statusOptions={STATUS_OPTIONS}
        placeholder="Search supply number, request or supplier…"
        onRefresh={() => refetch()}
      />

      <Card padding="none">
        {data && data.supplies.length === 0 && !isLoading ? (
          <div className="p-6">
            <EmptyState
              title={emptyCopy.title}
              description={emptyCopy.description}
              actionText={emptyCopy.action}
              onAction={emptyCopy.action ? () => navigate('/procurement/in-house/new') : undefined}
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
