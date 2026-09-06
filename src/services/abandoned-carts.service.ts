// Ported from bakaloo-dashboard's src/services/abandoned-carts.service.ts —
// backend confirmed byte-identical (src/modules/admin/abandoned-carts, both
// repos), so this talks to the same real endpoints via apiClient directly
// rather than axios.
import { apiClient } from './apiClient';
import type {
  AbandonedCart,
  AbandonedCartDetail,
  AbandonedCartFilters,
  AbandonedCartSummary,
  SendReminderPayload,
  IssueCouponPayload,
} from '../types/abandoned-cart.types';

export async function getAbandonedCarts(filters: AbandonedCartFilters = {}) {
  const params: Record<string, unknown> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.minValue !== undefined) params.minValue = filters.minValue;
  if (filters.maxValue !== undefined) params.maxValue = filters.maxValue;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;

  const res = await apiClient.get<{
    carts: AbandonedCart[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/api/v1/admin/abandoned-carts', params);

  return {
    carts: Array.isArray(res.data?.carts) ? res.data.carts : [],
    pagination: res.data?.pagination ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getAbandonedCartsSummary(): Promise<AbandonedCartSummary> {
  const res = await apiClient.get<AbandonedCartSummary>('/api/v1/admin/abandoned-carts/summary');
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch abandoned carts summary');
}

export async function getAbandonedCartDetail(id: string): Promise<AbandonedCartDetail> {
  const res = await apiClient.get<AbandonedCartDetail>(`/api/v1/admin/abandoned-carts/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch abandoned cart detail');
}

export async function sendAbandonedCartReminder(id: string, payload: SendReminderPayload) {
  const res = await apiClient.post<{ notificationId: string }>(`/api/v1/admin/abandoned-carts/${id}/notify`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to send reminder');
}

export async function issueAbandonedCartCoupon(id: string, payload: IssueCouponPayload) {
  const res = await apiClient.post<{ couponId: string; code?: string }>(`/api/v1/admin/abandoned-carts/${id}/coupon`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to issue coupon');
}
