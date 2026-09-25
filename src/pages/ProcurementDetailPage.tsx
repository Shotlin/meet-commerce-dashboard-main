import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Gavel, Send, TimerReset } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Tabs } from '../components/common/Tabs';
import { Table, type Column } from '../components/common/Table';
import { EmptyState } from '../components/states/EmptyState';
import {
  useAwardQuote,
  useCancelProcurementRequest,
  useExpireProcurementRequest,
  useProcurementQuotes,
  useProcurementRequestDetail,
  usePublishProcurementRequest,
} from '../hooks/useProcurement';
import {
  MODE_LABEL,
  QUOTE_STATUS_BADGE,
  formatDateTime,
  formatMoney,
  recipientStatusBadge,
  requestStatusBadge,
} from '../utils/procurementStatus';
import type { ProcurementQuote } from '../types/procurement.types';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30';

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useProcurementRequestDetail(id);
  const { data: quotes } = useProcurementQuotes(id);

  const awardMutation = useAwardQuote();
  const cancelMutation = useCancelProcurementRequest();
  const expireMutation = useExpireProcurementRequest();
  const publishMutation = usePublishProcurementRequest();

  const [tab, setTab] = useState('overview');
  const [quoteToAward, setQuoteToAward] = useState<ProcurementQuote | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return <div className="p-6 text-xs text-muted">Loading requirement…</div>;
  }
  if (!request) {
    return (
      <div className="p-6">
        <EmptyState title="Requirement not found" actionText="Back to Procurement" onAction={() => navigate('/procurement')} />
      </div>
    );
  }

  const statusBadge = requestStatusBadge(request.status);
  const canRespond = request.status === 'PUBLISHED';

  const quoteColumns: Column<ProcurementQuote>[] = [
    {
      header: 'Vendor',
      accessorKey: 'vendor_name',
      cell: (row) => (
        <div>
          <div className="text-xs font-bold text-ink">{row.vendor_name}</div>
          <div className="text-[11px] text-muted">{formatDateTime(row.submitted_at)}</div>
        </div>
      ),
    },
    {
      header: 'Quoted total',
      accessorKey: 'grand_total',
      cell: (row) => <span className="text-xs font-bold text-ink">{formatMoney(row.grand_total)}</span>,
    },
    {
      header: 'Items',
      cell: (row) =>
        (row.quote_items ?? [])
          .map((item) => `${Number(item.quoted_quantity)} × ${formatMoney(item.unit_price)}`)
          .join(' | ') || '—',
    },
    { header: 'Promised delivery', cell: (row) => formatDateTime(row.promised_delivery_at) },
    {
      header: 'Rating',
      cell: (row) => (row.vendor_rating != null ? `${row.vendor_rating} ★` : `${row.completed_review_count ?? 0} supplies`),
    },
    { header: 'Issues', cell: (row) => String(row.vendor_issue_count ?? 0) },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        const badge = QUOTE_STATUS_BADGE[row.status];
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      header: '',
      cell: (row) =>
        row.status === 'SUBMITTED' || row.status === 'UPDATED' ? (
          <Button size="sm" icon={<Gavel className="w-3.5 h-3.5" />} onClick={() => setQuoteToAward(row)}>
            Award
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={request.request_number}
        subtitle={request.title}
        badge={<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
        actions={
          <>
            <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/procurement')}>
              Back
            </Button>
            {request.status === 'DRAFT' && (
              <Button
                icon={<Send className="w-4 h-4" />}
                onClick={() => publishMutation.mutateAsync(request.id)}
                isLoading={publishMutation.isPending}
              >
                Publish
              </Button>
            )}
            {canRespond && (
              <>
                <Button
                  variant="secondary"
                  icon={<TimerReset className="w-4 h-4" />}
                  onClick={() => expireMutation.mutate(request.id)}
                  isLoading={expireMutation.isPending}
                >
                  Expire
                </Button>
                <Button
                  variant="danger"
                  icon={<Ban className="w-4 h-4" />}
                  onClick={() => setCancelOpen(true)}
                  isLoading={cancelMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            )}
          </>
        }
      />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'recipients', label: 'Recipients', count: request.recipients?.length },
          { id: 'quotes', label: 'Quotes', count: quotes?.length },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Requirement" padding="md">
            <dl className="space-y-2 text-xs">
              <Row label="Mode" value={MODE_LABEL[request.mode]} />
              <Row label="Store" value={`${request.shop_name ?? '—'} · ${request.shop_city ?? ''}`} />
              <Row label="Required delivery" value={formatDateTime(request.required_delivery_at)} />
              <Row label={request.mode === 'FIXED_OFFER' ? 'Offer expiry' : 'Quote deadline'} value={formatDateTime(request.response_deadline)} />
              <Row label="Status" value={statusBadge.label} />
              {request.mode === 'FIXED_OFFER' && <Row label="Offer total" value={formatMoney(request.offer_total)} />}
              {request.award_total != null && <Row label="Award value" value={formatMoney(request.award_total)} />}
              {request.awarded_vendor_name && <Row label="Awarded vendor" value={request.awarded_vendor_name} />}
            </dl>
          </Card>

          <Card title="Items" padding="md">
            <div className="space-y-2">
              {request.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
                  <div>
                    <div className="text-xs font-bold text-ink">{item.item_name}</div>
                    <div className="text-[11px] text-muted">{item.category_name ?? item.category_id}</div>
                  </div>
                  <div className="text-xs text-ink">
                    {Number(item.requested_quantity)} {item.unit}
                    {request.mode === 'FIXED_OFFER' && item.fixed_unit_price != null && (
                      <span className="text-muted"> × {formatMoney(item.fixed_unit_price)}</span>
                    )}
                  </div>
                </div>
              ))}
              {request.quality_instructions && (
                <div className="rounded-[10px] bg-warning/5 border border-warning/20 px-3 py-2 text-[11px] text-ink">
                  <strong className="font-bold">Quality: </strong>
                  {request.quality_instructions}
                </div>
              )}
              {request.notes && (
                <div className="rounded-[10px] bg-surface-soft border border-border px-3 py-2 text-[11px] text-muted">{request.notes}</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'recipients' && (
        <Card title={`Recipients (${request.recipients?.length ?? 0})`} padding="md">
          {request.recipients?.length ? (
            <div className="space-y-2">
              {request.recipients.map((recipient) => {
                const badge = recipientStatusBadge(recipient.status);
                return (
                  <div key={recipient.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
                    <div>
                      <div className="text-xs font-bold text-ink">{recipient.vendor_name ?? recipient.vendor_id}</div>
                      <div className="text-[11px] text-muted">
                        {recipient.responded_at ? `Responded ${formatDateTime(recipient.responded_at)}` : 'No response yet'}
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Not published yet"
              description="Recipients are resolved from eligible vendors when the requirement is published."
            />
          )}
        </Card>
      )}

      {tab === 'quotes' && (
        <Card title="Quote comparison" subtitle="Amounts matter, but weigh rating, supply history and issues too" padding="none">
          {quotes && quotes.length > 0 ? (
            <Table columns={quoteColumns} data={quotes} keyExtractor={(row) => row.id} emptyText="No quotes" />
          ) : (
            <div className="p-6">
              <EmptyState
                title="No quotes yet"
                description="Vendors can submit quotes until the response deadline."
              />
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={Boolean(quoteToAward)}
        onClose={() => setQuoteToAward(null)}
        title="Award vendor"
        subtitle={quoteToAward ? `${quoteToAward.vendor_name} — ${formatMoney(quoteToAward.grand_total)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQuoteToAward(null)}>
              Keep comparing
            </Button>
            <Button
              isLoading={awardMutation.isPending}
              onClick={async () => {
                if (quoteToAward) await awardMutation.mutateAsync(quoteToAward.id);
                setQuoteToAward(null);
              }}
            >
              Confirm award
            </Button>
          </>
        }
      >
        <p className="text-xs text-ink">
          This awards the requirement to <strong>{quoteToAward?.vendor_name}</strong> at{' '}
          <strong>{quoteToAward ? formatMoney(quoteToAward.grand_total) : ''}</strong>, creates a supply order, and closes all
          other quotes. This cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel requirement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep requirement
            </Button>
            <Button
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={async () => {
                await cancelMutation.mutateAsync({ requestId: request.id, reason: cancelReason || undefined });
                setCancelOpen(false);
              }}
            >
              Cancel requirement
            </Button>
          </>
        }
      >
        <label className={inputClass ? 'block text-[11px] font-bold text-ink mb-1' : ''} htmlFor="cancel-reason">
          Reason (optional)
        </label>
        <input
          id="cancel-reason"
          className={inputClass}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="e.g. Wrong quantities entered"
        />
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-bold text-muted uppercase">{label}</dt>
      <dd className="text-xs text-ink text-right">{value}</dd>
    </div>
  );
}
