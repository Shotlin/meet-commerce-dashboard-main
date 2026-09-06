import { apiClient } from './apiClient';

export interface CustomerListRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  loyalty_points: number;
  wallet_balance: number;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface CustomerListResult {
  customers: CustomerListRow[];
  activeToday: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface LtvRow {
  id: string; name: string; phone: string; email: string | null; created_at: string;
  ltv: number; order_count: number; avg_order_value: number; days_since_signup: number;
}

export interface ChurnedRow {
  id: string; name: string; phone: string; email: string | null;
  last_order_at: string; order_count: number; total_spent: number;
}

export interface VipRow {
  id: string; name: string; phone: string; email: string | null; loyalty_points: number;
  wallet_balance: number; order_count: number; total_spent: number; avg_order_value: number; last_order_at: string | null;
}

export interface CustomerDetail extends CustomerListRow {
  role: string;
  avg_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  returned_orders: number;
}

export interface CustomerOrderRow {
  id: string;
  order_number: string;
  status: string;
  total_payable: string | number;
  payment_method: string;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  deleted_at: string | null;
}

export interface TimelineEvent {
  eventType: string;
  eventAt: string;
  meta: Record<string, unknown>;
}

export const customerService = {
  async getCustomers(params: { page?: number; limit?: number; search?: string; status?: 'active' | 'blocked' } = {}): Promise<CustomerListResult> {
    const res = await apiClient.get<CustomerListResult>('/api/v1/admin/customers', params);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch customers');
  },
  async getLTV(): Promise<LtvRow[]> {
    const res = await apiClient.get<LtvRow[]>('/api/v1/admin/customers/ltv');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch LTV report');
  },
  async getChurned(days = 30): Promise<ChurnedRow[]> {
    const res = await apiClient.get<ChurnedRow[]>('/api/v1/admin/customers/churned', { days });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch churned customers');
  },
  async getVIP(minOrders = 10): Promise<VipRow[]> {
    const res = await apiClient.get<VipRow[]>('/api/v1/admin/customers/vip', { minOrders });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch VIP customers');
  },
  async getDetail(id: string): Promise<CustomerDetail> {
    const res = await apiClient.get<CustomerDetail>(`/api/v1/admin/customers/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to fetch customer ${id}`);
  },
  async getOrders(id: string): Promise<CustomerOrderRow[]> {
    const res = await apiClient.get<{ orders: CustomerOrderRow[] }>(`/api/v1/admin/customers/${id}/orders`);
    if (res.success && res.data) return res.data.orders;
    throw new Error(`Failed to fetch orders for customer ${id}`);
  },
  async getAddresses(id: string): Promise<CustomerAddress[]> {
    const res = await apiClient.get<CustomerAddress[]>(`/api/v1/admin/customers/${id}/addresses`);
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error(`Failed to fetch addresses for customer ${id}`);
  },
  async creditWallet(id: string, amount: number, description?: string): Promise<number> {
    const res = await apiClient.post<{ wallet_balance: number }>(`/api/v1/admin/customers/${id}/credit-wallet`, { amount, description });
    if (res.success && res.data) return res.data.wallet_balance;
    throw new Error(`Failed to credit wallet for customer ${id}`);
  },
  async debitWallet(id: string, amount: number, description?: string): Promise<number> {
    const res = await apiClient.post<{ wallet_balance: number }>(`/api/v1/admin/customers/${id}/debit-wallet`, { amount, description });
    if (res.success && res.data) return res.data.wallet_balance;
    throw new Error(`Failed to debit wallet for customer ${id}`);
  },
  async sendNotification(id: string, title: string, body: string): Promise<void> {
    const res = await apiClient.post<null>(`/api/v1/admin/customers/${id}/notify`, { title, body });
    if (!res.success) throw new Error(`Failed to notify customer ${id}`);
  },
  async toggleBlock(id: string, blocked: boolean): Promise<void> {
    const res = await apiClient.put<null>(`/api/v1/admin/customers/${id}/block`, { blocked });
    if (!res.success) throw new Error(`Failed to update block status for customer ${id}`);
  },
  async getTimeline(userId: string): Promise<TimelineEvent[]> {
    const res = await apiClient.get<TimelineEvent[]>(`/api/v1/admin/customer-activity/${userId}/timeline`);
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error(`Failed to fetch activity timeline for ${userId}`);
  },
};
