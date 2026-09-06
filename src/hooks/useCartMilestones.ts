import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCartMilestones,
  createCartMilestone,
  updateCartMilestone,
  deleteCartMilestone,
} from '../services/cart-milestones.service';
import type { CreateCartMilestonePayload, UpdateCartMilestonePayload } from '../types/cart-milestone.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function useCartMilestones() {
  return useQuery({
    queryKey: ['cart-milestones'],
    queryFn: getCartMilestones,
    staleTime: 30_000,
  });
}

export function useCreateCartMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCartMilestonePayload) => createCartMilestone(payload),
    onSuccess: () => {
      toast.success('Cart milestone created');
      qc.invalidateQueries({ queryKey: ['cart-milestones'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateCartMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCartMilestonePayload }) =>
      updateCartMilestone(id, payload),
    onSuccess: () => {
      toast.success('Cart milestone updated');
      qc.invalidateQueries({ queryKey: ['cart-milestones'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteCartMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCartMilestone(id),
    onSuccess: () => {
      toast.success('Cart milestone deleted');
      qc.invalidateQueries({ queryKey: ['cart-milestones'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
