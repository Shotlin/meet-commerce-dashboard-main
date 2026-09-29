import { apiClient } from './apiClient';

export interface ShiprocketSettings {
  configured: boolean;
  email: string | null;
  hasPassword: boolean;
  pickupLocation: string | null;
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
