import { apiClient } from './apiClient';

export type NotificationType = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
export type SegmentKey =
  | 'all_customers' | 'inactive_customers' | 'cart_not_empty' | 'store_customers'
  | 'specific_user' | 'custom_segment' | 'all' | 'new' | 'inactive' | 'high_value';

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  variables: string[] | null;
  image_url: string | null;
  deep_link: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateInput {
  name: string;
  title: string;
  body: string;
  type?: NotificationType;
  image_url?: string;
  deep_link?: string;
  is_active?: boolean;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  deep_link: string | null;
  type: string;
  target_type: string;
  segment: string;
  target_count: number | null;
  sent_count: number;
  opened_count: number;
  failed_count: number;
  failure_summary: string | null;
  status: string;
  template_id: string | null;
  scheduled_at: string | null;
  expires_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendBulkInput {
  title: string;
  body: string;
  segment: SegmentKey;
  segmentValue?: string;
  image_url?: string;
  deep_link?: string;
  type?: string;
  template_id?: string;
}

export interface ScheduleCampaignInput extends SendBulkInput {
  scheduledAt: string;
}

export const notificationCampaignService = {
  async getTemplates(): Promise<NotificationTemplate[]> {
    const res = await apiClient.get<NotificationTemplate[]>('/api/v1/admin/notifications/templates');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch notification templates');
  },
  async createTemplate(input: TemplateInput): Promise<NotificationTemplate> {
    const res = await apiClient.post<NotificationTemplate>('/api/v1/admin/notifications/templates', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create template');
  },
  async updateTemplate(id: string, input: Partial<TemplateInput>): Promise<NotificationTemplate> {
    const res = await apiClient.put<NotificationTemplate>(`/api/v1/admin/notifications/templates/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update template ${id}`);
  },
  async deleteTemplate(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/notifications/templates/${id}`);
    if (!res.success) throw new Error(`Failed to delete template ${id}`);
  },

  async getCampaigns(): Promise<NotificationCampaign[]> {
    const res = await apiClient.get<{ campaigns: NotificationCampaign[] }>('/api/v1/admin/notifications/campaigns');
    if (res.success && res.data && Array.isArray(res.data.campaigns)) return res.data.campaigns;
    throw new Error('Failed to fetch notification campaigns');
  },
  async sendBulk(input: SendBulkInput): Promise<NotificationCampaign> {
    const res = await apiClient.post<NotificationCampaign>('/api/v1/admin/notifications/send-bulk', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to send campaign');
  },
  async schedule(input: ScheduleCampaignInput): Promise<NotificationCampaign> {
    const res = await apiClient.post<NotificationCampaign>('/api/v1/admin/notifications/schedule', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to schedule campaign');
  },
  async cancelCampaign(id: string): Promise<void> {
    const res = await apiClient.post<null>(`/api/v1/admin/notifications/campaigns/${id}/cancel`, {});
    if (!res.success) throw new Error(`Failed to cancel campaign ${id}`);
  },
  async getSegmentCount(segment: SegmentKey, segmentValue?: string): Promise<number> {
    const res = await apiClient.get<{ count: number }>('/api/v1/admin/notifications/segment-count', { segment, segmentValue });
    if (res.success && res.data) return res.data.count;
    throw new Error('Failed to fetch segment count');
  },
};
