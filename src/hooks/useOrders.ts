// TanStack Query hooks for the rebuilt Orders module — wraps
// `adminOrdersService.ts` (real backend data, real mutations) following
// this project's existing query/cache conventions (see `useCustomers.ts`,
// `queryKeys.ts`).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrdersService } from '../services/adminOrdersService';
import { queryKeys } from '../services/queryKeys';
import { useShopScope } from '../context/ShopScopeContext';
import type {
  OrderFilters,
  RefundOrderPayload,
  CancelOrderPayload,
  RescheduleOrderPayload,
  RecordSettlementPayload,
} from '../types/order.types';

/** Stable cache-key fragment for the current shop scope ("all" vs a concrete id). */
function useShopKey(): string {
  const { activeShopId } = useShopScope();
  return activeShopId ?? 'all';
}

export function useOrders(filters: OrderFilters) {
  const shopKey = useShopKey();
  return useQuery({
    queryKey: queryKeys.adminOrders.list(shopKey, filters as Record<string, unknown>),
    queryFn: () => adminOrdersService.getOrders(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

export function useOrderStatusCounts() {
  const shopKey = useShopKey();
  return useQuery({
    queryKey: queryKeys.adminOrders.statusCounts(shopKey),
    queryFn: () => adminOrdersService.getStatusCounts(),
    staleTime: 15_000,
  });
}

/** "Customer money settled" — COD vs online vs wallet vs still pending, for exactly the filters the Orders page currently has applied. */
export function useSettlementSummary(filters: OrderFilters) {
  const shopKey = useShopKey();
  return useQuery({
    queryKey: queryKeys.adminOrders.settlementSummary(shopKey, filters as Record<string, unknown>),
    queryFn: () => adminOrdersService.getSettlementSummary(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminOrders.detail(orderId ?? ''),
    queryFn: () => adminOrdersService.getOrderDetail(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
  });
}

export function useOrderNotes(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminOrders.notes(orderId ?? ''),
    queryFn: () => adminOrdersService.getOrderNotes(orderId!),
    enabled: !!orderId,
  });
}

/** Lazily fetched only once the admin actually expands "Razorpay Details" — a live third-party call, not a free local read. */
export function useRazorpayDetails(orderId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminOrders.razorpayDetails(orderId ?? ''),
    queryFn: () => adminOrdersService.getRazorpayDetails(orderId!),
    enabled: !!orderId && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

function invalidateOrders(qc: ReturnType<typeof useQueryClient>, orderId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
  if (orderId) qc.invalidateQueries({ queryKey: queryKeys.adminOrders.detail(orderId) });
}

export function useAddOrderNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: string }) => adminOrdersService.addOrderNote(orderId, body),
    onSuccess: (_data, { orderId }) => qc.invalidateQueries({ queryKey: queryKeys.adminOrders.notes(orderId) }),
  });
}

export function useRecordSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: RecordSettlementPayload }) =>
      adminOrdersService.recordSettlement(orderId, payload),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useReverseSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, entryId, reason }: { orderId: string; entryId: string; reason?: string }) =>
      adminOrdersService.reverseSettlement(orderId, entryId, reason),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: string; note?: string }) =>
      adminOrdersService.updateOrderStatus(orderId, status, note),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useAssignRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) => adminOrdersService.assignRider(orderId, riderId),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useBulkAssignRiders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignments: { orderId: string; riderId: string }[]) => adminOrdersService.bulkAssignRiders(assignments),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: string[]; status: string }) => adminOrdersService.bulkUpdateStatus(orderIds, status),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useRescheduleOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: RescheduleOrderPayload }) =>
      adminOrdersService.rescheduleOrder(orderId, payload),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useRefundOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: RefundOrderPayload }) => adminOrdersService.refundOrder(orderId, payload),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: CancelOrderPayload }) => adminOrdersService.cancelOrder(orderId, payload),
    onSuccess: (_data, { orderId }) => invalidateOrders(qc, orderId),
  });
}

export function useResyncPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => adminOrdersService.reconcilePayment(orderId),
    onSuccess: (_data, orderId) => invalidateOrders(qc, orderId),
  });
}

export function useBulkReconcilePayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderIds: string[]) => adminOrdersService.bulkReconcilePayments(orderIds),
    onSuccess: () => invalidateOrders(qc),
  });
}
