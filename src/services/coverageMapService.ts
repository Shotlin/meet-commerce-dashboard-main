import { apiClient } from './apiClient';

export interface CoverageCustomer {
  userId: string;
  name: string | null;
  initial: string;
  lat: number;
  lng: number;
  pincode: string | null;
  hasActiveOrder: boolean;
}

export interface CoverageBoundary {
  pincode: string;
  count: number;
  /** [lat, lng] pairs forming a closed polygon ring. */
  polygon: [number, number][];
}

export interface CoverageShop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
  deliveryRadiusKm: number | null;
  pincodeOnly: boolean;
}

export interface CoverageMapData {
  shop: CoverageShop;
  serviceablePincodes: string[];
  uncoveredPincodes: string[];
  customers: CoverageCustomer[];
  boundaries: CoverageBoundary[];
  totalCustomers: number;
}

export interface LiveRiderLocation {
  id: string;
  name: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
  vehicle_type: string | null;
  is_online: boolean;
  location_updated_at: string | null;
  order_id: string | null;
  delivery_status: 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | null;
}

export interface OlaStyleInfo {
  configured: boolean;
  styleUrl: string | null;
}

export const coverageMapService = {
  async getCoverage(shopId: string): Promise<CoverageMapData> {
    const res = await apiClient.get<CoverageMapData>(`/api/v1/admin/coverage-map/${shopId}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to load coverage map');
  },

  /** Riders currently on an open delivery for orders belonging to this shop. */
  async getShopLiveRiders(shopId: string): Promise<LiveRiderLocation[]> {
    const res = await apiClient.get<LiveRiderLocation[]>('/api/v1/admin/riders/live-locations', { shopId });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error(res.message || 'Failed to load live rider locations');
  },

  async getOlaStyleInfo(): Promise<OlaStyleInfo> {
    const res = await apiClient.get<OlaStyleInfo>('/api/v1/maps/ola/style-url');
    if (res.success && res.data) return res.data;
    return { configured: false, styleUrl: null };
  },
};
