import { apiClient } from './apiClient';

export type FeeType = 'FLAT' | 'PERCENT';

// Matches the fee_settings table exactly (snake_case) — the backend's Zod
// update schema uses these same keys, so no adapter is needed either way.
export interface FeeSettings {
  id?: string;
  scope?: 'GLOBAL' | 'SHOP';
  shop_id?: string | null;
  is_active: boolean;

  delivery_fee_enabled: boolean;
  min_delivery_fee: number;
  base_distance_km: number;
  per_km_fee: number;
  max_delivery_distance_km: number | null;
  free_delivery_enabled: boolean;
  free_delivery_above: number | null;

  handling_fee_enabled: boolean;
  handling_fee_type: FeeType;
  handling_fee_value: number;
  handling_fee_label: string;
  handling_fee_description: string | null;

  platform_fee_enabled: boolean;
  platform_fee_type: FeeType;
  platform_fee_value: number;
  platform_fee_label: string;
  platform_fee_description: string | null;

  small_cart_fee_enabled: boolean;
  small_cart_threshold: number;
  small_cart_fee: number;
  small_cart_fee_label: string;
  small_cart_fee_description: string | null;

  surge_fee_enabled: boolean;
  surge_fee_value: number;
  surge_fee_label: string;
  surge_fee_description: string | null;

  packaging_fee_enabled: boolean;
  packaging_fee_value: number;
  packaging_fee_label: string;
  packaging_fee_description: string | null;

  delivery_eta_minutes: number;

  quick_delivery_surcharge_enabled: boolean;
  quick_delivery_surcharge_amount: number;
  quick_delivery_surcharge_label: string;
  quick_delivery_eta_minutes: number;

  gst_enabled: boolean;
  gst_rate: number;
  gst_label: string;

  created_at?: string;
  updated_at?: string;
}

export type FeeSettingsInput = Partial<
  Omit<FeeSettings, 'id' | 'scope' | 'shop_id' | 'created_at' | 'updated_at'>
>;

export interface FeePreviewFee {
  code: string;
  label: string;
  amount: number;
  originalAmount: number;
  waived: boolean;
  description: string;
  metadata: Record<string, unknown>;
}

export interface FeePreview {
  itemsSubtotal: number;
  deliveryFee: number;
  deliveryFeeWaived: boolean;
  deliveryFeeWaiverReason: string | null;
  handlingFee: number;
  platformFee: number;
  smallCartFee: number;
  surgeFee: number;
  packagingFee: number;
  quickDeliverySurcharge: number;
  tax: number;
  totalPayable: number;
  distance: { km: number | null; label: string; known: boolean };
  freeDelivery: { enabled: boolean; threshold: number | null; unlocked: boolean; amountToUnlock: number };
  deliveryEtaMinutes: number;
  fees: FeePreviewFee[];
  configSource: string;
}

export interface ShopBasic {
  id: string;
  name: string;
}

export const feeSettingsService = {
  async getGlobal(): Promise<FeeSettings> {
    const res = await apiClient.get<FeeSettings>('/api/v1/admin/fee-settings');
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch fee settings');
  },

  async getForShop(shopId: string): Promise<FeeSettings> {
    const res = await apiClient.get<FeeSettings>('/api/v1/admin/fee-settings', { shopId });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch shop fee settings');
  },

  async updateGlobal(input: FeeSettingsInput): Promise<FeeSettings> {
    const res = await apiClient.put<FeeSettings>('/api/v1/admin/fee-settings', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to update fee settings');
  },

  async updateShop(shopId: string, input: FeeSettingsInput): Promise<FeeSettings> {
    const res = await apiClient.put<FeeSettings>(`/api/v1/admin/fee-settings/shops/${shopId}`, input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to update shop fee settings');
  },

  async preview(input: { subtotal: number; distanceKm?: number; shopId?: string }): Promise<FeePreview> {
    const res = await apiClient.post<FeePreview>('/api/v1/admin/fee-settings/preview', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to compute fee preview');
  },

  // Minimal shop lookup for the per-shop override / preview selectors —
  // GET /api/v1/shops returns { shops: [...], total, page, limit }, not a
  // flat array (unlike what ShopsPage.tsx currently assumes — that page's
  // own fetch is a separate, pre-existing bug fixed in mini-phase 9).
  async listShopsBasic(): Promise<ShopBasic[]> {
    const res = await apiClient.get<{ shops: any[] }>('/api/v1/shops');
    if (res.success && res.data && Array.isArray(res.data.shops)) {
      return res.data.shops.map((s) => ({ id: s.id, name: s.name }));
    }
    throw new Error('Failed to fetch shops');
  },
};
