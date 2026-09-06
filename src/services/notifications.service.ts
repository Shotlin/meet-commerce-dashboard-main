import { apiClient } from './apiClient';
import type {
  NotificationTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  NotificationCampaign,
  SendBulkPayload,
  ScheduleCampaignPayload,
  SegmentCount,
  CampaignSegment,
} from '../types/notification.types';

/* ── Templates ───────────────────────────────────── */

export async function getTemplates(): Promise<NotificationTemplate[]> {
  const res = await apiClient.get<NotificationTemplate[]>('/api/v1/admin/notifications/templates');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch templates');
}

export async function getTemplate(id: string): Promise<NotificationTemplate> {
  const res = await apiClient.get<NotificationTemplate>(`/api/v1/admin/notifications/templates/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error(`Failed to fetch template ${id}`);
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<NotificationTemplate> {
  const res = await apiClient.post<NotificationTemplate>('/api/v1/admin/notifications/templates', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create template');
}

export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload
): Promise<NotificationTemplate> {
  const res = await apiClient.put<NotificationTemplate>(`/api/v1/admin/notifications/templates/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update template');
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/admin/notifications/templates/${id}`);
  if (!res.success) throw new Error(res.message || 'Failed to delete template');
}

/* ── Campaigns ───────────────────────────────────── */

export async function getCampaigns(
  page = 1,
  limit = 20
): Promise<{ campaigns: NotificationCampaign[]; total: number }> {
  const res = await apiClient.get<{ campaigns: NotificationCampaign[]; total: number }>(
    '/api/v1/admin/notifications/campaigns',
    { page, limit }
  );
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch campaigns');
}

export async function getCampaign(id: string): Promise<NotificationCampaign> {
  const res = await apiClient.get<NotificationCampaign>(`/api/v1/admin/notifications/campaigns/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error(`Failed to fetch campaign ${id}`);
}

export async function sendBulk(
  payload: SendBulkPayload
): Promise<NotificationCampaign & { sent_count: number }> {
  const res = await apiClient.post<NotificationCampaign & { sent_count: number }>(
    '/api/v1/admin/notifications/send-bulk',
    payload
  );
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to send notification');
}

export async function scheduleCampaign(
  payload: ScheduleCampaignPayload
): Promise<NotificationCampaign> {
  const res = await apiClient.post<NotificationCampaign>('/api/v1/admin/notifications/schedule', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to schedule campaign');
}

export async function getSegmentCount(
  segment: CampaignSegment,
  segmentValue?: string
): Promise<SegmentCount> {
  const res = await apiClient.get<SegmentCount>('/api/v1/admin/notifications/segment-count', {
    segment,
    ...(segmentValue ? { segmentValue } : {}),
  });
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch segment count');
}
