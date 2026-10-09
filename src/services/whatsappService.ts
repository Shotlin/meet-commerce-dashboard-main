import { apiClient } from './apiClient';

export type WhatsAppState = 'DISCONNECTED' | 'CONNECTING' | 'QR' | 'CONNECTED' | 'LOGGED_OUT' | 'ERROR';

export interface WhatsAppConnection {
  state: WhatsAppState;
  connected: boolean;
  qr: string | null;
  phone: string | null;
  name: string | null;
  lastError: string | null;
  reconnectAttempts: number;
}

export interface WhatsAppSettings {
  enabled: boolean;
  countryCode: string;
  sendDelayMinSec: number;
  sendDelayMaxSec: number;
  minGapSec: number;
  maxGapSec: number;
  typingSimulation: boolean;
  hourlyCap: number;
  dailyCap: number;
  warmupEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartMin: number;
  quietEndMin: number;
  connectedPhone: string | null;
  connectedName: string | null;
  firstConnectedAt: string | null;
  lastConnectedAt: string | null;
}

export interface WhatsAppOverview {
  connection: WhatsAppConnection;
  settings: WhatsAppSettings;
  stats: { sent_24h: number; sent_1h: number; queued: number; failed_24h: number; skipped_24h: number };
  effectiveDailyCap: number;
  quietNow: boolean;
  autoPausedUntil: string | null;
}

export interface WhatsAppEvent {
  key: string;
  label: string;
  hint: string;
  enabled: boolean;
  variants: string[];
  defaultVariants: string[];
  customized: boolean;
  combinations: number;
}

export interface WhatsAppEventsPayload {
  variables: { key: string; desc: string }[];
  events: WhatsAppEvent[];
}

export interface WhatsAppMessageRow {
  id: string;
  order_id: string | null;
  phone: string;
  event_key: string;
  body: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  skip_reason: string | null;
  error: string | null;
  attempts: number;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
}

const BASE = '/api/v1/admin/whatsapp';

async function unwrap<T>(p: Promise<{ success: boolean; data?: T; message?: string }>, fallback: string): Promise<T> {
  const res = await p;
  if (res.success) return res.data as T;
  throw new Error(res.message || fallback);
}

export const whatsappService = {
  overview: () => unwrap(apiClient.get<WhatsAppOverview>(`${BASE}/overview`), 'Failed to load WhatsApp status'),
  connect: () => unwrap(apiClient.post<WhatsAppConnection>(`${BASE}/connect`, {}), 'Failed to start connection'),
  disconnect: () => unwrap(apiClient.post<WhatsAppConnection>(`${BASE}/disconnect`, {}), 'Failed to disconnect'),
  logout: () => unwrap(apiClient.post<WhatsAppConnection>(`${BASE}/logout`, {}), 'Failed to unlink'),
  saveSettings: (patch: Partial<WhatsAppSettings>) =>
    unwrap(apiClient.put<WhatsAppSettings>(`${BASE}/settings`, patch), 'Failed to save settings'),
  events: () => unwrap(apiClient.get<WhatsAppEventsPayload>(`${BASE}/events`), 'Failed to load events'),
  saveEvent: (key: string, body: { enabled: boolean; variants: string[] }) =>
    unwrap(apiClient.put<WhatsAppEvent>(`${BASE}/events/${key}`, body), 'Failed to save event'),
  resetEvent: (key: string) => unwrap(apiClient.delete<WhatsAppEvent>(`${BASE}/events/${key}`), 'Failed to reset event'),
  preview: (key: string, variants: string[], count = 5) =>
    unwrap(apiClient.post<{ messages: string[] }>(`${BASE}/events/${key}/preview`, { variants, count }), 'Preview failed'),
  sendTest: (body: { phone: string; eventKey: string; variants?: string[] }) =>
    unwrap(apiClient.post<{ id: string; body: string }>(`${BASE}/test`, body), 'Test failed'),
  messages: (params: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
    return unwrap(
      apiClient.get<{ rows: WhatsAppMessageRow[]; total: number }>(`${BASE}/messages?${q.toString()}`),
      'Failed to load messages'
    );
  },
};
