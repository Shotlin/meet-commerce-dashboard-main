import { apiClient } from './apiClient';

export const SECTION_TYPES = [
  'animated_banner',
  'fee_strip',
  'seasonal_mosaic',
  'round_category_icons',
  'category_product_grid',
  'product_carousel',
  'trending_products',
  'promo_carousel',
  'bank_offers',
  'arched_product_showcase',
  'custom_banner',
  'text_header',
  'spacer',
] as const;
export type SectionType = typeof SECTION_TYPES[number];

// Section types with a real, ground-truthed `config` shape and a typed editor
// (mini-phases 2.3/2.4). The rest fall back to a generic JSON editor (2.5).
export const TYPED_SECTION_TYPES: SectionType[] = [
  'animated_banner',
  'fee_strip',
  'seasonal_mosaic',
  'round_category_icons',
  'category_product_grid',
  'product_carousel',
  'trending_products',
  'promo_carousel',
];

// Types whose schema meaningfully supports merch_binding (product/category
// -driven display). The schema itself allows binding on any type, but only
// these conceptually use it — the editor UI only shows the binder here.
export const MERCH_BOUND_SECTION_TYPES: SectionType[] = [
  'category_product_grid',
  'product_carousel',
  'trending_products',
  'bank_offers',
  'arched_product_showcase',
];

export interface MerchBinding {
  category_ids: string[];
  product_ids: string[];
  limit: number;
  source: 'category' | 'tag' | 'manual';
  tags?: string[];
}

// `listByTab` rows come from a plain `SELECT *` and lack tab_key/store_key;
// `getById` (and create/update/duplicate, which re-fetch via findById) join
// theme_tabs and include them — both optional here to reflect that honestly.
export interface Section {
  id: string;
  tab_id: string;
  section_type: SectionType;
  sort_order: number;
  visible: boolean;
  config: Record<string, any>;
  merch_binding: MerchBinding | null;
  created_at: string;
  updated_at: string;
  tab_key?: string;
  store_key?: string;
}

export interface SectionInput {
  section_type?: SectionType;
  config?: Record<string, any>;
  visible?: boolean;
  merch_binding?: MerchBinding;
}

export type VersionStatus = 'applied' | 'scheduled' | 'expired';

export interface SectionVersion {
  id: string;
  version: number;
  created_by: string | null;
  scheduled_at: string | null;
  status: VersionStatus;
  ab_variant: 'A' | 'B';
  ab_split_percent: number;
  created_at: string;
}

export const sectionService = {
  async listByTab(tabId: string): Promise<Section[]> {
    const res = await apiClient.get<Section[]>(`/api/v1/admin/sections/${tabId}`);
    if (res.success && Array.isArray(res.data)) return res.data.sort((a, b) => a.sort_order - b.sort_order);
    throw new Error('Failed to fetch sections');
  },

  async getById(id: string): Promise<Section> {
    const res = await apiClient.get<Section>(`/api/v1/admin/sections/item/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to fetch section ${id}`);
  },

  async create(tabId: string, input: SectionInput): Promise<Section> {
    const res = await apiClient.post<Section>(`/api/v1/admin/sections/${tabId}`, input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create section');
  },

  async update(id: string, input: SectionInput): Promise<Section> {
    const res = await apiClient.put<Section>(`/api/v1/admin/sections/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update section ${id}`);
  },

  async updateMerch(id: string, binding: MerchBinding): Promise<Section> {
    const res = await apiClient.put<Section>(`/api/v1/admin/sections/${id}/merch`, binding);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update merch binding for section ${id}`);
  },

  async remove(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/sections/${id}`);
    if (!res.success) throw new Error(`Failed to delete section ${id}`);
  },

  async reorder(tabId: string, orderedIds: string[]): Promise<Section[]> {
    const res = await apiClient.patch<Section[]>(`/api/v1/admin/sections/${tabId}/reorder`, { order: orderedIds });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to reorder sections');
  },

  async duplicate(id: string): Promise<Section> {
    const res = await apiClient.post<Section>(`/api/v1/admin/sections/${id}/duplicate`);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to duplicate section ${id}`);
  },

  async getVersions(tabId: string): Promise<SectionVersion[]> {
    const res = await apiClient.get<SectionVersion[]>(`/api/v1/admin/sections/${tabId}/versions`);
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch version history');
  },

  async rollback(tabId: string, versionId: string): Promise<Section[]> {
    const res = await apiClient.post<Section[]>(`/api/v1/admin/sections/${tabId}/rollback`, { version_id: versionId });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to roll back to version');
  },

  async schedule(tabId: string, scheduledAt: string): Promise<SectionVersion> {
    const res = await apiClient.post<SectionVersion>(`/api/v1/admin/sections/${tabId}/schedule`, { scheduled_at: scheduledAt });
    if (res.success && res.data) return res.data;
    throw new Error('Failed to schedule layout change');
  },

  async cancelSchedule(tabId: string): Promise<{ tab_id: string; cancelled_count: number }> {
    const res = await apiClient.delete<{ tab_id: string; cancelled_count: number }>(`/api/v1/admin/sections/${tabId}/schedule`);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to cancel scheduled change');
  },
};
