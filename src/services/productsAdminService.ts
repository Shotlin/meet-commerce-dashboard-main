import { apiClient } from './apiClient';
import type { AdminProduct, ProductFilters, ProductPayload } from '../types/product.types';

/**
 * Full admin CRUD for the product catalog — distinct from
 * `services/products.service.ts`'s minimal read-only shim (used by the
 * theme builder / category ranking pickers against the same endpoint but a
 * narrower response shape).
 */

export interface ProductListResult {
  products: AdminProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  const res = await apiClient.get<AdminProduct[]>('/api/v1/products', filters as Record<string, any>);
  if (!res.success || !Array.isArray(res.data)) throw new Error('Failed to fetch products');
  return {
    products: res.data,
    pagination: res.pagination ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 },
  };
}

export async function getProduct(id: string): Promise<AdminProduct> {
  const res = await apiClient.get<AdminProduct>(`/api/v1/products/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error(`Failed to fetch product ${id}`);
}

export async function createProduct(payload: ProductPayload): Promise<AdminProduct> {
  const res = await apiClient.post<AdminProduct>('/api/v1/products', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create product');
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<AdminProduct> {
  const res = await apiClient.put<AdminProduct>(`/api/v1/products/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update product');
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/products/${id}`);
  if (!res.success) throw new Error(res.message || 'Failed to delete product');
}
