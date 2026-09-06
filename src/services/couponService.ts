import { apiClient } from './apiClient';

export type DiscountType = 'PERCENTAGE' | 'FLAT' | 'CASHBACK' | 'FREE_DELIVERY';
export type CouponTargetType = 'ALL' | 'SEGMENT' | 'INDIVIDUAL' | 'FIRST_TIME';
export type CashbackCreditTrigger = 'PAYMENT_SUCCESS' | 'ORDER_CONFIRMED' | 'ORDER_DELIVERED';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  targetType: CouponTargetType;
  targetSegmentId: string | null;
  cashbackCreditTrigger: CashbackCreditTrigger;
  grantsFreeDelivery: boolean;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  targetType?: CouponTargetType;
  cashbackCreditTrigger?: CashbackCreditTrigger;
  grantsFreeDelivery?: boolean;
  isActive?: boolean;
}

export interface CouponAnalytics {
  totalRedemptions: number;
  revenueGenerated: number;
  avgOrderValue: number;
  avgDiscount: number;
  conversionRate: number;
  dailyRedemptions: { date: string; count: number; revenue: number }[];
  topUsers: { name: string; uses: number; totalSpent: number }[];
}

export const couponService = {
  async getCoupons(): Promise<Coupon[]> {
    const res = await apiClient.get<Coupon[]>('/api/v1/coupons');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch coupons');
  },
  async createCoupon(input: CouponInput): Promise<Coupon> {
    const res = await apiClient.post<Coupon>('/api/v1/coupons', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create coupon');
  },
  async updateCoupon(id: string, input: Partial<CouponInput>): Promise<Coupon> {
    const res = await apiClient.put<Coupon>(`/api/v1/coupons/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update coupon ${id}`);
  },
  async deleteCoupon(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/coupons/${id}`);
    if (!res.success) throw new Error(`Failed to delete coupon ${id}`);
  },
  async getAnalytics(id: string): Promise<CouponAnalytics> {
    const res = await apiClient.get<CouponAnalytics>(`/api/v1/coupons/${id}/analytics`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to fetch analytics for coupon ${id}`);
  },
};
