// Compatibility shim matching bakaloo-dashboard's src/services/theme-tabs.service.ts
// function-export API exactly (including its normalize-to-nested-theme_a/
// theme_b behavior), so every ported component/hook that imports from
// "@/services/theme-tabs.service" works unmodified. The underlying
// apiClient.get(...) call reuses the same endpoint as themeTabService.ts —
// the raw response already includes theme_a_updated_at/theme_b_updated_at/
// is_default (confirmed via the backend's actual SQL, both fields are
// selected server-side even though themeTabService.ts's TS type omits them)
// — this file reads the raw JSON directly rather than going through
// themeTabService's narrower type, so nothing is lost.
import { apiClient } from './apiClient';
import { uploadViaXhr } from './uploads.service';
import type {
  CreateThemeTabPayload,
  ThemeLinkSummary,
  ThemeTab,
  ThemeTabFilters,
  ThemeTabMerchConfig,
  UpdateThemeTabPayload,
} from '../types/theme.types';

type RawThemeTab = {
  id: string;
  store_key: ThemeTab['store_key'];
  key: string;
  label: string;
  image_url: string | null;
  text_color: string | null;
  sort_order: number;
  status: ThemeTab['status'];
  is_default: boolean;
  merch_config: ThemeTabMerchConfig | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  theme_a_id: string | null;
  theme_a_name: string | null;
  theme_a_status: ThemeLinkSummary['status'] | null;
  theme_a_updated_at: string | null;
  theme_b_id: string | null;
  theme_b_name: string | null;
  theme_b_status: ThemeLinkSummary['status'] | null;
  theme_b_updated_at: string | null;
};

function defaultMerchSection(limit: number) {
  return {
    category_ids: [],
    product_ids: [],
    limit,
  };
}

export function defaultMerchConfig(): ThemeTabMerchConfig {
  return {
    seasonal_mosaic: defaultMerchSection(8),
    featured: defaultMerchSection(12),
    deals: defaultMerchSection(12),
    trending: defaultMerchSection(6),
    category_rails: [],
  };
}

function normalizeThemeLink(
  id: string | null,
  name: string | null,
  status: ThemeLinkSummary['status'] | null,
  updatedAt: string | null
): ThemeLinkSummary | null {
  if (!id || !name || !status || !updatedAt) {
    return null;
  }

  return {
    id,
    name,
    status,
    updated_at: updatedAt,
  };
}

function normalizeThemeTab(raw: RawThemeTab): ThemeTab {
  return {
    id: raw.id,
    store_key: raw.store_key,
    key: raw.key,
    label: raw.label,
    image_url: raw.image_url,
    text_color: raw.text_color,
    sort_order: raw.sort_order,
    status: raw.status,
    is_default: raw.is_default,
    merch_config: raw.merch_config ?? defaultMerchConfig(),
    archived_at: raw.archived_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    theme_a: normalizeThemeLink(
      raw.theme_a_id,
      raw.theme_a_name,
      raw.theme_a_status,
      raw.theme_a_updated_at
    ),
    theme_b: normalizeThemeLink(
      raw.theme_b_id,
      raw.theme_b_name,
      raw.theme_b_status,
      raw.theme_b_updated_at
    ),
  };
}

export async function getThemeTabs(filters: ThemeTabFilters = {}): Promise<ThemeTab[]> {
  const res = await apiClient.get<RawThemeTab[]>('/api/v1/admin/theme-tabs', filters as Record<string, any>);
  if (res.success && Array.isArray(res.data)) return res.data.map(normalizeThemeTab);
  throw new Error('Failed to fetch theme tabs');
}

export async function getThemeTab(id: string): Promise<ThemeTab> {
  const res = await apiClient.get<RawThemeTab>(`/api/v1/admin/theme-tabs/${id}`);
  if (res.success && res.data) return normalizeThemeTab(res.data);
  throw new Error(`Failed to fetch theme tab ${id}`);
}

export async function createThemeTab(payload: CreateThemeTabPayload): Promise<ThemeTab> {
  const res = await apiClient.post<RawThemeTab>('/api/v1/admin/theme-tabs', payload);
  if (res.success && res.data) return normalizeThemeTab(res.data);
  throw new Error('Failed to create theme tab');
}

export async function updateThemeTab(
  id: string,
  payload: UpdateThemeTabPayload
): Promise<ThemeTab> {
  const res = await apiClient.put<RawThemeTab>(`/api/v1/admin/theme-tabs/${id}`, payload);
  if (res.success && res.data) return normalizeThemeTab(res.data);
  throw new Error(`Failed to update theme tab ${id}`);
}

// Uploads a tab's icon and swaps it in on the backend in one step — the
// backend also deletes whatever the old icon was from Cloudinary once the
// swap succeeds, so replacing an icon never leaves an orphaned asset behind.
export async function updateThemeTabIcon(id: string, file: File): Promise<ThemeTab> {
  const formData = new FormData();
  formData.append('image', file);
  const raw = await uploadViaXhr<RawThemeTab>(`/api/v1/admin/theme-tabs/${id}/icon`, formData);
  return normalizeThemeTab(raw);
}

export async function archiveThemeTab(id: string): Promise<ThemeTab> {
  const res = await apiClient.delete<RawThemeTab>(`/api/v1/admin/theme-tabs/${id}`);
  if (res.success && res.data) return normalizeThemeTab(res.data);
  throw new Error(`Failed to archive theme tab ${id}`);
}

export async function restoreThemeTab(id: string): Promise<ThemeTab> {
  const res = await apiClient.post<RawThemeTab>(`/api/v1/admin/theme-tabs/${id}/restore`);
  if (res.success && res.data) return normalizeThemeTab(res.data);
  throw new Error(`Failed to restore theme tab ${id}`);
}
