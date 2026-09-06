// Ported from bakaloo-dashboard's src/services/themes.service.ts — the
// named/versioned whole-blob `app_themes` CRUD (Draft/Active/Scheduled/
// Archived, `theme_data.sections`), against meet-commerce-backend's already
// -identical `/api/v1/admin/themes` module (verified byte-for-byte identical
// to bakaloo-backend's own admin/themes files). Kept as its own service file
// (not merged into sectionService.ts/themeTabService.ts) since it is a
// genuinely distinct backend resource, matching the reference app's own
// separation.
import { apiClient } from './apiClient';
import type {
  CreateThemePayload,
  RollbackPayload,
  ScheduleThemePayload,
  Theme,
  ThemeVersion,
  UpdateThemePayload,
} from '../types/theme.types';

export const legacyThemeService = {
  async list(): Promise<Theme[]> {
    const res = await apiClient.get<Theme[]>('/api/v1/admin/themes');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch themes');
  },

  async getById(id: string): Promise<Theme> {
    const res = await apiClient.get<Theme>(`/api/v1/admin/themes/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to fetch theme ${id}`);
  },

  async create(payload: CreateThemePayload): Promise<Theme> {
    const res = await apiClient.post<Theme>('/api/v1/admin/themes', payload);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create theme');
  },

  async update(id: string, payload: UpdateThemePayload): Promise<Theme> {
    const res = await apiClient.put<Theme>(`/api/v1/admin/themes/${id}`, payload);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update theme ${id}`);
  },

  async activate(id: string): Promise<Theme> {
    const res = await apiClient.put<Theme>(`/api/v1/admin/themes/${id}/activate`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to activate theme ${id}`);
  },

  async remove(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/themes/${id}`);
    if (!res.success) throw new Error(`Failed to delete theme ${id}`);
  },

  async getTabThemes(): Promise<Theme[]> {
    const res = await apiClient.get<Theme[]>('/api/v1/admin/themes/tabs');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch tab themes');
  },

  async schedule(id: string, payload: ScheduleThemePayload): Promise<Theme> {
    const res = await apiClient.post<Theme>(`/api/v1/admin/themes/${id}/schedule`, payload);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to schedule theme');
  },

  async cancelSchedule(id: string): Promise<Theme> {
    const res = await apiClient.delete<Theme>(`/api/v1/admin/themes/${id}/schedule`);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to cancel scheduled theme change');
  },

  async getVersions(id: string): Promise<ThemeVersion[]> {
    const res = await apiClient.get<ThemeVersion[]>(`/api/v1/admin/themes/${id}/versions`);
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch theme version history');
  },

  async rollback(themeId: string, payload: RollbackPayload): Promise<Theme> {
    const res = await apiClient.post<Theme>(`/api/v1/admin/themes/${themeId}/rollback`, payload);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to roll back theme');
  },
};
