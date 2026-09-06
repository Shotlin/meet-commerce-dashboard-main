import { apiClient } from './apiClient';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  branch_code: string;
  city: string;
  state: string;
  pincode: string;
  is_active: boolean;
  is_verified: boolean;
  commission_rate: string | number;
  total_orders: number;
  total_revenue: string | number;
  created_at: string;
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

  async getStaff(shopId: string): Promise<ShopStaff[]> {
    const res = await apiClient.get<{ staff: ShopStaff[] }>(`/api/v1/shops/${shopId}/staff`);
    if (res.success && res.data) return res.data.staff;
    throw new Error('Failed to fetch shop staff');
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
