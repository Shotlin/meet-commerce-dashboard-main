import { apiClient } from './apiClient';
import type {
  ActivateRazorpayModePayload,
  RazorpaySettings,
  RazorpayTestResult,
  SaveRazorpayCredentialsPayload,
  TestRazorpayCredentialsPayload,
} from '../types/razorpaySettings.types';

export async function getRazorpaySettings(): Promise<RazorpaySettings> {
  const res = await apiClient.get<RazorpaySettings>('/api/v1/admin/razorpay-settings');
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to fetch Razorpay settings');
}

export async function testRazorpayCredentials(
  payload: TestRazorpayCredentialsPayload,
): Promise<RazorpayTestResult> {
  const res = await apiClient.post<RazorpayTestResult>('/api/v1/admin/razorpay-settings/test', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to test Razorpay credentials');
}

export async function saveRazorpayCredentials(
  mode: 'TEST' | 'PRODUCTION',
  payload: SaveRazorpayCredentialsPayload,
): Promise<RazorpaySettings> {
  const res = await apiClient.put<RazorpaySettings>(`/api/v1/admin/razorpay-settings/${mode}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to save Razorpay credentials');
}

export async function activateRazorpayMode(
  payload: ActivateRazorpayModePayload,
): Promise<RazorpaySettings> {
  const res = await apiClient.post<RazorpaySettings>('/api/v1/admin/razorpay-settings/activate', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to activate Razorpay environment');
}
