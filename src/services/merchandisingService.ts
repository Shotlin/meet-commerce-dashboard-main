import { apiClient } from './apiClient';

export type MilestoneRewardType = 'CASHBACK' | 'FLAT_DISCOUNT' | 'COUPON_UNLOCK';
export type CashbackCreditTrigger = 'PAYMENT_SUCCESS' | 'ORDER_CONFIRMED' | 'ORDER_DELIVERED';
export type ApplicableUserType = 'ALL' | 'FIRST_TIME' | 'SEGMENT';

export interface CartMilestone {
  id: string;
  name: string;
  minCartAmount: number;
  rewardType: MilestoneRewardType;
  rewardValue: number | null;
  maxDiscount: number | null;
  unlockCouponId: string | null;
  messageBefore: string | null;
  messageAfter: string | null;
  iconUrl: string | null;
  isActive: boolean;
  applicableUserType: ApplicableUserType;
  applicableSegmentId: string | null;
  stackableWithCoupon: boolean;
  priority: number;
  cashbackCreditTrigger: CashbackCreditTrigger;
  usageLimitPerUser: number | null;
  createdAt: string;
}

export interface CartMilestoneInput {
  name: string;
  minCartAmount: number;
  rewardType: MilestoneRewardType;
  rewardValue?: number;
  maxDiscount?: number;
  messageBefore?: string;
  messageAfter?: string;
  isActive?: boolean;
  applicableUserType?: ApplicableUserType;
  stackableWithCoupon?: boolean;
  priority?: number;
  cashbackCreditTrigger?: CashbackCreditTrigger;
  usageLimitPerUser?: number | null;
}

export type OfferRewardType = 'FREE_DELIVERY' | 'FLAT_DISCOUNT' | 'PERCENTAGE_DISCOUNT' | 'WALLET_CASHBACK' | 'COUPON_UNLOCK';
export type PaymentMethodScope = 'ALL' | 'ONLINE_ONLY';

export interface FirstTimeOffer {
  id: string;
  name: string;
  minOrderAmount: number;
  rewardType: OfferRewardType;
  rewardValue: number | null;
  maxDiscount: number | null;
  unlockCouponId: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  autoApply: boolean;
  paymentMethodScope: PaymentMethodScope;
  cashbackCreditTrigger: CashbackCreditTrigger;
  applicableCategoryIds: string[] | null;
  applicableProductIds: string[] | null;
  grantsFreeDelivery: boolean;
  createdAt: string;
}

export interface FirstTimeOfferInput {
  name: string;
  minOrderAmount?: number;
  rewardType: OfferRewardType;
  rewardValue?: number;
  maxDiscount?: number;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
  autoApply?: boolean;
  paymentMethodScope?: PaymentMethodScope;
  cashbackCreditTrigger?: CashbackCreditTrigger;
  grantsFreeDelivery?: boolean;
}

export const merchandisingService = {
  async getMilestones(): Promise<CartMilestone[]> {
    const res = await apiClient.get<CartMilestone[]>('/api/v1/cart-milestones');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch cart milestones');
  },
  async createMilestone(input: CartMilestoneInput): Promise<CartMilestone> {
    const res = await apiClient.post<CartMilestone>('/api/v1/cart-milestones', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create cart milestone');
  },
  async updateMilestone(id: string, input: Partial<CartMilestoneInput>): Promise<CartMilestone> {
    const res = await apiClient.patch<CartMilestone>(`/api/v1/cart-milestones/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update cart milestone ${id}`);
  },
  async deleteMilestone(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/cart-milestones/${id}`);
    if (!res.success) throw new Error(`Failed to delete cart milestone ${id}`);
  },

  async getFirstTimeOffers(): Promise<FirstTimeOffer[]> {
    const res = await apiClient.get<FirstTimeOffer[]>('/api/v1/first-time-offers');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch first-time offers');
  },
  async createFirstTimeOffer(input: FirstTimeOfferInput): Promise<FirstTimeOffer> {
    const res = await apiClient.post<FirstTimeOffer>('/api/v1/first-time-offers', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create first-time offer');
  },
  async updateFirstTimeOffer(id: string, input: Partial<FirstTimeOfferInput>): Promise<FirstTimeOffer> {
    const res = await apiClient.patch<FirstTimeOffer>(`/api/v1/first-time-offers/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update first-time offer ${id}`);
  },
  async deleteFirstTimeOffer(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/first-time-offers/${id}`);
    if (!res.success) throw new Error(`Failed to delete first-time offer ${id}`);
  },
};
