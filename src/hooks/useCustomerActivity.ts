import { useQuery } from '@tanstack/react-query';

import {
  resolveCustomerActivityUser,
  searchCustomerActivityUsers,
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

/** Real-time search-as-you-type suggestions shown in the lookup dropdown. */
export function useSearchCustomerActivityUsers(query: string) {
  return useQuery({
    queryKey: ['customer-activity', 'search-users', query] as const,
    queryFn: () => searchCustomerActivityUsers(query),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
    retry: false,
    placeholderData: (prev) => prev,
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
