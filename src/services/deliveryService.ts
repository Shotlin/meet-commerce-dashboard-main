import { apiClient } from './apiClient';

// Real shape from GET /api/v1/admin/riders/live-locations — the previous
// version of this file called /api/v1/deliveries (no such route exists;
// riders.controller.js's real admin endpoints live under /api/v1/admin/riders).
// delivery_status/order_id are only present while the rider has an active
// assignment (ASSIGNED/ACCEPTED/PICKED_UP/IN_TRANSIT) — null otherwise.
export interface LiveRider {
  id: string;
  name: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
  vehicle_type: string | null;
  is_online: boolean;
  order_id: string | null;
  delivery_status: 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | null;
}

export interface AssignableRider {
  id: string;
  name: string;
  phone: string;
  is_approved: boolean;
  is_online: boolean;
  vehicle_type: string | null;
}

export const deliveryService = {
  async getLiveRiders(): Promise<LiveRider[]> {
    const res = await apiClient.get<LiveRider[]>('/api/v1/admin/riders/live-locations');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error('Failed to fetch live rider locations from API');
  },

  async getAssignableRiders(): Promise<AssignableRider[]> {
    const res = await apiClient.get<{ riders: AssignableRider[] }>('/api/v1/admin/riders', {
      limit: 100,
    });
    if (res.success && Array.isArray(res.data?.riders)) {
      return res.data.riders.filter((rider) => rider.is_approved);
    }
    throw new Error('Failed to fetch approved riders from API');
  },
};
