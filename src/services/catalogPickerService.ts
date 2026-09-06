import { apiClient } from './apiClient';

// Minimal, real-shape types for the merch-binding pickers (category/product
// multi-select) — deliberately not reusing `types/index.ts`'s `Product`,
// which is a mock-domain shape (category/cutType/etc.) that doesn't match
// the real `/api/v1/products` response at all.
export interface CategoryOption {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
  product_count: number;
  sort_order: number;
  image_url?: string | null;
  category_type?: 'STANDARD' | 'BUNDLE';
}

export interface ProductOption {
  id: string;
  name: string;
  category_id?: string | null;
  category_name?: string | null;
  thumbnail_url: string | null;
  price: number | string;
  sale_price: number | string | null;
}

export const catalogPickerService = {
  async listCategories(): Promise<CategoryOption[]> {
    const res = await apiClient.get<CategoryOption[]>('/api/v1/categories');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch categories');
  },

  async searchProducts(search: string, limit = 20): Promise<ProductOption[]> {
    const res = await apiClient.get<ProductOption[]>('/api/v1/products', { search, limit });
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to search products');
  },

  async getProductsByIds(ids: string[]): Promise<ProductOption[]> {
    if (ids.length === 0) return [];
    const results = await Promise.all(ids.map((id) => apiClient.get<ProductOption>(`/api/v1/products/${id}`)));
    return results.filter((r) => r.success && r.data).map((r) => r.data);
  },
};
