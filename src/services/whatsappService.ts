import { apiClient } from './apiClient';
import { uploadViaXhr } from './uploads.service';

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
  chatRetentionDays: number;
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

export interface WhatsAppConversation {
  id: string;
  jid: string;
  phone: string | null;
  display_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_direction: 'IN' | 'OUT' | null;
  unread_count: number;
  expires_at: string;
}

export interface WhatsAppChatMessage {
  id: string;
  conversation_id: string;
  direction: 'IN' | 'OUT';
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'other';
  body: string | null;
  media_name: string | null;
  media_mime: string | null;
  media_size: number | null;
  has_media: boolean;
  source: 'MANUAL' | 'AUTOMATED' | 'CUSTOMER';
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
  // ── inbox ──
  conversations: (params: { search?: string; unread?: boolean }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.unread) q.set('unread', 'true');
    return unwrap(
      apiClient.get<{ conversations: WhatsAppConversation[]; unreadTotal: number; retentionDays: number }>(
        `${BASE}/inbox/conversations?${q.toString()}`
      ),
      'Failed to load conversations'
    );
  },
  thread: (id: string, before?: string) =>
    unwrap(
      apiClient.get<{ conversation: WhatsAppConversation; messages: WhatsAppChatMessage[] }>(
        `${BASE}/inbox/conversations/${id}/messages?limit=100${before ? `&before=${encodeURIComponent(before)}` : ''}`
      ),
      'Failed to load messages'
    ),
  markRead: (id: string) => unwrap(apiClient.post<null>(`${BASE}/inbox/conversations/${id}/read`, {}), 'Failed'),
  sendText: (id: string, text: string) =>
    unwrap(apiClient.post<WhatsAppChatMessage>(`${BASE}/inbox/conversations/${id}/messages`, { text }), 'Failed to send'),
  sendFile: (id: string, file: File, caption: string, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    const q = caption.trim() ? `?caption=${encodeURIComponent(caption.trim())}` : '';
    return uploadViaXhr<WhatsAppChatMessage>(`${BASE}/inbox/conversations/${id}/media${q}`, form, onProgress);
  },
  deleteConversation: (id: string) =>
    unwrap(apiClient.delete<null>(`${BASE}/inbox/conversations/${id}`), 'Failed to delete'),
  mediaBlob: (messageId: string) => apiClient.getBlob(`${BASE}/inbox/media/${messageId}`),
};
