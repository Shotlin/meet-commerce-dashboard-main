import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/states/EmptyState';
import {
  useMarkInHouseArrived,
  useMarkSupplyDelivered,
  useSupplyOrderDetail,
} from '../hooks/useProcurement';
import { getProducts } from '../services/productsAdminService';
import { queryKeys } from '../services/queryKeys';
import ReceiveSupplyModal from '../components/procurement/ReceiveSupplyModal';
import { InHouseEvidencePanel } from '../components/procurement/InHouseEvidencePanel';
import {
  IN_HOUSE_STAGES,
  SUPPLY_STAGES,
  formatDateTime,
  formatMoney,
  inHouseStageIndex,
  supplySourceBadge,
  supplyStageIndex,
  supplyStatusBadge,
} from '../utils/procurementStatus';
import type { ProcurementEvidence } from '../types/procurement.types';

function isVideoEvidence(item: ProcurementEvidence): boolean {
  return item.evidence_type === 'QUALITY_VIDEO' || Boolean(item.mime_type?.startsWith('video/'));
}

function evidenceReviewBadge(status: ProcurementEvidence['review_status']) {
  if (status === 'ACCEPTED') return <Badge variant="success" size="sm">Accepted</Badge>;
  if (status === 'REJECTED') return <Badge variant="danger" size="sm">Rejected</Badge>;
  return <Badge variant="warning" size="sm">Pending review</Badge>;
}

