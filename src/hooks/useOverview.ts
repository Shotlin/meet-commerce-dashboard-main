import { useQuery } from '@tanstack/react-query';
import { overviewService } from '../services/overviewService';
import { queryKeys } from '../services/queryKeys';
import { useShopScope } from '../context/ShopScopeContext';
import type { OverviewQuery } from '../types/overview.types';

export function useOverview(query: OverviewQuery) {
  const { activeShopId } = useShopScope();
  return useQuery({
    queryKey: queryKeys.overview.detail(activeShopId ?? 'all', query as unknown as Record<string, unknown>),
    queryFn: () => overviewService.getOverview(query),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
