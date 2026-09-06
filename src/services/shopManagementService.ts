import { apiClient } from './apiClient';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  branch_code: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: string | number;
  lng: string | number;
  serviceable_pincodes: string[];
  delivery_radius_km: string | number;
  pincode_only: boolean;
  is_active: boolean;
  is_verified: boolean;
  operating_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  commission_rate: string | number;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  bank_holder_name: string | null;
  gst_number: string | null;
  pan_number: string | null;
  total_orders: number;
  total_revenue: string | number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Body shape accepted by POST /api/v1/shops (see backend shops.schema.js
// createShopSchema) — only the fields the dashboard actually collects.
export interface ShopCreateInput {
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  serviceable_pincodes?: string[];
  delivery_radius_km?: number;
  pincode_only?: boolean;
  operating_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  commission_rate?: number;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  bank_holder_name?: string;
  gst_number?: string;
  pan_number?: string;
}

export type ShopUpdateInput = Partial<ShopCreateInput> & { is_active?: boolean; is_verified?: boolean };

// Two shapes accepted by POST /api/v1/shops/:shopId/staff (see backend
// shop-staff.schema.js) — attach an existing user, or provision a new one.
export type ShopStaffCreateInput =
  | { user_id: string; role: ShopStaff['role']; permissions?: string[]; is_active?: boolean }
  | {
      email: string;
      name: string;
      phone?: string;
      role: ShopStaff['role'];
      permissions?: string[];
      is_active?: boolean;
      generate_temp_password?: boolean;
      password?: string;
    };

export interface ShopStaffUpdateInput {
  role?: ShopStaff['role'];
  permissions?: string[];
  is_active?: boolean;
}

export interface ShopStaff {
  id: string;
  user_id: string;
  shop_id: string;
  role: 'SHOP_ADMIN' | 'SHOP_MANAGER' | 'SHOP_STAFF' | 'SHOP_VIEWER';
  is_active: boolean;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  created_at: string;
}

export interface ShopFinancialPeriod {
  id: string;
  shop_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  gross_revenue: string | number;
  net_revenue: string | number;
  total_orders: number;
  platform_commission: string | number;
  payout_amount: string | number;
  payout_status: string;
  paid_at: string | null;
}

export interface ShopTransaction {
  id: string;
  shop_id: string;
  type: string;
  amount: string | number;
  balance_after: string | number;
  direction: 'CREDIT' | 'DEBIT';
  status: string;
  description: string | null;
  created_at: string;
}

export interface ShopProductRow {
  id: string;
  shop_id: string;
  price: string | number;
  sale_price: string | number | null;
  stock_quantity: number;
  is_available: boolean;
  approval_status: string;
  product: { id: string; name: string | null; sku: string | null; category_name: string | null };
}

// GET /api/v1/shops returns { shops: [...], total, page, limit } — NOT a
// flat array. The dashboard previously assumed a flat array and silently
// rendered nothing (confirmed while building the fee-settings shop
// selector in mini-phase 2).
export const shopManagementService = {
  async getShops(): Promise<Shop[]> {
    const res = await apiClient.get<{ shops: Shop[] }>('/api/v1/shops');
    if (res.success && res.data && Array.isArray(res.data.shops)) return res.data.shops;
    throw new Error('Failed to fetch shops');
  },

  async getShop(id: string): Promise<Shop> {
    const res = await apiClient.get<{ shop: Shop } | Shop>(`/api/v1/shops/${id}`);
    if (res.success && res.data) {
      return 'shop' in (res.data as any) ? (res.data as any).shop : (res.data as Shop);
    }
    throw new Error('Failed to fetch shop');
  },

  async createShop(input: ShopCreateInput): Promise<Shop> {
    const res = await apiClient.post<{ shop: Shop } | Shop>('/api/v1/shops', input);
    if (res.success && res.data) {
      return 'shop' in (res.data as any) ? (res.data as any).shop : (res.data as Shop);
    }
    throw new Error(res.message || 'Failed to create shop');
  },

  async updateShop(id: string, input: ShopUpdateInput): Promise<Shop> {
    const res = await apiClient.patch<{ shop: Shop } | Shop>(`/api/v1/shops/${id}`, input);
    if (res.success && res.data) {
      return 'shop' in (res.data as any) ? (res.data as any).shop : (res.data as Shop);
    }
    throw new Error(res.message || 'Failed to update shop');
  },

  async deleteShop(id: string): Promise<void> {
    const res = await apiClient.delete(`/api/v1/shops/${id}`);
    if (!res.success) throw new Error(res.message || 'Failed to delete shop');
  },

  async getStaff(shopId: string): Promise<ShopStaff[]> {
    const res = await apiClient.get<{ staff: ShopStaff[] }>(`/api/v1/shops/${shopId}/staff`);
    if (res.success && res.data) return res.data.staff;
    throw new Error('Failed to fetch shop staff');
  },

  async createStaff(shopId: string, input: ShopStaffCreateInput): Promise<ShopStaff & { temp_password?: string }> {
    const res = await apiClient.post<{ staff: ShopStaff & { temp_password?: string } } | (ShopStaff & { temp_password?: string })>(
      `/api/v1/shops/${shopId}/staff`,
      input
    );
    if (res.success && res.data) {
      return 'staff' in (res.data as any) ? (res.data as any).staff : (res.data as any);
    }
    throw new Error(res.message || 'Failed to add staff member');
  },

  async updateStaff(shopId: string, staffId: string, input: ShopStaffUpdateInput): Promise<ShopStaff> {
    const res = await apiClient.patch<{ staff: ShopStaff } | ShopStaff>(`/api/v1/shops/${shopId}/staff/${staffId}`, input);
    if (res.success && res.data) {
      return 'staff' in (res.data as any) ? (res.data as any).staff : (res.data as ShopStaff);
    }
    throw new Error(res.message || 'Failed to update staff member');
  },

  async deleteStaff(shopId: string, staffId: string): Promise<void> {
    const res = await apiClient.delete(`/api/v1/shops/${shopId}/staff/${staffId}`);
    if (!res.success) throw new Error(res.message || 'Failed to remove staff member');
  },

  async resetStaffPassword(shopId: string, staffId: string): Promise<{ temp_password: string }> {
    const res = await apiClient.post<{ temp_password: string }>(`/api/v1/shops/${shopId}/staff/${staffId}/reset-password`);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to reset password');
  },

  async getFinancials(shopId: string): Promise<ShopFinancialPeriod[]> {
    const res = await apiClient.get<{ items: ShopFinancialPeriod[] }>('/api/v1/shop-financials', undefined, { 'X-Shop-Id': shopId });
    if (res.success && res.data) return res.data.items;
    throw new Error('Failed to fetch shop financials');
  },

  async getTransactions(shopId: string): Promise<ShopTransaction[]> {
    const res = await apiClient.get<{ items: ShopTransaction[] }>('/api/v1/shop-transactions', undefined, { 'X-Shop-Id': shopId });
    if (res.success && res.data) return res.data.items;
    throw new Error('Failed to fetch shop transactions');
  },

  async getProducts(shopId: string): Promise<ShopProductRow[]> {
    const res = await apiClient.get<{ items: ShopProductRow[] }>('/api/v1/shop-products', undefined, { 'X-Shop-Id': shopId });
    if (res.success && res.data) return res.data.items;
    throw new Error('Failed to fetch shop products');
  },
};
