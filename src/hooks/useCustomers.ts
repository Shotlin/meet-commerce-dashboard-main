// Compatibility hooks wrapping the existing, real customerService.ts
// (Phase 1) in bakaloo-dashboard's useCustomers.ts hook-name convention —
// so the ported CustomerProfileDrawer works unmodified against real data.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';

export function useCustomerDetail(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'detail', id ?? ''],
    queryFn: () => customerService.getDetail(id!),
    enabled: !!id,
  });
}

export function useCustomerOrders(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'orders', id ?? ''],
    queryFn: async () => ({ orders: await customerService.getOrders(id!) }),
    enabled: !!id,
  });
}

export function useCustomerAddresses(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'addresses', id ?? ''],
    queryFn: () => customerService.getAddresses(id!),
    enabled: !!id,
  });
}

export function useToggleBlockCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => customerService.toggleBlock(id, blocked),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useCreditWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, description }: { id: string; amount: number; description?: string }) =>
      customerService.creditWallet(id, amount, description),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDebitWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, description }: { id: string; amount: number; description?: string }) =>
      customerService.debitWallet(id, amount, description),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useNotifyCustomer() {
  return useMutation({
    mutationFn: ({ id, title, body }: { id: string; title: string; body: string }) =>
      customerService.sendNotification(id, title, body),
  });
}
