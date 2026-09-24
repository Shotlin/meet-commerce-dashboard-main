import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { OrderCountdown } from '../components/orders/OrderCountdown';
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer';
import {
  useOrders,
  useOrderStatusCounts,
  useSettlementSummary,
  useBulkAssignRiders,
  useBulkUpdateStatus,
  useBulkReconcilePayments,
} from '../hooks/useOrders';
import { deliveryService, AssignableRider } from '../services/deliveryService';
import { adminOrdersService } from '../services/adminOrdersService';
import { useDebounce } from '../hooks/useDebounce';
import { OrderListRow, OrderFilters, BackendOrderStatus } from '../types/order.types';
import { ShoppingBag, Eye, Download, RefreshCw, AlertTriangle, Banknote, CreditCard, Wallet, Clock3 } from 'lucide-react';

const STATUS_TABS: { label: string; value: BackendOrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Placed', value: 'ORDER_PLACED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const STATUS_BADGE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
  ORDER_PLACED: 'info',
  PENDING: 'info',
  CONFIRMED: 'brand',
  PREPARING: 'warning',
  PACKED: 'warning',
  OUT_FOR_DELIVERY: 'brand',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
};

const PAYMENT_STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  EXPIRED: 'danger',
  REFUNDED: 'neutral',
};

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '20');
  const status = (searchParams.get('status') || '') as BackendOrderStatus | '';
  const paymentMethod = searchParams.get('paymentMethod') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const searchInput = searchParams.get('q') || '';
  const riderId = searchParams.get('riderId') || '';
  const deliveryType = (searchParams.get('deliveryType') || '') as OrderFilters['deliveryType'];
  const needsReviewOnly = searchParams.get('needsReview') === '1';
  const recoveredOnly = searchParams.get('recovered') === '1';
  const openOrderId = searchParams.get('order');

  const [searchDraft, setSearchDraft] = useState(searchInput);
  const debouncedSearch = useDebounce(searchDraft, 400);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [riders, setRiders] = useState<AssignableRider[]>([]);

  useEffect(() => {
    deliveryService.getAssignableRiders().then(setRiders).catch(() => setRiders([]));
  }, []);

  // Keep the URL's `q` param in sync with the debounced search value —
  // avoids firing a new fetch (and rewriting history) on every keystroke.
  useEffect(() => {
    if (debouncedSearch === searchInput) return;
    updateQuery({ q: debouncedSearch || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function updateQuery(updates: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  }

  const filters: OrderFilters = useMemo(
    () => ({
      page,
      limit,
      status: status || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentStatus: paymentStatus || undefined,
      search: searchInput || undefined,
      riderId: riderId || undefined,
      deliveryType: deliveryType || undefined,
      needsPaymentReview: needsReviewOnly || undefined,
      recoveredFromFailed: recoveredOnly || undefined,
    }),
    [page, limit, status, paymentMethod, paymentStatus, searchInput, riderId, deliveryType, needsReviewOnly, recoveredOnly]
  );

  const ordersQuery = useOrders(filters);
  const statusCountsQuery = useOrderStatusCounts();
  const settlementQuery = useSettlementSummary(filters);
  const bulkAssign = useBulkAssignRiders();
  const bulkStatus = useBulkUpdateStatus();
  const bulkReconcile = useBulkReconcilePayments();

  const orders = ordersQuery.data?.orders ?? [];
  const pagination = ordersQuery.data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 };
  const counts = statusCountsQuery.data;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAssign = async (riderIdToAssign: string) => {
    if (!riderIdToAssign || selectedIds.size === 0) return;
    try {
      await bulkAssign.mutateAsync(Array.from(selectedIds).map((orderId) => ({ orderId, riderId: riderIdToAssign })));
      toast.success(`Assigned rider to ${selectedIds.size} order(s)`);
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk assignment failed');
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    if (!newStatus || selectedIds.size === 0) return;
    try {
      const result = await bulkStatus.mutateAsync({ orderIds: Array.from(selectedIds), status: newStatus });
      toast.success(`Updated ${result.updated} of ${selectedIds.size} order(s)`);
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk status update failed');
    }
  };

  const handleBulkReconcile = async () => {
    if (selectedIds.size === 0) return;
    try {
      const results = await bulkReconcile.mutateAsync(Array.from(selectedIds));
      const captured = results.filter((r) => r.captured).length;
      toast.success(`Re-checked ${results.length} order(s) — ${captured} captured payment(s) found`);
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk reconciliation failed');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminOrdersService.exportOrdersCsv({ status: status || undefined });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const columns: Column<OrderListRow>[] = [
    {
      header: '',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelected(row.id);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: 'w-8',
    },
    {
      header: 'Order ID',
      cell: (row) => <span className="font-mono-num text-xs font-semibold">{row.orderNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-ink">{row.customerName || '—'}</p>
          <p className="text-[11px] text-status-neutral">{row.customerPhone || '—'}</p>
        </div>
      ),
    },
    { header: 'Shop', cell: (row) => <span className="text-xs">{row.shopName || '—'}</span> },
    {
      header: 'Amount',
      cell: (row) => <span className="font-mono-num text-xs font-bold text-brand-berry">{fmtCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Payment',
      cell: (row) => (
        <div>
          <p className="text-[11px] font-semibold text-ink">{row.paymentMethod}</p>
          <div className="mt-0.5 flex items-center gap-1">
            <Badge variant={PAYMENT_STATUS_BADGE[row.paymentStatus] || 'neutral'} size="sm">
              {row.paymentStatus}
            </Badge>
            {row.paymentNeedsReview && (
              <Badge variant="warning" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>Review</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={STATUS_BADGE[row.status] || 'neutral'}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      header: 'Order Type / ETA',
      cell: (row) => (
        <div>
          <Badge variant={row.orderType === 'EXPRESS' ? 'brand' : row.orderType === 'SCHEDULED' ? 'info' : 'neutral'} size="sm">
            {row.orderType}
          </Badge>
          <div className="mt-0.5">
            {row.orderType === 'SCHEDULED' ? (
              <span className="text-[11px] text-status-neutral">{row.scheduledSlotLabel || '—'}</span>
            ) : (
              <OrderCountdown estimatedDelivery={row.estimatedDelivery} status={row.status} deliveredAt={row.deliveredAt} />
            )}
          </div>
        </div>
      ),
    },
    { header: 'Rider', cell: (row) => <span className="text-xs">{row.riderName || '—'}</span> },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-xs text-status-neutral" title={new Date(row.createdAt).toLocaleString('en-IN')}>
          {fmtRelative(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => updateQuery({ order: row.id })}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders, payment reconciliation, rider assignment, and fulfillment."
        badge={<Badge variant="brand" icon={<ShoppingBag className="w-3.5 h-3.5" />}>{pagination.total} Orders</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => ordersQuery.refetch()}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Customer money settled — how much has actually been collected for
          the orders currently in view, split by how it was collected. Net
          of wallet on the COD/Online figures (that portion is its own
          tile) so the four numbers never double-count the same rupee. */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Banknote className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Cash on Delivery Collected</p>
            <p className="truncate text-base font-bold text-ink">
              {settlementQuery.isLoading ? '—' : fmtCurrency(settlementQuery.data?.codCollected ?? 0)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CreditCard className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Paid Online</p>
            <p className="truncate text-base font-bold text-ink">
              {settlementQuery.isLoading ? '—' : fmtCurrency(settlementQuery.data?.onlineCollected ?? 0)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-raspberry/10 text-brand-raspberry">
            <Wallet className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Covered by Wallet</p>
            <p className="truncate text-base font-bold text-ink">
              {settlementQuery.isLoading ? '—' : fmtCurrency(settlementQuery.data?.walletCollected ?? 0)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Pending Collection</p>
            <p className="truncate text-base font-bold text-ink">
              {settlementQuery.isLoading ? '—' : fmtCurrency(settlementQuery.data?.pendingAmount ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Status tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => updateQuery({ status: tab.value || undefined, needsReview: undefined, recovered: undefined, page: undefined })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === tab.value && !needsReviewOnly && !recoveredOnly
                ? 'border-brand-raspberry bg-brand-raspberry text-white'
                : 'border-border bg-white text-ink hover:bg-rose-50'
            }`}
          >
            {tab.label}
            {counts && tab.value && counts[tab.value] != null ? ` (${counts[tab.value]})` : ''}
          </button>
        ))}
      </div>

      {/* Needs Review / Recovered pills — money-safety filters, see the
          payment-reconciliation hardening work. */}
      {counts && ((counts.NEEDS_REVIEW ?? 0) > 0 || (counts.RECOVERED ?? 0) > 0) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(counts.NEEDS_REVIEW ?? 0) > 0 && (
            <button
              onClick={() => updateQuery({ needsReview: needsReviewOnly ? undefined : '1', status: undefined, recovered: undefined, page: undefined })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                needsReviewOnly ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-300 bg-amber-50 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Needs Review ({counts.NEEDS_REVIEW})
            </button>
          )}
          {(counts.RECOVERED ?? 0) > 0 && (
            <button
              onClick={() => updateQuery({ recovered: recoveredOnly ? undefined : '1', status: undefined, needsReview: undefined, page: undefined })}
              title="Orders where a payment previously shown FAILED was later confirmed captured by Razorpay"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                recoveredOnly ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-300 bg-blue-50 text-blue-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recovered ({counts.RECOVERED})
            </button>
          )}
        </div>
      )}

      {/* Filter row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search order #, customer name, or phone..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="min-w-[240px] flex-1 rounded-[10px] border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30"
        />
        <select
          value={paymentMethod}
          onChange={(e) => updateQuery({ paymentMethod: e.target.value || undefined, page: undefined })}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All Payment Methods</option>
          <option value="COD">Cash on Delivery</option>
          <option value="ONLINE">Razorpay / Online</option>
          <option value="WALLET">Wallet</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => updateQuery({ paymentStatus: e.target.value || undefined, page: undefined })}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Any Payment Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="EXPIRED">Expired</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          value={deliveryType || ''}
          onChange={(e) => updateQuery({ deliveryType: e.target.value || undefined, page: undefined })}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All Order Types</option>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select
          value={riderId}
          onChange={(e) => updateQuery({ riderId: e.target.value || undefined, page: undefined })}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All Riders</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={String(limit)}
          onChange={(e) => updateQuery({ limit: e.target.value, page: undefined })}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[12px] border border-brand-raspberry/30 bg-rose-50 px-4 py-2.5">
          <span className="text-xs font-semibold text-ink">{selectedIds.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && handleBulkStatus(e.target.value)}
            className="rounded-[8px] border border-border bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>Update Status…</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="PACKED">Packed</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
            className="rounded-[8px] border border-border bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>Assign Rider…</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleBulkReconcile} isLoading={bulkReconcile.isPending}>
            Re-check Payments
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
        </div>
      )}

      <Card padding="none">
        <Table
          columns={columns}
          data={orders}
          keyExtractor={(r) => r.id}
          isLoading={ordersQuery.isLoading}
          onRowClick={(row) => updateQuery({ order: row.id })}
          emptyText={ordersQuery.isError ? (ordersQuery.error instanceof Error ? ordersQuery.error.message : 'Failed to load orders') : 'No orders found'}
        />
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-status-neutral">
            Page {pagination.page} of {pagination.totalPages} — {pagination.total} total
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>
              Previous
            </Button>
            {buildPageWindow(pagination.page, pagination.totalPages).map((p) => (
              <button
                key={p}
                onClick={() => updateQuery({ page: p })}
                className={`h-8 w-8 rounded-[8px] text-xs font-semibold ${
                  p === pagination.page ? 'bg-brand-raspberry text-white' : 'border border-border bg-white text-ink hover:bg-rose-50'
                }`}
              >
                {p}
              </button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => updateQuery({ page: page + 1 })}>
              Next
            </Button>
          </div>
        </div>
      )}

      <OrderDetailDrawer orderId={openOrderId} onClose={() => updateQuery({ order: undefined })} />
    </div>
  );
};

function buildPageWindow(current: number, total: number): number[] {
  const window = 2;
  const start = Math.max(1, current - window);
  const end = Math.min(total, current + window);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}
