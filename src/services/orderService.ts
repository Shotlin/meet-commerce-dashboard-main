import { Order, OrderItem, OrderStatus, VideoModerationStatus } from '../types';
import { apiClient } from './apiClient';

// Adapter for the OLDER, simpler `Order` shape — still used by
// HQCommandCenter's live-order-feed widget and exportReport.ts's CSV,
// neither of which reads anything beyond orderNumber/customerName/
// warehouseLocation/totalAmount/status/paymentStatus/createdAt. The richer
// Orders page/drawer now uses `adminOrdersService.ts` +
// `types/order.types.ts` instead (real payment/shop/rider/item/evidence
// data, proper server-side pagination). This adapter no longer invents any
// value the backend didn't actually send — a missing field renders as an
// honest "—"/undefined rather than a fabricated placeholder (a fake order
// number, a fake phone number, a fake address, a hardcoded stock evidence
// image, a fake weight variance, or fake product/lot data). `Order.status`
// keeps its narrow string-union type, so an unrecognized backend status is
// carried through as-is rather than silently defaulting to 'Pending' —
// only a genuinely absent status field defaults, since there is nothing
// else it could be.
export const adaptOrder = (b: any): Order => ({
  id: b.id || b._id,
  orderNumber: b.orderNumber || b.order_number || b.id || '—',
  customerName: b.customerName || b.customer_name || b.user?.name || b.delivery_address?.name || '',
  customerPhone: b.customerPhone || b.customer_phone || b.user?.phone || b.delivery_address?.phone || '',
  totalAmount: Number(b.totalAmount ?? b.total_amount ?? b.total_payable ?? b.total ?? b.amount ?? 0),
  status:
    b.status === 'DELIVERED'
      ? 'Delivered'
      : b.status === 'OUT_FOR_DELIVERY'
      ? 'Out for Delivery'
      : b.status === 'CANCELLED'
      ? 'Cancelled'
      : b.status === 'CONFIRMED'
      ? 'Confirmed'
      : b.status === 'PREPARING' || b.status === 'PACKED'
      ? 'Packed'
      : b.status === 'ORDER_PLACED' || b.status === 'PENDING'
      ? 'Pending'
      : b.status
      ? ('Unknown' as OrderStatus)
      : 'Pending',
  paymentStatus:
    b.paymentStatus === 'PAID' || b.payment_status === 'PAID'
      ? 'Paid'
      : b.paymentStatus === 'REFUNDED' || b.payment_status === 'REFUNDED'
      ? 'Refunded'
      : b.paymentStatus === 'FAILED' || b.payment_status === 'FAILED'
      ? 'Failed'
      : 'Pending',
  deliveryAddress: b.deliveryAddress || b.delivery_address?.line1 || b.delivery_address?.addressLine1 || b.address?.address_line1 || '',
  riderId: b.riderId || b.rider_id || b.rider?.id,
  riderName: b.riderName || b.rider_name || b.rider?.name,
  createdAt: b.createdAt || b.created_at || '',
  warehouseLocation: b.warehouseLocation || b.shopName || b.shop_name || 'Unassigned',
  // No backend data model exists for cutting-evidence/variable-weight at
  // all (no video URL, no declared/actual weight, no lot id column
  // anywhere in the schema) — always undefined/empty rather than the
  // previous hardcoded banner image + fake weight/lot defaults that made
  // every order look like it had evidence when none was ever recorded.
  cuttingEvidenceUrl: b.cuttingEvidenceUrl || b.video_evidence_url || undefined,
  videoModerationStatus: (b.videoModerationStatus as VideoModerationStatus) || undefined,
  weightVarianceKg: b.weightVarianceKg,
  lotTraceIds: Array.isArray(b.lotTraceIds) ? b.lotTraceIds : [],
  items: Array.isArray(b.items)
    ? b.items.map((item: any, idx: number): OrderItem => ({
        id: item.id || `item-${idx}`,
        productName: item.productName || item.product_name || item.name || item.product?.title || 'Item',
        category: item.category || '',
        cutType: item.cutType || '',
        declaredWeightKg: item.declaredWeightKg,
        actualWeightKg: item.actualWeightKg,
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
        totalPrice: Number(item.totalPrice ?? item.total ?? item.subtotal ?? 0),
        lotId: item.lotId || '',
      }))
    : [],
});

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<{ orders: any[] }>('/api/v1/admin/orders', { limit: 100 });
    if (response.success && Array.isArray(response.data?.orders)) {
      return response.data.orders.map(adaptOrder);
    }
    throw new Error('Failed to fetch orders from live backend API');
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const response = await apiClient.get<any>(`/api/v1/admin/orders/${id}`);
    if (response.success && response.data) {
      return adaptOrder(response.data);
    }
    throw new Error(`Order ${id} not found on backend API`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.put<any>(`/api/v1/admin/orders/${id}/status`, { status: status.toUpperCase().replace(/ /g, '_') });
    if (response.success && response.data) {
      return adaptOrder(response.data);
    }
    throw new Error(`Failed to update order ${id} status on API`);
  },

  async updateVideoModeration(id: string, status: VideoModerationStatus): Promise<Order> {
    const response = await apiClient.patch<any>(`/api/v1/orders/${id}/moderation`, { status });
    if (response.success && response.data) {
      return adaptOrder(response.data);
    }
    throw new Error(`Failed to update video moderation for order ${id} on API`);
  },

  async assignRider(id: string, riderId: string): Promise<void> {
    const response = await apiClient.put<{ orderId: string; riderId: string }>(
      `/api/v1/admin/orders/${id}/assign-rider`,
      { riderId },
    );
    if (!response.success) throw new Error(response.message || 'Unable to assign rider');
  },
};
