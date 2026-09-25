// Shared status → badge mapping for the procurement module. Color + label
// always travel together (never color alone) per the blueprint design rules.

import type {
  ProcurementMode,
  ProcurementQuote,
  ProcurementRequestStatus,
  RecipientStatus,
  SupplyStatus,
} from '../types/procurement.types';
import type { BadgeVariant } from '../components/common/Badge';

type BadgeVariantName = BadgeVariant;

const REQUEST_STATUS_BADGE: Record<ProcurementRequestStatus, { variant: BadgeVariantName; label: string }> = {
  DRAFT: { variant: 'neutral', label: 'Draft' },
  PUBLISHED: { variant: 'info', label: 'Published' },
  AWARDED: { variant: 'brand', label: 'Awarded' },
  IN_FULFILMENT: { variant: 'warning', label: 'In Fulfilment' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  CANCELLED: { variant: 'neutral', label: 'Cancelled' },
  EXPIRED: { variant: 'neutral', label: 'Expired' },
};

const SUPPLY_STATUS_BADGE: Record<SupplyStatus, { variant: BadgeVariantName; label: string }> = {
  AWARDED: { variant: 'brand', label: 'Awarded' },
  ACCEPTED: { variant: 'info', label: 'Accepted' },
  PROCESSING: { variant: 'warning', label: 'Processing' },
  CLEANING: { variant: 'warning', label: 'Cleaning' },
  VIDEO_SUBMITTED: { variant: 'info', label: 'Video Submitted' },
  PACKED: { variant: 'info', label: 'Packed' },
  READY_FOR_DISPATCH: { variant: 'info', label: 'Ready for Dispatch' },
  DISPATCHED: { variant: 'info', label: 'Dispatched' },
  DELIVERED_PENDING_RECEIPT: { variant: 'warning', label: 'Pending Receipt' },
  RECEIVED: { variant: 'success', label: 'Received' },
  CLOSED: { variant: 'success', label: 'Closed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  REJECTED_AT_RECEIPT: { variant: 'danger', label: 'Rejected at Receipt' },
};

const RECIPIENT_STATUS_BADGE: Record<RecipientStatus, { variant: BadgeVariantName; label: string }> = {
  NEW: { variant: 'info', label: 'New' },
  VIEWED: { variant: 'info', label: 'Viewed' },
  DECLINED: { variant: 'neutral', label: 'Declined' },
  RESPONDED: { variant: 'info', label: 'Responded' },
  AWARDED: { variant: 'brand', label: 'Awarded' },
  NOT_SELECTED: { variant: 'neutral', label: 'Not Selected' },
  EXPIRED: { variant: 'neutral', label: 'Expired' },
};

export const QUOTE_STATUS_BADGE: Record<ProcurementQuote['status'], { variant: BadgeVariantName; label: string }> = {
  SUBMITTED: { variant: 'info', label: 'Submitted' },
  UPDATED: { variant: 'info', label: 'Updated' },
  SELECTED: { variant: 'success', label: 'Selected' },
  NOT_SELECTED: { variant: 'neutral', label: 'Not Selected' },
  WITHDRAWN: { variant: 'neutral', label: 'Withdrawn' },
  EXPIRED: { variant: 'neutral', label: 'Expired' },
};

export const MODE_LABEL: Record<ProcurementMode, string> = {
  FIXED_OFFER: 'Fixed Offer',
  RFQ: 'RFQ',
};

export function requestStatusBadge(status: ProcurementRequestStatus) {
  return REQUEST_STATUS_BADGE[status] ?? { variant: 'neutral' as const, label: status };
}

export function supplyStatusBadge(status: SupplyStatus) {
  return SUPPLY_STATUS_BADGE[status] ?? { variant: 'neutral' as const, label: status };
}

export function recipientStatusBadge(status: RecipientStatus) {
  return RECIPIENT_STATUS_BADGE[status] ?? { variant: 'neutral' as const, label: status };
}

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQty(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(num) ? '—' : String(num);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// Supply state machine order for the dashboard stepper.
export const SUPPLY_STAGES: Array<{ id: SupplyStatus; label: string }> = [
  { id: 'AWARDED', label: 'Awarded' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'CLEANING', label: 'Cleaning' },
  { id: 'VIDEO_SUBMITTED', label: 'Video' },
  { id: 'PACKED', label: 'Packed' },
  { id: 'DISPATCHED', label: 'Dispatched' },
  { id: 'RECEIVED', label: 'Received' },
  { id: 'CLOSED', label: 'Closed' },
];

export function supplyStageIndex(status: SupplyStatus): number {
  const idx = SUPPLY_STAGES.findIndex((s) => s.id === status);
  if (idx >= 0) return idx;
  // Exception states map to the closest stage for display.
  if (status === 'READY_FOR_DISPATCH') return SUPPLY_STAGES.findIndex((s) => s.id === 'PACKED');
  if (status === 'DELIVERED_PENDING_RECEIPT') return SUPPLY_STAGES.findIndex((s) => s.id === 'DISPATCHED');
  if (status === 'REJECTED_AT_RECEIPT') return SUPPLY_STAGES.findIndex((s) => s.id === 'RECEIVED');
  return 0;
}
