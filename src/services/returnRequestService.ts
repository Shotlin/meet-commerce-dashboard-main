import { apiClient } from './apiClient';

export type ReturnStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ReturnScope = 'FULL_ORDER' | 'ITEMS';
export type RefundDestination = 'RAZORPAY' | 'WALLET';

export interface ReturnItem {
  // Admin-filed requests index into the order's lines; customer-app requests
  // carry the real order line / product ids instead.
  itemIndex?: number;
  orderItemId?: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Real shape from `admin/returns` — snake_case, joined with order/customer
// display fields. Money fields come back as numeric strings from Postgres.
export interface ReturnRequest {
  id: string;
  order_id: string;
  customer_id: string;
  scope: ReturnScope;
  items: ReturnItem[] | null;
  reason: string;
  status: ReturnStatus;
  refund_destination: RefundDestination;
  computed_amount: string;
  resolved_amount: string | null;
  admin_notes: string | null;
  requested_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Added with the customer refund flow (migration 152).
  shop_id?: string | null;
  shop_name?: string | null;
  source?: 'CUSTOMER' | 'ADMIN';
  refund_reference?: string | null;
  last_error?: string | null;
  order_number: string;
  order_total_payable: string;
  order_status: string;
  customer_name: string | null;
  customer_phone: string;
}

export interface CreateReturnInput {
  orderId: string;
  scope: ReturnScope;
  itemIndexes?: number[];
  reason: string;
  refundDestination: RefundDestination;
  adminNotes?: string;
}

// Minimal, real-shape order lookup for the return-creation flow — deliberately
// not reusing `orderService.ts`, which adapts to a mock meat-domain `Order`
// type (fake `cutType`/`lotTraceIds` fallbacks) that doesn't match the real
// admin orders API at all.
export interface OrderLookup {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string;
  status: string;
  total_payable: string;
  items: { name: string; unit: string; price: number; total: number; quantity: number; productId: string }[];
}

export const returnRequestService = {
  async list(filters: { status?: ReturnStatus; page?: number; limit?: number } = {}): Promise<{ rows: ReturnRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const res = await apiClient.get<ReturnRequest[]>('/api/v1/admin/returns', filters as Record<string, any>);
    if (res.success && Array.isArray(res.data)) {
      return { rows: res.data, pagination: res.pagination ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 } };
    }
    throw new Error('Failed to fetch return requests');
  },

  async getDetail(id: string): Promise<ReturnRequest> {
    const res = await apiClient.get<ReturnRequest>(`/api/v1/admin/returns/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch return request');
  },

  async create(input: CreateReturnInput): Promise<ReturnRequest> {
    const res = await apiClient.post<ReturnRequest>('/api/v1/admin/returns', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create return request');
  },

  async approve(id: string, adminNotes?: string, refundTo?: RefundDestination): Promise<ReturnRequest> {
    const res = await apiClient.post<ReturnRequest>(`/api/v1/admin/returns/${id}/approve`, { adminNotes, refundTo });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to approve return request');
  },

  async reject(id: string, adminNotes?: string): Promise<ReturnRequest> {
    const res = await apiClient.post<ReturnRequest>(`/api/v1/admin/returns/${id}/reject`, { adminNotes });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to reject return request');
  },

  async cancel(id: string, adminNotes?: string): Promise<ReturnRequest> {
    const res = await apiClient.post<ReturnRequest>(`/api/v1/admin/returns/${id}/cancel`, { adminNotes });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to cancel return request');
  },

  async searchOrders(search: string, limit = 10): Promise<OrderLookup[]> {
    const res = await apiClient.get<{ orders: OrderLookup[] }>('/api/v1/admin/orders', { search, limit });
    if (res.success && res.data) return res.data.orders;
    throw new Error('Failed to search orders');
  },

  async getOrder(orderId: string): Promise<OrderLookup> {
    const res = await apiClient.get<OrderLookup>(`/api/v1/admin/orders/${orderId}`);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch order');
  },
};
