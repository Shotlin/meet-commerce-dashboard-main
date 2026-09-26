import { apiClient } from './apiClient';
import type {
  OrderListRow,
  OrderListResult,
  OrderDetail,
  OrderFilters,
  OrderStatusCounts,
  SettlementSummary,
  OrderNoteEntry,
  OrderTimelineEntry,
  OrderLineItem,
  OrderPaymentDetail,
  OrderDeliveryAssignment,
  OrderQualityEvidenceItem,
  RazorpayPaymentDetail,
  RefundOrderPayload,
  CancelOrderPayload,
  RescheduleOrderPayload,
  ReconcilePaymentResult,
  SettlementEntry,
  SettlementInfo,
  RecordSettlementPayload,
} from '../types/order.types';

// ── snake_case (real backend rows) -> camelCase (typed) mapping ────────────
// `apiClient` does no case conversion at all (confirmed: the backend's
// prior "HQ Central FC" bug was exactly a camelCase/snake_case mismatch
// going unnoticed) — every field below reads BOTH spellings so this can
// never silently regress the same way. Anything the backend doesn't
// actually have comes through as `null`/`undefined`, never a placeholder
// string or invented number — see the project rule: real value or an
// honest empty state, never fabricated operational data.

function readOrderType(v: any): 'STANDARD' | 'EXPRESS' | 'SCHEDULED' {
  const t = v?.orderType ?? v?.order_type;
  return t === 'EXPRESS' || t === 'SCHEDULED' ? t : 'STANDARD';
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapListRow(o: any): OrderListRow {
  return {
    id: o.id,
    orderNumber: o.order_number ?? o.orderNumber ?? o.id,
    status: (o.status ?? 'ORDER_PLACED') as OrderListRow['status'],
    customerId: o.customer_id ?? o.customerId ?? null,
    customerName: o.customer_name ?? o.customerName ?? null,
    customerPhone: o.customer_phone ?? o.customerPhone ?? null,
    shopId: o.shop_id ?? o.shopId ?? null,
    shopName: o.shop_name ?? o.shopName ?? null,
    totalAmount: num(o.total_payable ?? o.totalAmount ?? o.total_amount),
    paymentMethod: o.payment_method ?? o.paymentMethod ?? 'COD',
    paymentStatus: (o.payment_status ?? o.paymentStatus ?? 'PENDING') as OrderListRow['paymentStatus'],
    paymentNeedsReview: !!(o.payment_needs_manual_review ?? o.paymentNeedsReview),
    paymentRecoveredFromFailed: !!(o.payment_recovered_from_failed ?? o.paymentRecoveredFromFailed),
    orderType: readOrderType(o),
    deliveryMode: (o.delivery_mode ?? o.deliveryMode ?? 'ASAP') as OrderListRow['deliveryMode'],
    scheduledSlotLabel: o.scheduled_slot_label ?? o.scheduledSlotLabel ?? null,
    estimatedDelivery: o.estimated_delivery ?? o.estimatedDelivery ?? null,
    deliveredAt: o.delivered_at ?? o.deliveredAt ?? null,
    riderId: o.rider_id ?? o.riderId ?? null,
    riderName: o.rider_name ?? o.riderName ?? null,
    createdAt: o.created_at ?? o.createdAt,
  };
}

export function mapItem(item: any, idx: number): OrderLineItem {
  return {
    id: item.id ?? `item-${idx}`,
    productId: item.product_id ?? item.productId ?? null,
    productName: item.product_name ?? item.productName ?? item.name ?? 'Item',
    quantity: num(item.quantity, 1),
    unit: item.unit ?? null,
    netQuantity: item.net_quantity ?? item.netQuantity ?? null,
    unitPrice: num(item.unit_price ?? item.unitPrice ?? item.price),
    lineTotal: num(item.subtotal ?? item.total ?? item.lineTotal, num(item.unit_price ?? item.unitPrice) * num(item.quantity, 1)),
    thumbnailUrl: item.thumbnail_url ?? item.thumbnailUrl ?? null,
  };
}

function mapTimeline(t: any): OrderTimelineEntry {
  return {
    id: t.id,
    fromStatus: t.from_status ?? t.fromStatus ?? null,
    toStatus: t.to_status ?? t.toStatus,
    changedBy: t.changed_by ?? t.changedBy ?? null,
    changedByName: t.changed_by_name ?? t.changedByName ?? null,
    note: t.note ?? null,
    changedAt: t.changed_at ?? t.changedAt,
  };
}

function mapNote(n: any): OrderNoteEntry {
  return {
    id: n.id,
    body: n.body,
    authorId: n.author_id ?? n.authorId ?? null,
    authorName: n.author_name ?? n.authorName ?? null,
    createdAt: n.created_at ?? n.createdAt,
  };
}

export function mapPayment(p: any): OrderPaymentDetail | null {
  if (!p) return null;
  return {
    id: p.id ?? null,
    razorpayOrderId: p.razorpay_order_id ?? p.razorpayOrderId ?? null,
    razorpayPaymentId: p.razorpay_payment_id ?? p.razorpayPaymentId ?? null,
    amount: num(p.amount),
    currency: p.currency ?? 'INR',
    status: p.status ?? null,
    method: p.method ?? null,
    needsManualReview: !!(p.needs_manual_review ?? p.needsManualReview),
    recoveredFromFailed: !!(p.recovered_from_failed ?? p.recoveredFromFailed),
    reviewReason: p.review_reason ?? p.reviewReason ?? null,
    errorCode: p.error_code ?? p.errorCode ?? null,
    errorDescription: p.error_description ?? p.errorDescription ?? null,
    errorReason: p.error_reason ?? p.errorReason ?? null,
    refundId: p.refund_id ?? p.refundId ?? null,
    refundAmount: p.refund_amount != null ? num(p.refund_amount) : null,
    refundStatus: p.refund_status ?? p.refundStatus ?? null,
    createdAt: p.created_at ?? p.createdAt ?? null,
  };
}

function mapSettlementEntry(e: any): SettlementEntry {
  return {
    id: e.id,
    entryType: e.entryType ?? e.entry_type,
    amount: num(e.amount),
    method: e.method,
    cashAmount: num(e.cashAmount ?? e.cash_amount),
    upiAmount: num(e.upiAmount ?? e.upi_amount),
    reference: e.reference ?? null,
    methodNote: e.methodNote ?? e.method_note ?? null,
    internalNote: e.internalNote ?? e.internal_note ?? null,
    reversesEntryId: e.reversesEntryId ?? e.reverses_entry_id ?? null,
    recordedBy: e.recordedBy ?? e.recorded_by,
    recordedByName: e.recordedByName ?? e.recorded_by_name ?? null,
    createdAt: e.createdAt ?? e.created_at,
  };
}

// Backend returns this already-computed (never trust client-side arithmetic
// for money) — the dashboard only formats/displays it. Falls back to a
// zeroed, "nothing due" shape rather than throwing if a caller somehow
// gets an order response with no settlement block at all (an older
// cached response, or a non-order-detail context reusing this mapper).
function mapSettlementInfo(s: any): SettlementInfo {
  if (!s) {
    return {
      totalPayable: 0, walletAmount: 0, outstanding: 0, received: 0, amountDue: 0,
      paymentStatus: 'PENDING', history: [], settledBy: null, settledAt: null,
    };
  }
  return {
    totalPayable: num(s.totalPayable),
    walletAmount: num(s.walletAmount),
    outstanding: num(s.outstanding),
    received: num(s.received),
    amountDue: num(s.amountDue),
    paymentStatus: s.paymentStatus,
    history: Array.isArray(s.history) ? s.history.map(mapSettlementEntry) : [],
    settledBy: s.settledBy ?? null,
    settledAt: s.settledAt ?? null,
  };
}

function mapDelivery(d: any): OrderDeliveryAssignment | null {
  if (!d) return null;
  return {
    id: d.id ?? null,
    riderId: d.rider_id ?? d.riderId ?? null,
    status: d.status ?? null,
    assignedAt: d.assigned_at ?? d.assignedAt ?? null,
    deliveredAt: d.delivered_at ?? d.deliveredAt ?? null,
    cancelledAt: d.cancelled_at ?? d.cancelledAt ?? null,
    deliveryOtp: d.delivery_otp ?? d.deliveryOtp ?? null,
    distanceKm: d.distance_km != null ? num(d.distance_km) : null,
  };
}

export function mapOrderDetail(o: any): OrderDetail {
  return {
    ...mapListRow(o),
    customerEmail: o.customer_email ?? o.customerEmail ?? null,
    riderPhone: o.rider_phone ?? o.riderPhone ?? null,
    deliveryAddress: o.delivery_address ?? o.deliveryAddress ?? null,
    deliveryNotes: o.delivery_notes ?? o.deliveryNotes ?? o.delivery_instructions ?? null,
    cancelledReason: o.cancelled_reason ?? o.cancelledReason ?? null,
    subtotal: num(o.subtotal),
    discountAmount: num(o.discount_amount ?? o.discountAmount),
    deliveryFee: num(o.delivery_fee ?? o.deliveryFee),
    platformFee: num(o.platform_fee ?? o.platformFee),
    handlingFee: num(o.handling_fee ?? o.handlingFee),
    lateNightFee: num(o.late_night_fee ?? o.lateNightFee),
    tipAmount: num(o.tip_amount ?? o.tipAmount),
    taxAmount: num(o.tax_amount ?? o.taxAmount),
    savingsTotal: num(o.savings_total ?? o.savingsTotal),
    walletAmountUsed: num(o.wallet_amount ?? o.walletAmountUsed),
    couponCode: o.coupon_code ?? o.couponCode ?? null,
    items: Array.isArray(o.items) ? o.items.map(mapItem) : [],
    timeline: Array.isArray(o.timeline) ? o.timeline.map(mapTimeline) : [],
    payment: mapPayment(o.payment),
    delivery: mapDelivery(o.delivery),
    settlement: mapSettlementInfo(o.settlement),
    // Real per-item vendor quality videos (§7.5) — resolved server-side
    // via order_item → inventory_lot allocation → procurement receipt →
    // supply order → vendor. Empty array (never fabricated) when no item
    // resolves one — a manually-stocked item, or an order that predates
    // this feature.
    qualityEvidence: Array.isArray(o.quality_evidence) ? o.quality_evidence.map(mapQualityEvidenceItem) : [],
  };
}

function mapQualityEvidenceItem(e: any): OrderQualityEvidenceItem {
  return {
    orderItemId: e.orderItemId ?? e.order_item_id,
    productName: e.productName ?? e.product_name ?? 'Item',
    videoUrl: e.videoUrl ?? e.video_url,
    vendorName: e.vendorName ?? e.vendor_name ?? null,
    supplyNumber: e.supplyNumber ?? e.supply_number ?? null,
  };
}

function buildQuery(filters: OrderFilters): Record<string, any> {
  const q: Record<string, any> = {};
  if (filters.page) q.page = filters.page;
  if (filters.limit) q.limit = filters.limit;
  if (filters.status) q.status = filters.status;
  if (filters.paymentMethod) q.paymentMethod = filters.paymentMethod;
  if (filters.paymentStatus) q.paymentStatus = filters.paymentStatus;
  if (filters.search) q.search = filters.search;
  if (filters.startDate) q.startDate = filters.startDate;
  if (filters.endDate) q.endDate = filters.endDate;
  if (filters.deliveryType) q.deliveryType = filters.deliveryType;
  if (filters.riderId) q.riderId = filters.riderId;
  if (filters.minAmount != null) q.minAmount = filters.minAmount;
  if (filters.maxAmount != null) q.maxAmount = filters.maxAmount;
  if (filters.needsPaymentReview) q.needsPaymentReview = true;
  if (filters.recoveredFromFailed) q.recoveredFromFailed = true;
  return q;
}

export const adminOrdersService = {
  async getOrders(filters: OrderFilters): Promise<OrderListResult> {
    const response = await apiClient.get<{ orders: any[]; pagination: any }>('/api/v1/admin/orders', buildQuery(filters));
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch orders');
    return {
      orders: response.data.orders.map(mapListRow),
      pagination: response.data.pagination ?? { page: filters.page ?? 1, limit: filters.limit ?? 20, total: 0, totalPages: 0 },
    };
  },

  async getStatusCounts(): Promise<OrderStatusCounts> {
    const response = await apiClient.get<Record<string, number>>('/api/v1/admin/orders/stats-by-status');
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch order status counts');
    return { NEEDS_REVIEW: 0, RECOVERED: 0, ...response.data };
  },

  async getSettlementSummary(filters: OrderFilters): Promise<SettlementSummary> {
    const response = await apiClient.get<any>('/api/v1/admin/orders/settlement-summary', buildQuery(filters));
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch settlement summary');
    const d = response.data;
    return {
      codCollected: Number(d.codCollected ?? 0),
      onlineCollected: Number(d.onlineCollected ?? 0),
      walletCollected: Number(d.walletCollected ?? 0),
      pendingAmount: Number(d.pendingAmount ?? 0),
      orderCount: Number(d.orderCount ?? 0),
    };
  },

  async getOrderDetail(id: string): Promise<OrderDetail> {
    const response = await apiClient.get<any>(`/api/v1/admin/orders/${id}`);
    if (!response.success || !response.data) throw new Error(response.message || `Order ${id} not found`);
    return mapOrderDetail(response.data);
  },

  async getSettlementInfo(id: string): Promise<SettlementInfo> {
    const response = await apiClient.get<any>(`/api/v1/admin/orders/${id}/settlements`);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch settlement info');
    return mapSettlementInfo(response.data);
  },

  async recordSettlement(id: string, payload: RecordSettlementPayload): Promise<SettlementInfo> {
    const response = await apiClient.post<any>(`/api/v1/admin/orders/${id}/settlements`, payload);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to record payment settlement');
    return mapSettlementInfo(response.data);
  },

  async reverseSettlement(id: string, entryId: string, reason?: string): Promise<SettlementInfo> {
    const response = await apiClient.post<any>(`/api/v1/admin/orders/${id}/settlements/${entryId}/reverse`, { reason });
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to reverse payment settlement');
    return mapSettlementInfo(response.data);
  },

  async getOrderNotes(id: string): Promise<OrderNoteEntry[]> {
    const response = await apiClient.get<any[]>(`/api/v1/admin/orders/${id}/notes`);
    if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Failed to fetch notes');
    return response.data.map(mapNote);
  },

  async addOrderNote(id: string, body: string): Promise<OrderNoteEntry> {
    const response = await apiClient.post<any>(`/api/v1/admin/orders/${id}/notes`, { body });
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to add note');
    return mapNote(response.data);
  },

  async updateOrderStatus(id: string, status: string, note?: string): Promise<{ orderId: string; oldStatus: string; newStatus: string }> {
    const response = await apiClient.put<any>(`/api/v1/admin/orders/${id}/status`, { status, note });
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to update status');
    return response.data;
  },

  async assignRider(id: string, riderId: string): Promise<void> {
    const response = await apiClient.put<any>(`/api/v1/admin/orders/${id}/assign-rider`, { riderId });
    if (!response.success) throw new Error(response.message || 'Unable to assign rider');
  },

  async bulkAssignRiders(assignments: { orderId: string; riderId: string }[]): Promise<void> {
    const response = await apiClient.post<any>('/api/v1/admin/orders/bulk-assign', { assignments });
    if (!response.success) throw new Error(response.message || 'Bulk assignment failed');
  },

  async bulkUpdateStatus(orderIds: string[], status: string): Promise<{ updated: number }> {
    const response = await apiClient.post<any>('/api/v1/admin/orders/bulk-status', { orderIds, status });
    if (!response.success || !response.data) throw new Error(response.message || 'Bulk status update failed');
    return response.data;
  },

  async rescheduleOrder(id: string, payload: RescheduleOrderPayload): Promise<void> {
    const response = await apiClient.put<any>(`/api/v1/admin/orders/${id}/reschedule`, payload);
    if (!response.success) throw new Error(response.message || 'Failed to reschedule delivery');
  },

  async refundOrder(id: string, payload: RefundOrderPayload): Promise<{ orderId: string; refundAmount: number; refundTo: string }> {
    const response = await apiClient.post<any>(`/api/v1/admin/orders/${id}/refund`, payload);
    if (!response.success || !response.data) throw new Error(response.message || 'Refund failed');
    return response.data;
  },

  async cancelOrder(id: string, payload: CancelOrderPayload): Promise<{ orderId: string; status: string; stockRestoreWarning?: string }> {
    const response = await apiClient.post<any>(`/api/v1/admin/orders/${id}/cancel`, payload);
    if (!response.success || !response.data) throw new Error(response.message || 'Cancel failed');
    return response.data;
  },

  async reconcilePayment(id: string): Promise<ReconcilePaymentResult> {
    const response = await apiClient.post<ReconcilePaymentResult>(`/api/v1/admin/orders/${id}/reconcile-payment`, {});
    if (!response.success || !response.data) throw new Error(response.message || 'Reconciliation failed');
    return response.data;
  },

  async bulkReconcilePayments(orderIds: string[]): Promise<ReconcilePaymentResult[]> {
    const response = await apiClient.post<ReconcilePaymentResult[]>('/api/v1/admin/orders/bulk-reconcile-payment', { orderIds });
    if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Bulk reconciliation failed');
    return response.data;
  },

  async getRazorpayDetails(id: string): Promise<RazorpayPaymentDetail> {
    const response = await apiClient.get<RazorpayPaymentDetail>(`/api/v1/admin/orders/${id}/razorpay-details`);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch Razorpay detail');
    return response.data;
  },

  async downloadInvoice(id: string): Promise<Blob> {
    return apiClient.getBlob(`/api/v1/admin/orders/${id}/invoice`);
  },

  async downloadPackingSlip(id: string): Promise<Blob> {
    return apiClient.getBlob(`/api/v1/admin/orders/${id}/packing-slip`);
  },

  async exportOrdersCsv(filters: Pick<OrderFilters, 'status' | 'startDate' | 'endDate'>): Promise<Blob> {
    return apiClient.getBlob('/api/v1/admin/orders/export', buildQuery(filters));
  },
};
