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

/** One day's earnings, from `GET /admin/riders/:id/earnings`. */
export interface RiderDailyEarning {
  date: string;
  total: number;
  deliveries: number;
}

/** Earnings summary + up-to-30-day daily breakdown for a rider. */
export interface RiderEarnings {
  summary: {
    total: number;
    delivery_count: number;
    avg_per_delivery: number;
  };
  daily: RiderDailyEarning[];
}

/** Result of the shop-side "add a rider" phone search. */
export interface RiderSearchResult {
  id: string;
  name: string | null;
  phone: string;
  avatar_url: string | null;
  is_active: boolean;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_approved: boolean;
  is_online: boolean;
  /** true/false for a shop-scoped caller (already assigned to MY shop
   * or not); null for an HQ (no-shop) search, where the question is
   * meaningless. */
  assigned_to_my_shop: boolean | null;
}

/** A KYC document the rider uploaded from the app (rider_documents). */
export interface RiderDocument {
  id: string;
  rider_id: string;
  /** aadhaar | aadhaar_back | license | vehicle_rc | pan | photo | bank_proof */
  type: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  uploaded_at: string;
  verified_at: string | null;
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

  /** Earnings summary + daily breakdown. Pass matching ISO dates
   * (`YYYY-MM-DD`) for `startDate`/`endDate` to scope to "today"; omit
   * both for all-time. */
  async getEarnings(
    riderId: string,
    range?: { startDate?: string; endDate?: string },
  ): Promise<RiderEarnings> {
    const res = await apiClient.get<RiderEarnings>(
      `/api/v1/admin/riders/${riderId}/earnings`,
      range as Record<string, any> | undefined,
    );
    if (res.success && res.data) return res.data;
    return { summary: { total: 0, delivery_count: 0, avg_per_delivery: 0 }, daily: [] };
  },

  /**
   * The "add a rider" lookup — bounded to one exact phone number, never
   * a roster browse. Returns null when nothing matches (a 404, not an
   * error — the caller shows "no rider found", not a toast).
   */
  async searchByPhone(phone: string): Promise<RiderSearchResult | null> {
    const res = await apiClient.get<RiderSearchResult>(
      '/api/v1/admin/riders/search-by-phone',
      { phone },
    );
    return (res.success && res.data) ? res.data : null;
  },

  /**
   * Assigns/unassigns a rider to/from the CALLER'S OWN shop only — the
   * shop-scoped counterpart to `replaceStoreAssignments`, which a
   * shop-staff session must never call (it can replace a DIFFERENT
   * shop's assignment). No `shopId` parameter here on purpose: the
   * backend resolves it from the caller's own JWT/X-Shop-Id, never a
   * client-supplied value.
   */
  async setMyShopAssignment(riderId: string, active: boolean): Promise<RiderStoreAssignment> {
    const res = await apiClient.put<RiderStoreAssignment>(
      `/api/v1/admin/riders/${riderId}/my-shop-assignment`,
      { active },
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to update the rider’s shop assignment');
  },

  /** Replaces the rider's active store set (idempotent PUT). HQ only —
   * a shop-scoped caller must use `setMyShopAssignment` instead. */
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

  /** KYC documents the rider has uploaded. */
  async getDocuments(riderId: string): Promise<RiderDocument[]> {
    const res = await apiClient.get<RiderDocument[]>(
      `/api/v1/admin/riders/${riderId}/documents`,
    );
    return (res.success && Array.isArray(res.data)) ? res.data : [];
  },

  /** Approve or reject one document (a rejection carries the reason the rider sees). */
  async verifyDocument(
    riderId: string,
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ): Promise<void> {
    const res = await apiClient.put(
      `/api/v1/admin/riders/${riderId}/documents/${documentId}/verify`,
      { status, ...(note ? { note } : {}) },
    );
    if (!res.success) throw new Error(res.message || 'Failed to update document');
  },

  /** Convenience: numeric coercion for display. */
  toNumber: num,
};
