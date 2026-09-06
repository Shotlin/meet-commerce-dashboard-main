import { useQuery } from '@tanstack/react-query';

import {
  resolveCustomerActivityUser,
  getCustomerActivityTimeline,
} from '../services/customer-activity.service';
import type { CustomerActivityFilters } from '../types/customer-activity.types';

export function useResolveCustomerActivityUser(query: string) {
  return useQuery({
    queryKey: ['customer-activity', 'resolve-user', query] as const,
    queryFn: () => resolveCustomerActivityUser(query),
    enabled: query.trim().length >= 3,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCustomerActivityTimeline(
  userId: string | null,
  filters: CustomerActivityFilters
) {
  return useQuery({
    queryKey: ['customer-activity', 'timeline', userId, filters] as const,
    queryFn: () => getCustomerActivityTimeline(userId as string, filters),
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
