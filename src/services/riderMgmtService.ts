import { apiClient } from './apiClient';

// Shapes from the real admin riders module (src/modules/admin/riders on
// the backend). is_busy is a computed flag (EXISTS over non-terminal
// delivery_assignments) added in the rider rebuild's Big Phase 6.

export interface AdminRider {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  is_active: boolean;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_approved: boolean;
  is_online: boolean;
  /** True while the rider holds a non-terminal delivery assignment. */
  is_busy?: boolean;
  rating: number | string | null;
  total_deliveries: number | string | null;
  commission_rate: number | string | null;
  current_lat: number | string | null;
  current_lng: number | string | null;
  created_at: string;
}

export interface RiderStoreAssignment {
  id: string;
  rider_id: string;
  shop_id: string;
  is_active: boolean;
  shop_name: string;
  shop_address: string | null;
  created_at: string;
}

export interface RiderCollection {
  id: string;
  order_id: string;
  order_number?: string;
  rider_id: string;
  amount_due: number | string;
  cash_amount: number | string;
  upi_amount: number | string;
  total_collected: number | string;
  status: 'COLLECTED' | 'SETTLED';
  collected_at: string;
}

export interface RiderSettlement {
  id: string;
  rider_id: string;
  amount: number | string;
  method: 'CASH' | 'BANK_TRANSFER' | 'UPI';
  reference: string | null;
  status: 'SETTLED' | 'PENDING';
  settled_by: string;
  created_at: string;
}

const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const riderMgmtService = {
  /** Paged rider list with search + status filters (is_busy included). */
  async listRiders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'online' | 'offline' | 'pending' | 'suspended';
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ riders: AdminRider[]; total: number }> {
    const res = await apiClient.get<{ riders: AdminRider[]; total: number }>(
      '/api/v1/admin/riders',
      params as Record<string, any>,
    );
    if (res.success && res.data) {
      return { riders: res.data.riders ?? [], total: res.data.total ?? 0 };
    }
    throw new Error(res.message || 'Failed to fetch riders');
  },

  /** Approve or un-approve a rider. */
  async setApproval(riderId: string, approved: boolean): Promise<void> {
    await apiClient.put(`/api/v1/admin/riders/${riderId}/approve`, {
      is_approved: approved,
    });
  },

  /** Suspend / unsuspend; suspension also forces the rider offline. */
  async setSuspended(riderId: string, suspended: boolean): Promise<void> {
    await apiClient.put(`/api/v1/admin/riders/${riderId}/suspend`, {
      suspended,
    });
  },

  /** The rider's store assignments (eligibility editor). */
  async getStoreAssignments(riderId: string): Promise<RiderStoreAssignment[]> {
    const res = await apiClient.get<RiderStoreAssignment[]>(
      `/api/v1/admin/riders/${riderId}/assignments`,
    );
    return (res.success && Array.isArray(res.data)) ? res.data : [];
  },

  /** Replaces the rider's active store set (idempotent PUT). */
  async replaceStoreAssignments(riderId: string, shopIds: string[]): Promise<void> {
    await apiClient.put(`/api/v1/admin/riders/${riderId}/assignments`, {
      shopIds,
    });
  },

  /** COD collections the rider has recorded. */
  async getCollections(riderId: string): Promise<RiderCollection[]> {
    const res = await apiClient.get<RiderCollection[]>(
      `/api/v1/admin/riders/${riderId}/collections`,
    );
    return (res.success && Array.isArray(res.data)) ? res.data : [];
  },

  /** Settlement history for the rider. */
  async getSettlements(riderId: string): Promise<RiderSettlement[]> {
    const res = await apiClient.get<RiderSettlement[]>(
      `/api/v1/admin/riders/${riderId}/settlements`,
    );
    return (res.success && Array.isArray(res.data)) ? res.data : [];
  },

  /** Records a cash settlement and settles the rider's pending cash. */
  async createSettlement(
    riderId: string,
    payload: { amount: number; method?: 'CASH' | 'BANK_TRANSFER' | 'UPI'; reference?: string },
  ): Promise<RiderSettlement> {
    const res = await apiClient.post<RiderSettlement>(
      `/api/v1/admin/riders/${riderId}/settlements`,
      payload,
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to record settlement');
  },

  /** Sets the business UPI id behind the rider's collect-sheet QR. */
  async setBusinessUpi(riderId: string, businessUpiId: string): Promise<void> {
    await apiClient.put(`/api/v1/admin/riders/${riderId}/business-upi`, {
      businessUpiId,
    });
  },

  /** Convenience: numeric coercion for display. */
  toNumber: num,
};