export default function SupplyOrderDetailPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const navigate = useNavigate();
  const { data: supply, isLoading } = useSupplyOrderDetail(supplyId);
  const markDelivered = useMarkSupplyDelivered();
  const markArrived = useMarkInHouseArrived();
  const [receiveOpen, setReceiveOpen] = useState(false);

  // Fetched once the receiving modal is actually needed — the catalog can be
  // sizeable and most supply-order views never open "Confirm Receipt".
  const productsQuery = useQuery({
    queryKey: queryKeys.procurement.products(),
    queryFn: () => getProducts({ limit: 500 }),
    enabled: receiveOpen,
    staleTime: 5 * 60 * 1000,
  });
  const productOptions = useMemo(
    () => (productsQuery.data?.products ?? []).map((p) => ({ id: p.id, name: p.name })),
    [productsQuery.data],
  );

  if (isLoading) {
    return <div className="p-6 text-xs text-status-neutral">Loading supply order…</div>;
  }
  if (!supply) {
    return (
      <div className="p-6">
        <EmptyState
          title="Supply order not found"
          actionText="Back to Supply Orders"
          onAction={() => navigate('/procurement/supplies')}
        />
      </div>
    );
  }

  const isInHouse = supply.source_type === 'IN_HOUSE';
  const hasVideo = (supply.evidence ?? []).some(
    (item) => item.evidence_type === 'QUALITY_VIDEO' && item.review_status !== 'REJECTED'
  );
  const badge = supplyStatusBadge(supply.status);
  const sourceBadge = supplySourceBadge(supply.source_type);
  const currentIndex = isInHouse
    ? inHouseStageIndex(supply.status, hasVideo)
    : supplyStageIndex(supply.status);
  const stages = isInHouse ? IN_HOUSE_STAGES : SUPPLY_STAGES;
  const isTerminal = !isInHouse && ['CANCELLED', 'REJECTED_AT_RECEIPT'].includes(supply.status);
  const supplierLabel = isInHouse
    ? supply.in_house_supplier_name || 'In-house'
    : supply.vendor_name || 'Vendor';
  const canConfirmVendorReceipt =
    !isInHouse && ['DISPATCHED', 'DELIVERED_PENDING_RECEIPT'].includes(supply.status);
  const canConfirmInHouseReceipt =
    isInHouse && supply.status === 'DELIVERED_PENDING_RECEIPT' && hasVideo;
  const evidenceEditable = isInHouse && ['ACCEPTED', 'DELIVERED_PENDING_RECEIPT'].includes(supply.status);

  return (
    <div>
      <PageHeader
        title={supply.supply_number}
        subtitle={`${supplierLabel} → ${supply.shop_name ?? 'Store'}`}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Badge variant={sourceBadge.variant}>{sourceBadge.label}</Badge>
          </div>
        }
        actions={
          <>
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() =>
                navigate(isInHouse ? '/procurement/supplies?source=IN_HOUSE' : '/procurement/supplies')
              }
            >
              Back to Supply Orders
            </Button>
            {isInHouse ? (
              <>
                {supply.status === 'ACCEPTED' && (
                  <Button
                    variant="secondary"
                    isLoading={markArrived.isPending}
                    onClick={() => {
                      markArrived.mutateAsync(supply.id).catch(() => {});
                    }}
                  >
                    Mark Arrived
                  </Button>
                )}
                {supply.status === 'DELIVERED_PENDING_RECEIPT' && (
                  <Button
                    onClick={() => setReceiveOpen(true)}
                    disabled={!canConfirmInHouseReceipt}
                    title={!hasVideo ? 'Attach a quality video before confirming receipt' : undefined}
                  >
                    Confirm Receipt
                  </Button>
                )}
              </>
            ) : (
              <>
                {supply.status === 'DISPATCHED' && (
                  <Button
                    variant="secondary"
                    isLoading={markDelivered.isPending}
                    onClick={() => {
                      markDelivered.mutateAsync(supply.id).catch(() => {});
                    }}
                  >
                    Mark Delivered
                  </Button>
                )}
                {canConfirmVendorReceipt && (
                  <Button
                    onClick={() => setReceiveOpen(true)}
                    disabled={supply.status === 'DISPATCHED'}
                  >
                    Confirm Receipt
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      {isInHouse && supply.status === 'DELIVERED_PENDING_RECEIPT' && !hasVideo && (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">A quality video is required before receipt.</p>
            <p className="mt-0.5 text-[11px]">
              Attach an uploaded video or a direct video link below, then confirm receipt to move
              accepted stock into inventory.
            </p>
          </div>
        </div>
      )}

      {/* Stage tracker */}
      <div className="w-full py-3 px-4 bg-surface border border-border rounded-[12px] mb-4 overflow-x-auto">
        {isTerminal ? (
          <div className="text-xs font-bold text-ink">This supply order was {badge.label.toLowerCase()}.</div>
        ) : (
          <div className={`flex items-center justify-between ${isInHouse ? 'min-w-[520px]' : 'min-w-[700px]'}`}>
            {stages.map((stage, idx) => {
              const done = idx < currentIndex;
              const current = idx === currentIndex;
              return (
                <div key={stage.id} className="flex items-center gap-2 select-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      done ? 'bg-status-success text-white' : current ? 'bg-brand-raspberry text-white' : 'bg-rose-100 text-status-neutral'
                    }`}
                  >
                    {done ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[11px] ${current ? 'font-bold text-ink' : 'text-status-neutral'}`}>{stage.label}</span>
                  {idx < stages.length - 1 && <div className="w-8 h-0.5 bg-border" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={isInHouse ? 'Purchase summary' : 'Commercial summary'} padding="md">
          <div className="space-y-2 text-xs">
            <Row label={isInHouse ? 'Purchase value' : 'Award value'} value={formatMoney(supply.award_amount)} />
            <Row
              label="Source"
              value={
                isInHouse
                  ? 'In-house purchase'
                  : supply.source_mode === 'FIXED_OFFER'
                    ? 'Fixed Offer'
                    : 'RFQ'
              }
            />
            {isInHouse ? (
              <Row label="Supplier" value={supply.in_house_supplier_name || '—'} />
            ) : (
              <Row label="Request" value={supply.request_number ?? '—'} />
            )}
            <Row label="Promised delivery" value={formatDateTime(supply.promised_delivery_at)} />
            {!isInHouse && <Row label="Dispatched" value={formatDateTime(supply.dispatched_at)} />}
            <Row label="Arrived" value={formatDateTime(supply.delivered_at)} />
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

        <Card
          title="Quality evidence"
          padding="md"
          action={
            <Badge variant={hasVideo ? 'success' : 'warning'} size="sm">
              {hasVideo ? 'Video attached' : isInHouse ? 'Video required' : 'Awaiting vendor'}
            </Badge>
          }
        >
          {supply.evidence?.length ? (
            <div className="space-y-3">
              {supply.evidence.map((item) => (
                <div key={item.id} className="rounded-[10px] border border-border p-2 space-y-2">
                  {isVideoEvidence(item) ? (
                    <video
                      src={item.media_url}
                      controls
                      preload="metadata"
                      className="w-full max-h-52 rounded-[8px] bg-black"
                    />
                  ) : (
                    <img
                      src={item.media_url}
                      alt={String(item.evidence_type).replace(/_/g, ' ')}
                      className="w-full max-h-60 rounded-[8px] object-contain bg-muted/30"
                    />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink">
                        {String(item.evidence_type).replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-status-neutral">
                        {item.attachment_source === 'EXTERNAL_LINK' ? 'External link' : 'Uploaded'} ·{' '}
                        {formatDateTime(item.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {evidenceReviewBadge(item.review_status)}
                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-status-info hover:underline"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-status-neutral">
              {isInHouse
                ? 'No evidence yet. Attach a quality video below before confirming receipt.'
                : 'No evidence yet. Vendors must upload a quality video before marking this supply packed.'}
            </p>
          )}

          {isInHouse && (
            <div className="mt-3">
              <InHouseEvidencePanel supply={supply} disabled={!evidenceEditable} hasVideo={hasVideo} />
            </div>
          )}
        </Card>

        <Card title="Timeline" padding="md">
          {supply.events?.length ? (
            <ol className="space-y-3">
              {supply.events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-ink-2 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-ink">{String(event.to_status).replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-status-neutral">
                      {formatDateTime(event.created_at)}
                      {event.actor_role ? ` · ${event.actor_role}` : ''}
                      {event.note ? ` · ${event.note}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[11px] text-status-neutral">No events recorded yet.</p>
          )}
        </Card>
      </div>

      {receiveOpen && (
        <ReceiveSupplyModal
          isOpen={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          supply={supply}
          products={productOptions}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-bold text-status-neutral uppercase">{label}</dt>
      <dd className="text-xs text-ink text-right">{value}</dd>
    </div>
  );
}
