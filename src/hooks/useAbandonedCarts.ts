import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAbandonedCarts,
  getAbandonedCartsSummary,
  getAbandonedCartDetail,
  sendAbandonedCartReminder,
  issueAbandonedCartCoupon,
} from '../services/abandoned-carts.service';
import type {
  AbandonedCartFilters,
  SendReminderPayload,
  IssueCouponPayload,
} from '../types/abandoned-cart.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function useAbandonedCarts(filters: AbandonedCartFilters = {}) {
  return useQuery({
    queryKey: ['abandoned-carts', filters],
    queryFn: () => getAbandonedCarts(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAbandonedCartsSummary() {
  return useQuery({
    queryKey: ['abandoned-carts', 'summary'],
    queryFn: getAbandonedCartsSummary,
    staleTime: 30_000,
  });
}

export function useAbandonedCartDetail(id: string | null) {
  return useQuery({
    queryKey: ['abandoned-carts', 'detail', id ?? ''],
    queryFn: () => getAbandonedCartDetail(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useSendAbandonedCartReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SendReminderPayload }) =>
      sendAbandonedCartReminder(id, payload),
    onSuccess: (_data, variables) => {
      toast.success('Reminder sent');
      qc.invalidateQueries({ queryKey: ['abandoned-carts'] });
      qc.invalidateQueries({ queryKey: ['abandoned-carts', 'detail', variables.id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useIssueAbandonedCartCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IssueCouponPayload }) =>
      issueAbandonedCartCoupon(id, payload),
    onSuccess: (_data, variables) => {
      toast.success('Coupon issued');
      qc.invalidateQueries({ queryKey: ['abandoned-carts'] });
      qc.invalidateQueries({ queryKey: ['abandoned-carts', 'detail', variables.id] });
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
