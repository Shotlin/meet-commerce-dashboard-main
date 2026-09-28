// Ported from bakaloo-dashboard's src/services/customer-activity.service.ts —
// backend confirmed functionally identical (customer-activity.repository.js
// diff was only the already-fixed total_payable/customer_id column names).
import { apiClient } from './apiClient';
import type {
  ResolvedActivityUser,
  CustomerActivityEvent,
  CustomerActivityFilters,
} from '../types/customer-activity.types';

/** Resolve a User ID or phone number to the matching user (+ last_active_at). */
export async function resolveCustomerActivityUser(
  query: string
): Promise<ResolvedActivityUser | null> {
  try {
    const res = await apiClient.get<ResolvedActivityUser>('/api/v1/admin/customer-activity/resolve-user', { query });
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

/**
 * Real-time search-as-you-type suggestions — the counterpart to
 * `resolveCustomerActivityUser` above (which only ever matches a COMPLETE
 * user id or a COMPLETE 10-digit phone number). Returns up to a handful of
 * candidate users matching a partial phone number, a name, or a phone
 * number with a +91/leading-zero prefix.
 */
export async function searchCustomerActivityUsers(
  query: string
): Promise<ResolvedActivityUser[]> {
  try {
    const res = await apiClient.get<ResolvedActivityUser[]>('/api/v1/admin/customer-activity/search-users', { query });
    return res.success && Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** Paginated, filterable activity timeline for one customer. */
export async function getCustomerActivityTimeline(
  userId: string,
  filters: CustomerActivityFilters = {}
): Promise<{
  events: CustomerActivityEvent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.eventType) params.eventType = filters.eventType;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const res = await apiClient.get<CustomerActivityEvent[]>(`/api/v1/admin/customer-activity/${userId}/timeline`, params);

  const events = Array.isArray(res.data) ? res.data : [];
  return {
    events,
    pagination: res.pagination ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: events.length,
      totalPages: 1,
    },
  };
}
