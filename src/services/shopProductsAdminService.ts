import { apiClient } from './apiClient';
import type {
  CreateShopProductPayload,
  ShopProduct,
  ShopProductListParams,
  ShopProductListResult,
  UpdateShopProductPayload,
} from '../types/shopProduct.types';

/**
 * Full admin CRUD for `/api/v1/shop-products` — every call explicitly scopes
 * itself via the `X-Shop-Id` header rather than relying on the apiClient's
 * ambient active-shop default, since a caller here always has a concrete
 * shop id in hand (e.g. the Shop Products tab reads it from ShopScopeContext,
 * but a future per-shop drawer might target a different shop than whatever
 * the global switcher currently points at).
 */

export class ShopProductDuplicateError extends Error {
  existingId?: string;
  constructor(message: string, existingId?: string) {
    super(message);
    this.existingId = existingId;
  }
}

export async function listShopProducts(
  shopId: string,
  params: ShopProductListParams = {}
): Promise<ShopProductListResult> {
  const res = await apiClient.get<ShopProductListResult>('/api/v1/shop-products', params as Record<string, any>, {
    'X-Shop-Id': shopId,
  });
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch shop products');
}

export async function createShopProduct(
  shopId: string,
  payload: CreateShopProductPayload
): Promise<ShopProduct> {
  const res = await apiClient.post<ShopProduct>('/api/v1/shop-products', payload, { 'X-Shop-Id': shopId });
  if (res.success && res.data) return res.data;
  if ((res as any).code === 'SHOP_PRODUCT_DUPLICATE') {
    throw new ShopProductDuplicateError(res.message || 'Product already added to this shop', (res as any).existingId);
  }
  throw new Error(res.message || 'Failed to add product to shop');
}

export async function updateShopProduct(
  shopId: string,
  id: string,
  payload: UpdateShopProductPayload
): Promise<ShopProduct> {
  const res = await apiClient.patch<ShopProduct>(`/api/v1/shop-products/${id}`, payload, { 'X-Shop-Id': shopId });
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update shop product');
}

export async function deleteShopProduct(shopId: string, id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/shop-products/${id}`, { 'X-Shop-Id': shopId });
  if (!res.success) throw new Error(res.message || 'Failed to remove product from shop');
}
