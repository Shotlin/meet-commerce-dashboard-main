import { apiClient } from './apiClient';
import type {
  Category,
  CategoryProductRank,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types/category.types';
import type { ProductOption } from './catalogPickerService';

/**
 * Full admin CRUD for categories/subcategories/bundles — a bundle is just a
 * category row with category_type: 'BUNDLE'. Distinct from
 * `catalogPickerService`/`hooks/useCategories.ts`'s existing minimal
 * read-only shims (used by the theme builder's merch pickers against the
 * public /api/v1/categories endpoint) — this hits the real admin surface.
 */

export async function getAdminCategories(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/api/v1/categories/admin');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch categories');
}

export async function getAdminBundles(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/api/v1/categories/bundles');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch bundles');
}

export async function getCategoriesForProduct(
  productId: string
): Promise<Array<Category & { is_member?: boolean }>> {
  const res = await apiClient.get<Array<Category & { is_member?: boolean }>>(
    `/api/v1/categories/for-product/${productId}`
  );
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch categories for product');
}

export async function toggleCategoryMembership(
  categoryId: string,
  productId: string,
  isMember: boolean
): Promise<void> {
  const res = await apiClient.put<null>(`/api/v1/categories/${categoryId}/membership`, {
    productId,
    isMember,
  });
  if (!res.success) throw new Error(res.message || 'Failed to update category membership');
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await apiClient.post<Category>('/api/v1/categories', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create category');
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<Category> {
  const res = await apiClient.put<Category>(`/api/v1/categories/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update category');
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/categories/${id}`);
  if (!res.success) throw new Error(res.message || 'Failed to delete category');
}

/**
 * Products currently in a category/bundle, already in effective display
 * order — seeds the product-ranking panel. For a STANDARD category this is
 * the union of products whose real category is this one plus any
 * cross-listed extras; for a BUNDLE it's exactly the bundle's members.
 */
export async function getCategoryProducts(categoryId: string, limit = 100): Promise<ProductOption[]> {
  const res = await apiClient.get<ProductOption[]>(`/api/v1/categories/${categoryId}/products`, {
    limit,
    page: 1,
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function getCategoryProductRanks(categoryId: string): Promise<CategoryProductRank[]> {
  const res = await apiClient.get<CategoryProductRank[]>(`/api/v1/categories/${categoryId}/products/ranks`);
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch category product ranks');
}

/** Replace a category/bundle's product membership + order in one call — array index = rank. */
export async function setCategoryProducts(
  categoryId: string,
  productIds: string[]
): Promise<CategoryProductRank[]> {
  const res = await apiClient.put<CategoryProductRank[]>(`/api/v1/categories/${categoryId}/products`, {
    productIds,
  });
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error(res.message || 'Failed to save product order');
}
