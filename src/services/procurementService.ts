// Vendor procurement service — talks to the backend vendor-procurement module
// at /api/v1/vendor-procurement (see meet-commerce-backend-main). Typed
// payloads follow the shopManagementService.ts style; the apiClient unwraps
// { success, data, pagination } and turns failures into ApiError.

import { apiClient } from './apiClient';
import type {
  CreateRequestInput,
  EligibleVendorPreviewResponse,
  ProcurementQuote,
  ProcurementRequest,
  ProcurementRequestDetail,
  ProcurementRequestListRow,
  ServiceProfileInput,
  SubmitQuoteInput,
  SupplyOrder,
  SupplyOrderDetail,
  UpdateRequestInput,
} from '../types/procurement.types';

const BASE = '/api/v1/vendor-procurement';

export interface ListParams {
  shop_id?: string;
  status?: string;
  mode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function toQuery(params: ListParams = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ── Requests (store/admin surface) ──────────────────────────────────────────

export async function listRequests(params: ListParams = {}): Promise<{ requests: ProcurementRequestListRow[]; total: number; page: number; limit: number }> {
  const res = await apiClient.get<ProcurementRequestListRow[]>(`${BASE}${toQuery(params)}`);
  return {
    requests: res.data ?? [],
    total: res.pagination?.total ?? res.data?.length ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
  };
}

export async function getRequestDetail(requestId: string): Promise<ProcurementRequestDetail> {
  const res = await apiClient.get<ProcurementRequestDetail>(`${BASE}/${requestId}`);
  return res.data;
}

export async function createRequest(payload: CreateRequestInput): Promise<ProcurementRequestDetail> {
  const res = await apiClient.post<ProcurementRequestDetail>(BASE, payload);
  return res.data;
}

export async function updateRequest(requestId: string, payload: UpdateRequestInput): Promise<ProcurementRequestDetail> {
  const res = await apiClient.patch<ProcurementRequestDetail>(`${BASE}/${requestId}`, payload);
  return res.data;
}

export async function publishRequest(requestId: string): Promise<{ request: ProcurementRequest; recipients: unknown[]; rejected_count: number }> {
  const res = await apiClient.post<{ request: ProcurementRequest; recipients: unknown[]; rejected_count: number }>(
    `${BASE}/${requestId}/publish`,
    {}
  );
  return res.data;
}

export async function cancelRequest(requestId: string, reason?: string): Promise<ProcurementRequest> {
  const res = await apiClient.post<ProcurementRequest>(`${BASE}/${requestId}/cancel`, { reason: reason ?? undefined });
  return res.data;
}

export async function expireRequest(requestId: string): Promise<ProcurementRequest> {
  const res = await apiClient.post<ProcurementRequest>(`${BASE}/${requestId}/expire`, {});
  return res.data;
}

// ── Quotes (RFQ comparison + award) ─────────────────────────────────────────

export async function listQuotes(requestId: string): Promise<ProcurementQuote[]> {
  const res = await apiClient.get<ProcurementQuote[]>(`${BASE}/${requestId}/quotes`);
  return res.data ?? [];
}

export async function awardQuote(quoteId: string): Promise<{ request: ProcurementRequest; supply_order: SupplyOrder }> {
  const res = await apiClient.post<{ request: ProcurementRequest; supply_order: SupplyOrder }>(
    `${BASE}/quotes/${quoteId}/award`,
    {}
  );
  return res.data;
}

// ── Eligible vendor preview (create flow) ───────────────────────────────────

export async function previewEligibleVendors(payload: { shop_id: string; items?: Array<{ category_id: string }> }): Promise<EligibleVendorPreviewResponse> {
  const res = await apiClient.post<EligibleVendorPreviewResponse>(`${BASE}/eligible-vendors-preview`, payload);
  return res.data;
}

// ── Supply orders ───────────────────────────────────────────────────────────

export async function listSupplyOrders(params: ListParams = {}): Promise<{ supplies: SupplyOrder[]; total: number; page: number; limit: number }> {
  const res = await apiClient.get<SupplyOrder[]>(`${BASE}/supplies${toQuery(params)}`);
  return {
    supplies: res.data ?? [],
    total: res.pagination?.total ?? res.data?.length ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
  };
}

export async function getSupplyOrderDetail(supplyId: string): Promise<SupplyOrderDetail> {
  const res = await apiClient.get<SupplyOrderDetail>(`${BASE}/supplies/${supplyId}`);
  return res.data;
}

// ── Receiving (store confirms actual quantities; Big Phase 13) ─────────────

export interface ReceiveLineInput {
  supply_order_item_id: string;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  product_id?: string;
  issue_category?: string;
  issue_note?: string;
  expiry_date?: string;
}

export interface ReceiveInput {
  items: ReceiveLineInput[];
  note?: string;
  photo_url?: string;
  warehouse_id?: string;
}

export async function markSupplyDelivered(supplyId: string): Promise<SupplyOrder> {
  const res = await apiClient.post<SupplyOrder>(`${BASE}/supplies/${supplyId}/mark-delivered`, {});
  return res.data;
}

export async function receiveSupply(supplyId: string, payload: ReceiveInput): Promise<{
  receipt: { id: string; status: string };
  supply_order: SupplyOrder;
  inventory: Array<{ supply_order_item_id: string; inventory_skipped: boolean; inventory_lot_id?: string }>;
}> {
  const res = await apiClient.post<Awaited<ReturnType<typeof receiveSupply>>>(`${BASE}/supplies/${supplyId}/receive`, payload);
  return res.data;
}

// ── Vendor performance (transparent aggregations) ───────────────────────────

export interface VendorPerformance {
  vendor: { id: string; name: string; status: string };
  performance: {
    total_supplies: number;
    completed_supplies: number;
    active_supplies: number;
    on_time_rate: number | null;
    total_value: string;
    month_value: string;
    month_quantity: string;
    avg_rating: string;
    review_count: number;
    issue_count: number;
  };
}

export async function getVendorPerformance(vendorId: string): Promise<VendorPerformance> {
  const res = await apiClient.get<VendorPerformance>(`${BASE}/vendors/${vendorId}/performance`);
  return res.data;
}

export async function getVendorReviews(vendorId: string): Promise<Array<{
  id: string;
  rating_overall: number;
  comment: string | null;
  issue_category: string | null;
  supply_number: string;
  shop_name: string;
  created_at: string;
}>> {
  const res = await apiClient.get<Awaited<ReturnType<typeof getVendorReviews>>>(`${BASE}/vendors/${vendorId}/reviews`);
  return res.data ?? [];
}

// ── Vendor service profile (targeting inputs, admin editable) ───────────────

export async function getVendorServiceProfile(vendorId: string): Promise<{
  vendor: { id: string; name: string; status: string; is_active: boolean };
  categories: Array<{ category_id: string; category_name: string }>;
  service_pincodes: string[];
  store_assignments: Array<{ shop_id: string; shop_name: string; shop_city: string }>;
}> {
  const res = await apiClient.get<Awaited<ReturnType<typeof getVendorServiceProfile>>>(`${BASE}/admin/vendors/${vendorId}/service-profile`);
  return res.data;
}

export async function updateVendorServiceProfile(vendorId: string, payload: ServiceProfileInput) {
  const res = await apiClient.put<Awaited<ReturnType<typeof getVendorServiceProfile>>>(
    `${BASE}/admin/vendors/${vendorId}/service-profile`,
    payload
  );
  return res.data;
}
