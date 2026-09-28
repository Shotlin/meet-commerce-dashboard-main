import { apiClient } from './apiClient';
import type {
  OrderNotificationSetting,
  UpdateOrderNotificationSettingPayload,
} from '../types/orderNotificationSettings.types';

export async function getOrderNotificationSettings(): Promise<OrderNotificationSetting[]> {
  const res = await apiClient.get<OrderNotificationSetting[]>('/api/v1/admin/order-notification-settings');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error(res.message || 'Failed to fetch order notification settings');
}

export async function updateOrderNotificationSetting(
  eventKey: string,
  payload: UpdateOrderNotificationSettingPayload
): Promise<OrderNotificationSetting> {
  const res = await apiClient.put<OrderNotificationSetting>(
    `/api/v1/admin/order-notification-settings/${eventKey}`,
    payload
  );
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to save');
}

export async function sendOrderNotificationTest(
  eventKey: string,
  draft?: { title?: string; message?: string }
): Promise<void> {
  const res = await apiClient.post<null>(
    `/api/v1/admin/order-notification-settings/${eventKey}/test`,
    draft || {}
  );
  if (!res.success) throw new Error(res.message || 'Failed to send test notification');
}
