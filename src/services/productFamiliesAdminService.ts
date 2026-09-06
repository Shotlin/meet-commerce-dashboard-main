import { apiClient } from './apiClient';
import type {
  FamilyOptionsResult,
  ProductFamily,
  ProductFamilyCreatePayload,
  ProductFamilyListParams,
  ProductFamilyUpdatePayload,
} from '../types/productFamily.types';

export interface ProductFamilyListResult {
  items: ProductFamily[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listProductFamilies(
  params: ProductFamilyListParams = {}
): Promise<ProductFamilyListResult> {
  const res = await apiClient.get<ProductFamily[]>('/api/v1/admin/product-families', params as Record<string, any>);
  if (!res.success || !Array.isArray(res.data)) throw new Error('Failed to fetch product families');
  return {
    items: res.data,
    pagination: res.pagination ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 },
  };
}

export async function getProductFamily(id: string): Promise<ProductFamily> {
  const res = await apiClient.get<ProductFamily>(`/api/v1/admin/product-families/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error(`Failed to fetch product family ${id}`);
}

export async function createProductFamily(payload: ProductFamilyCreatePayload): Promise<ProductFamily> {
  const res = await apiClient.post<ProductFamily>('/api/v1/admin/product-families', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create product family');
}

export async function updateProductFamily(
  id: string,
  payload: ProductFamilyUpdatePayload
): Promise<ProductFamily> {
  const res = await apiClient.patch<ProductFamily>(`/api/v1/admin/product-families/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update product family');
}

export async function deactivateProductFamily(id: string): Promise<ProductFamily> {
  const res = await apiClient.delete<ProductFamily>(`/api/v1/admin/product-families/${id}`);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to deactivate product family');
}

export async function listFamilyOptions(familyId: string): Promise<FamilyOptionsResult> {
  const res = await apiClient.get<FamilyOptionsResult>(`/api/v1/admin/product-families/${familyId}/options`);
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch family options');
}
