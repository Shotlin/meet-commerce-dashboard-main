import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ExternalLink, Gavel, Send, TimerReset } from 'lucide-react';

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
  SUPPLY_STAGES,
  formatDateTime,
  formatMoney,
  recipientStatusBadge,
  requestStatusBadge,
  supplyStageIndex,
  supplyStatusBadge,
} from '../utils/procurementStatus';
import type { ProcurementQuote, SupplyOrderDetail } from '../types/procurement.types';

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
          { id: 'fulfilment', label: 'Fulfilment', count: request.supply_order ? 1 : undefined },
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

      {tab === 'fulfilment' && (
        <div>
          {!request.supply_order ? (
            <Card padding="md">
              <EmptyState
                title="Not awarded yet"
                description="Fulfilment tracking starts once a vendor accepts a fixed offer or is awarded an RFQ quote — accept/award status, processing stages, quality evidence, and dispatch will all show up here automatically."
              />
            </Card>
          ) : (
            <FulfilmentTab supply={request.supply_order} />
          )}
        </div>
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

// Live vendor fulfilment status, surfaced directly on the request an admin
// is already looking at — previously there was no way to answer "did the
// vendor accept? are they processing? has a video been submitted? has it
// shipped?" without separately knowing to go find the unlinked Supply
// Orders list. Mirrors SupplyOrderDetailPage's own stage tracker for a
// consistent look, plus a direct link there for the full action set
// (Mark Delivered / Confirm Receipt).
function FulfilmentTab({ supply }: { supply: SupplyOrderDetail }) {
  const navigate = useNavigate();
  const badge = supplyStatusBadge(supply.status);
  const currentIndex = supplyStageIndex(supply.status);
  const isTerminal = ['CANCELLED', 'REJECTED_AT_RECEIPT'].includes(supply.status);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-ink">{supply.supply_number}</div>
            <div className="text-[11px] text-muted">{supply.vendor_name ?? '—'}</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/procurement/supplies/${supply.id}`)}
            >
              Open Supply Order
            </Button>
          </div>
        </div>

        {isTerminal ? (
          <div className="text-xs font-bold text-ink">This supply order was {badge.label.toLowerCase()}.</div>
        ) : (
          <div className="flex items-center justify-between overflow-x-auto py-1">
            {SUPPLY_STAGES.map((stage, idx) => {
              const done = idx < currentIndex;
              const current = idx === currentIndex;
              return (
                <div key={stage.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      done ? 'bg-status-success text-white' : current ? 'bg-brand-raspberry text-white' : 'bg-rose-100 text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap ${current ? 'font-bold text-ink' : 'text-muted'}`}>{stage.label}</span>
                  {idx < SUPPLY_STAGES.length - 1 && <div className="w-6 h-0.5 bg-border mx-1" />}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Commercial summary" padding="md">
          <dl className="space-y-2 text-xs">
            <Row label="Award value" value={formatMoney(supply.award_amount)} />
            <Row label="Promised delivery" value={formatDateTime(supply.promised_delivery_at)} />
            <Row label="Dispatched" value={formatDateTime(supply.dispatched_at)} />
            <Row label="Received" value={formatDateTime(supply.received_at)} />
            {supply.delivery_reference && <Row label="Delivery reference" value={supply.delivery_reference} />}
          </dl>
        </Card>

        <Card title="Quality evidence" padding="md">
          {supply.evidence?.length ? (
            <div className="space-y-2">
              {supply.evidence.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
                  <div className="text-xs text-ink">{item.evidence_type.replace(/_/g, ' ')}</div>
                  <a href={item.media_url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-brand-raspberry hover:underline">
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted">No evidence submitted yet.</p>
          )}
        </Card>
      </div>

      <Card title="Processing history" padding="md">
        {supply.events?.length ? (
          <ol className="space-y-3">
            {supply.events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-brand-raspberry shrink-0" />
                <div>
                  <div className="text-xs font-bold text-ink">{event.to_status.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-muted">
                    {formatDateTime(event.created_at)}
                    {event.actor_role ? ` · ${event.actor_role}` : ''}
                    {event.note ? ` · ${event.note}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[11px] text-muted">No events recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
