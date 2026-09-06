import { apiClient } from './apiClient';

export interface AppSettingEntry {
  value: any;
  description: string | null;
  updatedAt: string;
}

export type AppSettingsMap = Record<string, AppSettingEntry>;

// Generic key-value settings store (`app_settings` table) — already used for
// operational settings (store_name, cod_enabled, rider pay tiers, etc.).
// `updateSettings` upserts whatever keys are present in the PUT body and
// never rejects an unrecognized key, so new branding keys can be introduced
// here with zero backend changes.
export const appSettingsService = {
  async getAll(): Promise<AppSettingsMap> {
    const res = await apiClient.get<AppSettingsMap>('/api/v1/admin/settings');
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch settings');
  },

  async update(partial: Record<string, any>): Promise<AppSettingsMap> {
    const res = await apiClient.put<AppSettingsMap>('/api/v1/admin/settings', partial);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to update settings');
  },
};
