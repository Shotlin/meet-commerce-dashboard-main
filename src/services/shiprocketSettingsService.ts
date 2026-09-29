import { apiClient } from './apiClient';

export interface ShiprocketSettings {
  configured: boolean;
  email: string | null;
  hasPassword: boolean;
  pickupLocation: string | null;
  deliveryPartner: 'OWN_RIDERS' | 'SHIPROCKET';
  lastTestedAt: string | null;
  lastTestStatus: 'SUCCESS' | 'FAILED' | null;
  lastTestMessage: string | null;
}

export interface ShiprocketTestResult {
  success: boolean;
  message: string;
  pickupLocations: { name: string; city: string; pin: string }[] | null;
}

const BASE = '/api/v1/admin/shiprocket';

export async function getShiprocketSettings(): Promise<ShiprocketSettings> {
  const res = await apiClient.get<ShiprocketSettings>(`${BASE}/settings`);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to fetch Shiprocket settings');
}

export async function saveShiprocketSettings(payload: {
  email?: string;
  password?: string;
  pickupLocation?: string;
  deliveryPartner?: 'OWN_RIDERS' | 'SHIPROCKET';
}): Promise<ShiprocketSettings> {
  const res = await apiClient.put<ShiprocketSettings>(`${BASE}/settings`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to save Shiprocket settings');
}

export async function testShiprocketConnection(payload: {
  email?: string;
  password?: string;
} = {}): Promise<ShiprocketTestResult> {
  const res = await apiClient.post<ShiprocketTestResult>(`${BASE}/test`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to test Shiprocket connection');
}

export interface ShiprocketShipment {
  order_id: string;
  sr_shipment_id: number | string | null;
  status: 'CREATED' | 'ASSIGNING' | 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  sr_status: string | null;
  awb_code: string | null;
  courier_name: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  tracking_url: string | null;
  last_error: string | null;
}

export interface ShiprocketCheck {
  eligible: boolean;
  available: boolean;
  reason: string | null;
  rate: number | null;
  courierName?: string;
}

const orderUrl = (id: string, action = '') => `${BASE}/orders/${id}${action}`;

export async function getOrderShipment(orderId: string): Promise<ShiprocketShipment | null> {
  const res = await apiClient.get<ShiprocketShipment | null>(orderUrl(orderId));
  if (res.success) return res.data ?? null;
  throw new Error(res.message || 'Failed to load Shiprocket delivery');
}

export async function checkOrderQuick(orderId: string): Promise<ShiprocketCheck> {
  const res = await apiClient.post<ShiprocketCheck>(orderUrl(orderId, '/check'), {});
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Check failed');
}

async function postShipment(orderId: string, action: string, fallback: string): Promise<ShiprocketShipment | null> {
  const res = await apiClient.post<ShiprocketShipment | null>(orderUrl(orderId, action), {});
  if (res.success) return res.data ?? null;
  throw new Error(res.message || fallback);
}

export const assignOrderToShiprocket = (id: string) => postShipment(id, '/assign', 'Could not assign to Shiprocket');
export const refreshOrderShipment = (id: string) => postShipment(id, '/refresh', 'Refresh failed');
export const cancelOrderShipment = (id: string) => postShipment(id, '/cancel', 'Could not cancel');
