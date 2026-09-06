import { Order, OrderStatus, VideoModerationStatus } from '../types';
import { apiClient } from './apiClient';

// Adapter function to map backend order payload to frontend Order interface
const adaptOrder = (b: any): Order => ({
  id: b.id || b._id || `ord-${Date.now()}`,
  orderNumber: b.orderNumber || b.order_number || b.id || 'MC-2026-0000',
  customerName: b.customerName || b.user?.name || b.delivery_address?.name || b.user?.phone || 'Customer',
  customerPhone: b.customerPhone || b.user?.phone || b.delivery_address?.phone || '+91 98000 00000',
  totalAmount: Number(b.totalAmount ?? b.total_amount ?? b.total_payable ?? b.total ?? b.amount ?? 0),
  status:
    b.status === 'DELIVERED'
      ? 'Delivered'
      : b.status === 'OUT_FOR_DELIVERY'
      ? 'Out for Delivery'
      : b.status === 'CUTTING_COMPLETED'
      ? 'Cutting Completed'
      : b.status === 'IN_QC'
      ? 'In QC'
      : b.status === 'CANCELLED'
      ? 'Cancelled'
      : b.status === 'RETURNED'
      ? 'Returned'
      : (b.status as OrderStatus) || 'Pending',
  paymentStatus:
    b.paymentStatus === 'PAID' || b.payment_status === 'PAID'
      ? 'Paid'
      : b.paymentStatus === 'REFUNDED'
      ? 'Refunded'
      : b.paymentStatus === 'FAILED'
      ? 'Failed'
      : 'Pending',
  deliveryAddress: b.deliveryAddress || b.delivery_address?.line1 || b.address?.address_line1 || 'Address On File',
  riderName: b.riderName || b.rider?.name,
  createdAt: b.createdAt || b.created_at || new Date().toISOString(),
  warehouseLocation: b.warehouseLocation || b.shopName || 'HQ Central FC',
  cuttingEvidenceUrl: b.cuttingEvidenceUrl || b.video_evidence_url || '/assets/banner-01-premium-lamb.png',
  videoModerationStatus:
    b.videoModerationStatus === 'APPROVED' || b.videoModerationStatus === 'Approved'
      ? 'Approved'
      : b.videoModerationStatus === 'REJECTED' || b.videoModerationStatus === 'Rejected'
      ? 'Rejected'
      : 'Pending Review',
  weightVarianceKg: b.weightVarianceKg ?? 0.045,
  lotTraceIds: Array.isArray(b.lotTraceIds) ? b.lotTraceIds : ['LOT-MEAT-4921'],
  items: Array.isArray(b.items)
    ? b.items.map((item: any, idx: number) => ({
        id: item.id || `item-${idx}`,
        productName: item.productName || item.product?.title || 'Fresh Meat Cut',
        category: item.category || 'Mutton',
        cutType: item.cutType || 'Standard Cut',
        declaredWeightKg: item.declaredWeightKg ?? item.quantity ?? 1.0,
        actualWeightKg: item.actualWeightKg ?? item.declaredWeightKg ?? 1.0,
        unitPrice: item.unitPrice ?? item.price ?? 500,
        totalPrice: item.totalPrice ?? item.total ?? 500,
        lotId: item.lotId || 'LOT-MEAT-4921',
      }))
    : [],
});

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<any[]>('/api/v1/orders');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(adaptOrder);
    }
    throw new Error('Failed to fetch orders from live backend API');
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const response = await apiClient.get<any>(`/api/v1/orders/${id}`);
    if (response.success && response.data) {
      return adaptOrder(response.data);
    }
    throw new Error(`Order ${id} not found on backend API`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<any>(`/api/v1/orders/${id}/status`, { status });
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
};
