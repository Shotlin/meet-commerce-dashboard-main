import { apiClient } from './apiClient';

export type CashbackCreditTrigger = 'PAYMENT_SUCCESS' | 'ORDER_CONFIRMED' | 'ORDER_DELIVERED';

export interface PaymentOffer {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  iconUrl: string | null;
  cashbackAmount: number;
  cashbackPercent: number | null;
  minOrderAmount: number;
  maxCashback: number | null;
  lockThreshold: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  cashbackCreditTrigger: CashbackCreditTrigger;
  usageLimitPerUser: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOfferInput {
  title: string;
  description?: string | null;
  provider: string;
  iconUrl?: string | null;
  cashbackAmount: number;
  cashbackPercent?: number | null;
  minOrderAmount: number;
  maxCashback?: number | null;
  lockThreshold?: number | null;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  cashbackCreditTrigger?: CashbackCreditTrigger;
  usageLimitPerUser?: number | null;
}

// Adapter — admin payment-offer rows come back snake_case, straight from
// `RETURNING *` on the offers table.
const adaptPaymentOffer = (b: any): PaymentOffer => ({
  id: b.id,
  title: b.title,
  description: b.description,
  provider: b.provider,
  iconUrl: b.icon_url,
  cashbackAmount: Number(b.cashback_amount),
  cashbackPercent: b.cashback_percent != null ? Number(b.cashback_percent) : null,
  minOrderAmount: Number(b.min_order_amount),
  maxCashback: b.max_cashback != null ? Number(b.max_cashback) : null,
  lockThreshold: b.lock_threshold != null ? Number(b.lock_threshold) : null,
  isActive: b.is_active,
  validFrom: b.valid_from,
  validUntil: b.valid_until,
  cashbackCreditTrigger: b.cashback_credit_trigger,
  usageLimitPerUser: b.usage_limit_per_user,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

export const paymentOfferService = {
  async getOffers(): Promise<PaymentOffer[]> {
    const res = await apiClient.get<any[]>('/api/v1/admin/payment-offers');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(adaptPaymentOffer);
    }
    throw new Error('Failed to fetch payment offers from API');
  },

  async createOffer(input: PaymentOfferInput): Promise<PaymentOffer> {
    const res = await apiClient.post<any>('/api/v1/admin/payment-offers', input);
    if (res.success && res.data) {
      return adaptPaymentOffer(res.data);
    }
    throw new Error('Failed to create payment offer');
  },

  async updateOffer(id: string, input: Partial<PaymentOfferInput>): Promise<PaymentOffer> {
    const res = await apiClient.put<any>(`/api/v1/admin/payment-offers/${id}`, input);
    if (res.success && res.data) {
      return adaptPaymentOffer(res.data);
    }
    throw new Error(`Failed to update payment offer ${id}`);
  },

  async deleteOffer(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/payment-offers/${id}`);
    if (!res.success) {
      throw new Error(`Failed to delete payment offer ${id}`);
    }
  },
};
