import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/states/EmptyState';
import { useMarkSupplyDelivered, useSupplyOrderDetail } from '../hooks/useProcurement';
import ReceiveSupplyModal from '../components/procurement/ReceiveSupplyModal';
import {
  SUPPLY_STAGES,
  formatDateTime,
  formatMoney,
  supplyStageIndex,
  supplyStatusBadge,
} from '../utils/procurementStatus';

export default function SupplyOrderDetailPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const navigate = useNavigate();
  const { data: supply, isLoading } = useSupplyOrderDetail(supplyId);

  if (isLoading) {
    return <div className="p-6 text-xs text-muted">Loading supply order…</div>;
  }
  if (!supply) {
    return (
      <div className="p-6">
        <EmptyState title="Supply order not found" actionText="Back to Supply Orders" onAction={() => navigate('/procurement/supplies')} />
      </div>
    );
  }

  const badge = supplyStatusBadge(supply.status);
  const currentIndex = supplyStageIndex(supply.status);
  const isTerminal = ['CANCELLED', 'REJECTED_AT_RECEIPT'].includes(supply.status);
  const markDelivered = useMarkSupplyDelivered();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const canConfirmReceipt = ['DISPATCHED', 'DELIVERED_PENDING_RECEIPT'].includes(supply.status);

  return (
    <div>
      <PageHeader
        title={supply.supply_number}
        subtitle={`${supply.vendor_name ?? ''} → ${supply.shop_name ?? ''}`}
        badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
        actions={
          <>
            <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/procurement/supplies')}>
              Back to Supply Orders
            </Button>
            {supply.status === 'DISPATCHED' && (
              <Button
                variant="secondary"
                isLoading={markDelivered.isPending}
                onClick={() => markDelivered.mutateAsync(supply.id)}
              >
                Mark Delivered
              </Button>
            )}
            {canConfirmReceipt && (
              <Button onClick={() => setReceiveOpen(true)} disabled={supply.status === 'DISPATCHED'}>
                Confirm Receipt
              </Button>
            )}
          </>
        }
      />

      {/* Stage tracker */}
      <div className="w-full py-3 px-4 bg-surface border border-border rounded-[12px] mb-4 overflow-x-auto">
        {isTerminal ? (
          <div className="text-xs font-bold text-ink">This supply order was {badge.label.toLowerCase()}.</div>
        ) : (
          <div className="flex items-center justify-between min-w-[700px]">
            {SUPPLY_STAGES.map((stage, idx) => {
              const done = idx < currentIndex;
              const current = idx === currentIndex;
              return (
                <div key={stage.id} className="flex items-center gap-2 select-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      done ? 'bg-status-success text-white' : current ? 'bg-brand-raspberry text-white' : 'bg-rose-100 text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[11px] ${current ? 'font-bold text-ink' : 'text-muted'}`}>{stage.label}</span>
                  {idx < SUPPLY_STAGES.length - 1 && <div className="w-8 h-0.5 bg-border" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Commercial summary" padding="md">
          <div className="space-y-2 text-xs">
            <Row label="Award value" value={formatMoney(supply.award_amount)} />
            <Row label="Source" value={supply.source_mode === 'FIXED_OFFER' ? 'Fixed Offer' : 'RFQ'} />
            <Row label="Request" value={supply.request_number ?? '—'} />
            <Row label="Promised delivery" value={formatDateTime(supply.promised_delivery_at)} />
            <Row label="Dispatched" value={formatDateTime(supply.dispatched_at)} />
            <Row label="Received" value={formatDateTime(supply.received_at)} />
            <Row label="Destination" value={`${supply.shop_name ?? '—'} · ${supply.shop_pincode ?? ''}`} />
          </div>
        </Card>

        <Card title="Items" padding="md">
          <div className="space-y-2">
            {(supply.items ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
                <span className="text-xs font-bold text-ink">{item.item_name}</span>
                <span className="text-xs text-ink">
                  {Number(item.agreed_quantity)} {item.unit} × {formatMoney(item.agreed_unit_price)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quality evidence" padding="md">
          {supply.evidence?.length ? (
            <div className="space-y-2">
              {supply.evidence.map((item) => (
                <div key={item.id} className="rounded-[10px] border border-border px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink">{String(item.evidence_type).replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-muted">{formatDateTime(item.created_at)}</div>
                  </div>
                  <a
                    href={item.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-brand-raspberry hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted">
              No evidence yet. Vendors must upload a quality video before marking this supply packed.
            </p>
          )}
        </Card>

        <Card title="Timeline" padding="md">
          {supply.events?.length ? (
            <ol className="space-y-3">
              {supply.events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-raspberry shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-ink">{String(event.to_status).replace(/_/g, ' ')}</div>
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

      {receiveOpen && (
        <ReceiveSupplyModal
          isOpen={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          supply={supply}
          products={[]}
        />
      )}
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
