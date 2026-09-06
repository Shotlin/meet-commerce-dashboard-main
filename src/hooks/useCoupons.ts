import { useQuery } from '@tanstack/react-query';
import { couponService } from '../services/couponService';

// Minimal compatibility hook — wraps the existing flat couponService.getCoupons()
// in the {data: Coupon[]} shape the ported SendCouponDialog expects.
export function useCoupons(_params: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => ({ data: await couponService.getCoupons() }),
    staleTime: 30_000,
  });
}
