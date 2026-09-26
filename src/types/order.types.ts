// Dedicated, API-faithful order types for the rebuilt Orders module.
// Deliberately separate from the older, simpler `Order`/`OrderItem` in
// `types/index.ts` — those are still used by HQCommandCenter's live-feed
// widget and exportReport.ts's CSV, which only ever needed a handful of
// summary fields and are left untouched (see CLAUDE.md / the rebuild's
// engineering report for why). These new types carry everything the real
// backend response actually has: customer/shop attribution, payment
// method+status+gateway detail, fees, delivery info, order type/ETA,
// rider assignment state, internal notes, and the live Razorpay payment
// detail shape — nothing here is invented; every field maps to a real
// column or join already present in `admin/orders`'s repository/service.

export type BackendOrderStatus =
  | 'ORDER_PLACED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderType = 'STANDARD' | 'EXPRESS' | 'SCHEDULED';

export type PaymentMethod = 'COD' | 'ONLINE' | 'WALLET' | 'MANUAL' | string;
export type PaymentGatewayStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export interface OrderListRow {
  id: string;
  orderNumber: string;
  status: BackendOrderStatus;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shopId: string | null;
  shopName: string | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentGatewayStatus;
  paymentNeedsReview: boolean;
  paymentRecoveredFromFailed: boolean;
  orderType: OrderType;
  deliveryMode: 'ASAP' | 'SCHEDULED';
  scheduledSlotLabel: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  riderId: string | null;
  riderName: string | null;
  createdAt: string;
}

export interface OrderLineItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string | null;
  netQuantity: string | null;
  unitPrice: number;
  lineTotal: number;
  thumbnailUrl: string | null;
}

export interface OrderTimelineEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  changedByName: string | null;
  note: string | null;
  changedAt: string;
}

export interface OrderNoteEntry {
  id: string;
  body: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface OrderPaymentDetail {
  id: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentGatewayStatus | null;
  method: string | null;
  needsManualReview: boolean;
  recoveredFromFailed: boolean;
  reviewReason: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  errorReason: string | null;
  refundId: string | null;
  refundAmount: number | null;
  refundStatus: string | null;
  createdAt: string | null;
}

export interface OrderDeliveryAssignment {
  id: string | null;
  riderId: string | null;
  status: string | null;
  assignedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  deliveryOtp: string | null;
  distanceKm: number | null;
}

/**
 * A real vendor quality/cleaning video, resolved per order item via
 * order_item → inventory_lot allocation → procurement receipt → supply
 * order → vendor (§7.5) — the same trace the customer app's invoice-QR
 * scan resolves. One entry per item that has a resolvable video; an item
 * with no allocation (manually stocked, or predates this feature) simply
 * has no entry here — never a fabricated one.
 */
export interface OrderQualityEvidenceItem {
  orderItemId: string;
  productName: string;
  videoUrl: string;
  vendorName: string | null;
  supplyNumber: string | null;
}

export interface OrderDetail extends OrderListRow {
  customerEmail: string | null;
  riderPhone: string | null;
  deliveryAddress: Record<string, unknown> | null;
  deliveryNotes: string | null;
  cancelledReason: string | null;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  platformFee: number;
  handlingFee: number;
  lateNightFee: number;
  tipAmount: number;
  taxAmount: number;
  savingsTotal: number;
  walletAmountUsed: number;
  couponCode: string | null;
  items: OrderLineItem[];
  timeline: OrderTimelineEntry[];
  payment: OrderPaymentDetail | null;
  delivery: OrderDeliveryAssignment | null;
  // Real per-item vendor quality videos (§7.5) — empty array when no item
  // resolves to one (manually-stocked item, or an order predating this
  // feature); the drawer must render an honest empty state, never fabricate
  // a video.
  qualityEvidence: OrderQualityEvidenceItem[];
  settlement: SettlementInfo;
}

/**
 * Manual payment settlement — for an order delivered outside the rider app
 * / online-payment flow, an admin/finance user records that cash/UPI was
 * actually collected. Distinct from `payment` (the Razorpay online-payment
 * record, if any) and never auto-derived from delivery status: a delivered
 * COD order stays PENDING/PARTIALLY_PAID until someone records the real
 * collection here.
 */
export type SettlementEntryType = 'SETTLEMENT' | 'REVERSAL';
export type SettlementMethod = 'CASH' | 'UPI' | 'CASH_UPI' | 'OTHER';

export interface SettlementEntry {
  id: string;
  entryType: SettlementEntryType;
  amount: number;
  method: SettlementMethod;
  cashAmount: number;
  upiAmount: number;
  reference: string | null;
  methodNote: string | null;
  internalNote: string | null;
  reversesEntryId: string | null;
  recordedBy: string;
  recordedByName: string | null;
  createdAt: string;
}

export interface SettlementInfo {
  totalPayable: number;
  walletAmount: number;
  outstanding: number;
  received: number;
  amountDue: number;
  paymentStatus: string;
  history: SettlementEntry[];
  settledBy: string | null;
  settledAt: string | null;
}

export interface RecordSettlementPayload {
  amount: number;
  method: SettlementMethod;
  cashAmount?: number;
  upiAmount?: number;
  reference?: string;
  methodNote?: string;
  internalNote?: string;
}

export interface RazorpayPaymentDetail {
  id: string;
  status: string;
  method: string | null;
  amount: number | null;
  amountRefunded: number | null;
  refundStatus: string | null;
  currency: string | null;
  fee: number | null;
  tax: number | null;
  international: boolean;
  email: string | null;
  contact: string | null;
  vpa: string | null;
  bank: string | null;
  wallet: string | null;
  card: { last4: string | null; network: string | null; type: string | null; issuer: string | null } | null;
  acquirerReference: string | null;
  upiTransactionId: string | null;
  createdAt: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  errorReason: string | null;
  notes: Record<string, unknown> | null;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: BackendOrderStatus | '';
  paymentMethod?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  deliveryType?: 'express' | 'scheduled' | 'standard' | '';
  riderId?: string;
  minAmount?: number;
  maxAmount?: number;
  needsPaymentReview?: boolean;
  recoveredFromFailed?: boolean;
}

export interface OrderListResult {
  orders: OrderListRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface OrderStatusCounts {
  [status: string]: number;
  NEEDS_REVIEW: number;
  RECOVERED: number;
}

/**
 * "Customer money settled" — how much has actually been collected for
 * the current filtered view, split by how it was collected. `codCollected`/
 * `onlineCollected` are net of any wallet amount (that portion is counted
 * once, under `walletCollected`); `pendingAmount` is what's still owed on
 * orders that haven't reached `payment_status: 'PAID'` yet (an unpaid COD
 * order, or an ONLINE order awaiting confirmation).
 */
export interface SettlementSummary {
  codCollected: number;
  onlineCollected: number;
  walletCollected: number;
  pendingAmount: number;
  orderCount: number;
}

export interface RefundOrderPayload {
  reason: string;
  refundTo: 'wallet' | 'original' | 'none';
}

export interface CancelOrderPayload {
  reason?: string;
  refundTo?: 'wallet' | 'original' | 'none';
}

export interface RescheduleOrderPayload {
  scheduledSlotStart: string;
  scheduledSlotEnd: string;
  scheduledSlotLabel: string;
  reason?: string;
}

export interface ReconcilePaymentResult {
  orderId: string;
  captured: boolean;
  needsManualReview?: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
}
