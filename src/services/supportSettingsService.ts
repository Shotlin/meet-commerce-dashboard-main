import { apiClient } from './apiClient';
import type { SaveSupportSettingsPayload, SupportSettings } from '../types/supportSettings.types';

/**
 * Support settings service — talks to the backend's
 * `/api/v1/admin/support-settings` endpoints. The mobile app reads the
 * same data from the separate, non-admin `/api/v1/support-settings`
 * endpoint (no auth — a guest can tap "Need Help" too).
 */
export const supportSettingsService = {
  async get(): Promise<SupportSettings> {
    const res = await apiClient.get<SupportSettings>('/api/v1/admin/support-settings');
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to fetch support settings');
  },

  async save(payload: SaveSupportSettingsPayload): Promise<SupportSettings> {
    const res = await apiClient.put<SupportSettings>('/api/v1/admin/support-settings', payload);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to save support settings');
  },
};
