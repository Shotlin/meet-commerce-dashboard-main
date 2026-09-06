import { apiClient } from './apiClient';

// ── Store status ─────────────────────────────────────────────────────────
export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}
export type WeeklyHours = Partial<Record<
  'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday',
  DayHours
>>;

export interface StoreStatus {
  isOpen: boolean;
  source: 'DEFAULT' | 'MANUAL_OVERRIDE' | 'WEEKLY_SCHEDULE';
  reason: string | null;
  weeklyHours: WeeklyHours;
  closedBannerImageUrl: string | null;
}

// ── Delivery calendar ────────────────────────────────────────────────────
export interface TemplateRow {
  id?: string;
  weekday: number; // 0=Sunday .. 6=Saturday
  is_available: boolean;
  start_time: string;
  end_time: string;
  label: string;
  display_order?: number;
}

export interface CalendarSlot {
  id: string;
  calendar_day_id: string;
  start_time: string;
  end_time: string;
  label: string;
  is_active: boolean;
  display_order: number;
}

export interface CalendarDay {
  id: string;
  calendar_date: string;
  is_available: boolean;
  note: string | null;
  updated_at: string;
  updated_by: string | null;
  slots: CalendarSlot[];
}

export const storeOpsService = {
  async getStatus(): Promise<StoreStatus> {
    const res = await apiClient.get<StoreStatus>('/api/v1/admin/store-status');
    if (res.success && res.data) return res.data;
    throw new Error('Failed to fetch store status');
  },

  async setOverride(status: 'OPEN' | 'CLOSED' | null, note?: string): Promise<StoreStatus> {
    const res = await apiClient.put<StoreStatus>('/api/v1/admin/store-status/override', { status, note });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to set store override');
  },

  async updateWeeklyHours(weeklyHours: WeeklyHours): Promise<StoreStatus> {
    const res = await apiClient.put<StoreStatus>('/api/v1/admin/store-status/weekly-hours', { weeklyHours });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to update weekly hours');
  },

  async updateClosedBanner(imageUrl: string | null): Promise<StoreStatus> {
    const res = await apiClient.put<StoreStatus>('/api/v1/admin/store-status/closed-banner', { imageUrl });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to update closed banner');
  },

  async getTemplate(): Promise<TemplateRow[]> {
    const res = await apiClient.get<{ rows: TemplateRow[] }>('/api/v1/admin/delivery-calendar/template');
    if (res.success && res.data) return res.data.rows;
    throw new Error('Failed to fetch delivery calendar template');
  },

  async putTemplate(rows: TemplateRow[]): Promise<TemplateRow[]> {
    const res = await apiClient.put<{ rows: TemplateRow[] }>('/api/v1/admin/delivery-calendar/template', { rows });
    if (res.success && res.data) return res.data.rows;
    throw new Error('Failed to save delivery calendar template');
  },

  async getDays(from: string, to: string): Promise<CalendarDay[]> {
    const res = await apiClient.get<{ days: CalendarDay[] }>('/api/v1/admin/delivery-calendar/days', { from, to });
    if (res.success && res.data) return res.data.days;
    throw new Error('Failed to fetch delivery calendar days');
  },

  async patchDay(date: string, input: { is_available: boolean; note?: string }): Promise<CalendarDay> {
    const res = await apiClient.patch<CalendarDay>(`/api/v1/admin/delivery-calendar/days/${date}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update calendar day ${date}`);
  },

  async generate(numDays = 30): Promise<{ generated: number }> {
    const res = await apiClient.post<{ generated: number }>('/api/v1/admin/delivery-calendar/generate', { numDays });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to generate delivery calendar');
  },
};
