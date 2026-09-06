import { apiClient } from './apiClient';

export const STORE_KEYS = ['zepto', 'off_zone', 'super_mall', 'cafe'] as const;
export type StoreKey = typeof STORE_KEYS[number];
export type TabStatus = 'active' | 'archived';

export interface MerchConfigSection {
  category_ids: string[];
  product_ids: string[];
  limit: number;
}

export interface MerchConfigRail {
  category_id: string;
  product_ids: string[];
  limit: number;
  title: string | null;
}

export interface MerchConfig {
  seasonal_mosaic: MerchConfigSection;
  featured: MerchConfigSection;
  deals: MerchConfigSection;
  trending: MerchConfigSection;
  category_rails: MerchConfigRail[];
}

// Rows come back raw snake_case from `theme_tabs.*`, plus a LEFT JOIN LATERAL
// against the legacy `app_themes` table surfacing each AB variant's linked
// whole-blob theme (if one exists) — read-only info here, Phase 2 does not
// build an editor for the legacy system.
export interface ThemeTab {
  id: string;
  store_key: StoreKey;
  key: string;
  label: string;
  image_url: string | null;
  text_color: string | null;
  sort_order: number;
  status: TabStatus;
  is_default: boolean;
  merch_config: MerchConfig;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  theme_a_id: string | null;
  theme_a_name: string | null;
  theme_a_status: string | null;
  theme_b_id: string | null;
  theme_b_name: string | null;
  theme_b_status: string | null;
}

export interface ThemeTabInput {
  store_key?: StoreKey;
  key?: string;
  label?: string;
  image_url?: string | null;
  text_color?: string | null;
  sort_order?: number;
  status?: TabStatus;
  merch_config?: Partial<MerchConfig>;
}

export const themeTabService = {
  async list(filters?: { store_key?: StoreKey; status?: TabStatus }): Promise<ThemeTab[]> {
    const res = await apiClient.get<ThemeTab[]>('/api/v1/admin/theme-tabs', filters as Record<string, any>);
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch theme tabs');
  },

  async getById(id: string): Promise<ThemeTab> {
    const res = await apiClient.get<ThemeTab>(`/api/v1/admin/theme-tabs/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to fetch theme tab ${id}`);
  },

  async create(input: ThemeTabInput): Promise<ThemeTab> {
    const res = await apiClient.post<ThemeTab>('/api/v1/admin/theme-tabs', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create theme tab');
  },

  async update(id: string, input: ThemeTabInput): Promise<ThemeTab> {
    const res = await apiClient.put<ThemeTab>(`/api/v1/admin/theme-tabs/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update theme tab ${id}`);
  },

  async archive(id: string): Promise<ThemeTab> {
    const res = await apiClient.delete<ThemeTab>(`/api/v1/admin/theme-tabs/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to archive theme tab ${id}`);
  },

  async restore(id: string): Promise<ThemeTab> {
    const res = await apiClient.post<ThemeTab>(`/api/v1/admin/theme-tabs/${id}/restore`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to restore theme tab ${id}`);
  },
};
