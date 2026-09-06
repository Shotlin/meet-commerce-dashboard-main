import { apiClient } from './apiClient';

export type BannerType = 'carousel' | 'popup' | 'announcement' | 'category' | 'category_footer';
export type BannerLinkType = 'category' | 'product' | 'url' | 'none';
export type BannerTriggerType = 'ALWAYS' | 'STORE_CLOSED';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  bannerType: BannerType;
  linkType: BannerLinkType;
  linkValue: string | null;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  triggerType: BannerTriggerType;
  createdAt: string;
  updatedAt: string;
}

export interface BannerInput {
  title: string;
  imageUrl: string;
  bannerType?: BannerType;
  linkType?: BannerLinkType;
  linkValue?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  triggerType?: BannerTriggerType;
}

// Adapter — admin banner rows come back snake_case with a couple of
// server-computed aliases (link_type/link_value/sort_order).
const adaptBanner = (b: any): Banner => ({
  id: b.id,
  title: b.title,
  imageUrl: b.image_url,
  bannerType: b.banner_type,
  linkType: b.link_type,
  linkValue: b.link_value,
  sortOrder: b.sort_order,
  isActive: b.is_active,
  startDate: b.start_date,
  endDate: b.end_date,
  triggerType: b.trigger_type,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

export const bannerService = {
  async getBanners(): Promise<Banner[]> {
    const res = await apiClient.get<any[]>('/api/v1/admin/banners');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(adaptBanner).sort((a, b) => a.sortOrder - b.sortOrder);
    }
    throw new Error('Failed to fetch banners from API');
  },

  async createBanner(input: BannerInput): Promise<Banner> {
    const res = await apiClient.post<any>('/api/v1/admin/banners', input);
    if (res.success && res.data) {
      return adaptBanner(res.data);
    }
    throw new Error('Failed to create banner');
  },

  async updateBanner(id: string, input: Partial<BannerInput>): Promise<Banner> {
    const res = await apiClient.put<any>(`/api/v1/admin/banners/${id}`, input);
    if (res.success && res.data) {
      return adaptBanner(res.data);
    }
    throw new Error(`Failed to update banner ${id}`);
  },

  async deleteBanner(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/banners/${id}`);
    if (!res.success) {
      throw new Error(`Failed to delete banner ${id}`);
    }
  },

  async reorderBanners(orderedIds: string[]): Promise<void> {
    const res = await apiClient.put<null>('/api/v1/admin/banners/reorder', { orderedIds });
    if (!res.success) {
      throw new Error('Failed to save banner order');
    }
  },
};
