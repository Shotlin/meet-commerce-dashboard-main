// React Query hooks for the vendor procurement module. Reads use the
// queryKeys.procurement factory; mutations toast via sonner and invalidate
// the procurement domain (mirrors useNotifications.ts).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '../services/queryKeys';
import {
  awardQuote,
  cancelRequest,
  createRequest,
  expireRequest,
  getRequestDetail,
  getSupplyOrderDetail,
  listQuotes,
  listRequests,
  listSupplyOrders,
  markSupplyDelivered,
  previewEligibleVendors,
  publishRequest,
  receiveSupply,
  updateRequest,
} from '../services/procurementService';
import type { ReceiveInput } from '../services/procurementService';
import type { ListParams } from '../services/procurementService';
import type {
  CreateRequestInput,
  SubmitQuoteInput,
  UpdateRequestInput,
} from '../types/procurement.types';

export function useProcurementRequests(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.procurement.list(params as Record<string, unknown>),
    queryFn: () => listRequests(params),
  });
}

export function useProcurementRequestDetail(requestId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.procurement.detail(requestId ?? ''),
    queryFn: () => getRequestDetail(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useProcurementQuotes(requestId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.procurement.quotes(requestId ?? ''),
    queryFn: () => listQuotes(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useSupplyOrders(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.procurement.supplies(params as Record<string, unknown>),
    queryFn: () => listSupplyOrders(params),
  });
}

export function useSupplyOrderDetail(supplyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.procurement.supplyDetail(supplyId ?? ''),
    queryFn: () => getSupplyOrderDetail(supplyId as string),
    enabled: Boolean(supplyId),
  });
}

function useInvalidateProcurement() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.procurement.all });
}

export function useCreateProcurementRequest() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: (payload: CreateRequestInput) => createRequest(payload),
    onSuccess: () => {
      toast.success('Draft requirement created');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create requirement'),
  });
}

export function useUpdateProcurementRequest() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: UpdateRequestInput }) =>
      updateRequest(requestId, payload),
    onSuccess: () => {
      toast.success('Draft updated');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update requirement'),
  });
}

export function usePublishProcurementRequest() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: (requestId: string) => publishRequest(requestId),
    onSuccess: (data) => {
      toast.success(`Requirement published to ${data.recipients?.length ?? 0} vendor(s)`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to publish requirement'),
  });
}

export function useCancelProcurementRequest() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      cancelRequest(requestId, reason),
    onSuccess: () => {
      toast.success('Requirement cancelled');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to cancel requirement'),
  });
}

export function useExpireProcurementRequest() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: (requestId: string) => expireRequest(requestId),
    onSuccess: () => {
      toast.success('Requirement marked expired');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to expire requirement'),
  });
}

export function useMarkSupplyDelivered() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: (supplyId: string) => markSupplyDelivered(supplyId),
    onSuccess: () => {
      toast.success('Marked delivered — awaiting receipt confirmation');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to mark delivered'),
  });
}

export function useReceiveSupply() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: ({ supplyId, payload }: { supplyId: string; payload: ReceiveInput }) =>
      receiveSupply(supplyId, payload),
    onSuccess: (data) => {
      const skipped = data.inventory?.filter((entry) => entry.inventory_skipped).length ?? 0;
      toast.success(
        skipped > 0
          ? 'Receipt confirmed — some items skipped inventory (no product mapping)'
          : 'Receipt confirmed — accepted stock added to inventory',
      );
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to confirm receipt'),
  });
}

export function useAwardQuote() {
  const invalidate = useInvalidateProcurement();
  return useMutation({
    mutationFn: (quoteId: string) => awardQuote(quoteId),
    onSuccess: (data) => {
      toast.success(`Vendor awarded — supply order ${data.supply_order?.supply_number ?? ''} created`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to award vendor'),
  });
}

export function useEligibleVendorPreview() {
  return useMutation({
    mutationFn: (payload: { shop_id: string; items?: Array<{ category_id: string }> }) =>
      previewEligibleVendors(payload),
    onError: (err: Error) => toast.error(err.message || 'Failed to preview eligible vendors'),
  });
}

// Kept for the vendor-app parity surface; the dashboard currently only reads
// quotes, but the API supports full lifecycle editing.
export type { SubmitQuoteInput };
