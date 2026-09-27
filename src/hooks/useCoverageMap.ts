import { useQuery } from '@tanstack/react-query';
import { coverageMapService } from '../services/coverageMapService';
import { queryKeys } from '../services/queryKeys';

/** The coverage snapshot (shop pin, pincode boundaries, customer pins) for one shop. */
export function useCoverageMap(shopId: string | null) {
  return useQuery({
    queryKey: queryKeys.coverageMap.forShop(shopId),
    queryFn: () => coverageMapService.getCoverage(shopId as string),
    enabled: Boolean(shopId),
    staleTime: 60_000,
  });
}

/** Riders currently delivering for this shop's orders — the REST baseline; useLiveRiderLocations layers live position updates on top. */
export function useShopLiveRiders(shopId: string | null) {
  return useQuery({
    queryKey: queryKeys.coverageMap.riders(shopId),
    queryFn: () => coverageMapService.getShopLiveRiders(shopId as string),
    enabled: Boolean(shopId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useOlaStyleInfo() {
  return useQuery({
    queryKey: queryKeys.coverageMap.olaStyle(),
    queryFn: () => coverageMapService.getOlaStyleInfo(),
    staleTime: 5 * 60_000,
  });
}
