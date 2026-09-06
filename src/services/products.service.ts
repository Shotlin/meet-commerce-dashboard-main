// Minimal compatibility shim for the ported theme builder's product pickers
// (LinkPicker.tsx, ProductSourceConfig.tsx) — NOT a port of bakaloo-dashboard's
// full products.service.ts (which is the whole admin product-CRUD surface,
// against a `Product`/`ProductPayload` shape this project's own product
// module doesn't share). Only `getProducts`/`getProductDetail` are actually
// used by the picker components, backed by catalogPickerService's already
// real-shape ProductOption (Phase 2).
import { apiClient } from './apiClient';
import { catalogPickerService, type ProductOption } from './catalogPickerService';

export type { ProductOption as Product };

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: ProductOption[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { status: _status, ...params } = filters;
  const res = await apiClient.get<ProductOption[]>('/api/v1/products', params as Record<string, any>);
  if (!res.success || !Array.isArray(res.data)) throw new Error('Failed to fetch products');
  return {
    products: res.data,
    pagination: res.pagination ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 },
  };
}

export async function getProductDetail(id: string): Promise<ProductOption | null> {
  const results = await catalogPickerService.getProductsByIds([id]);
  return results[0] ?? null;
}
