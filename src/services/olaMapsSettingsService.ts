import { apiClient } from './apiClient';
import type {
  OlaMapsSaveResult,
  OlaMapsSettings,
  OlaMapsTestResult,
  SaveOlaMapsSettingsPayload,
} from '../types/olaMapsSettings.types';

/**
 * Ola Maps settings service — talks to the backend's
 * `/api/v1/admin/ola-maps-settings` endpoints. The dashboard is the only
 * place this key is ever entered; the mobile app fetches a ready-to-use
 * style URL from a separate, non-admin endpoint and never sees this one.
 */

export async function getOlaMapsSettings(): Promise<OlaMapsSettings> {
  const res = await apiClient.get<OlaMapsSettings>('/api/v1/admin/ola-maps-settings');
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to fetch Ola Maps settings');
}

/** Test a key live without saving it. */
export async function testOlaMapsKey(apiKey: string): Promise<OlaMapsTestResult> {
  const res = await apiClient.post<OlaMapsTestResult>('/api/v1/admin/ola-maps-settings/test', { apiKey });
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to test Ola Maps key');
}

/** Save settings — a changed key is re-tested live before it's enabled. */
export async function saveOlaMapsSettings(payload: SaveOlaMapsSettingsPayload): Promise<OlaMapsSaveResult> {
  const res = await apiClient.put<OlaMapsSaveResult>('/api/v1/admin/ola-maps-settings', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to save Ola Maps settings');
}
