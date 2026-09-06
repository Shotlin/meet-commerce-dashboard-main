import { apiClient } from './apiClient';

export type AbandonedCartStatus = 'OPEN' | 'RECOVERED' | 'CONVERTED' | 'EXPIRED' | 'ALL';

// Admin abandoned-cart responses are already camelCase server-side
// (computed in the repository's _formatListRow/getSummary, not raw rows).
export interface AbandonedCart {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string | null;
  status: AbandonedCartStatus;
  abandonedAt: string;
  itemCount: number;
  totalQuantity: number;
  cartValue: number;
  priorityScore: number;
  reminderCount: number;
  lastReminderSentAt: string | null;
  recoveredAt: string | null;
  convertedAt: string | null;
}

export interface AbandonedCartSummary {
  openCount: number;
  openValue: number;
  avgCartValue: number;
  recoveredToday: number;
  recoveredValueToday: number;
  convertedToday: number;
  convertedValueToday: number;
  recoveryRate7d: number;
}

export interface ReminderInput {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
}

export interface IssueCouponInput {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY' | 'CASHBACK';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
}

export const abandonedCartService = {
  async getSummary(): Promise<AbandonedCartSummary> {
    const res = await apiClient.get<AbandonedCartSummary>('/api/v1/admin/abandoned-carts/summary');
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch abandoned cart summary');
  },

  async getCarts(status: AbandonedCartStatus = 'OPEN'): Promise<AbandonedCart[]> {
    const res = await apiClient.get<{ carts: AbandonedCart[] }>('/api/v1/admin/abandoned-carts', { status });
    if (res.success && res.data && Array.isArray(res.data.carts)) {
      return res.data.carts;
    }
    throw new Error('Failed to fetch abandoned carts');
  },

  async sendReminder(id: string, input: ReminderInput): Promise<{ notificationId: string }> {
    const res = await apiClient.post<{ notificationId: string }>(`/api/v1/admin/abandoned-carts/${id}/notify`, input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to send reminder');
  },

  async issueCoupon(id: string, input: IssueCouponInput): Promise<{ couponId: string; code: string }> {
    const res = await apiClient.post<{ couponId: string; code: string }>(`/api/v1/admin/abandoned-carts/${id}/coupon`, input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to issue coupon');
  },
};
