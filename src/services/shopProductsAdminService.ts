import { apiClient } from './apiClient';
import type {
  AdjustShopProductStockPayload,
  CreateManualInventoryLotPayload,
  CreateManualInventoryLotResult,
  CreateShopProductPayload,
  ShopProduct,
  ShopProductInventoryLotsResult,
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

/**
 * The vendor batches (inventory_lots) actually backing this shop product's
 * stock_quantity — "which vendor supplied this number." Empty `lots` means
 * either this product has never been vendor-restocked, or its stock is
 * entirely manual (both are valid, unremarkable states).
 */
export async function getShopProductInventoryLots(
  shopId: string,
  shopProductId: string
): Promise<ShopProductInventoryLotsResult> {
  const res = await apiClient.get<ShopProductInventoryLotsResult>(
    `/api/v1/shop-products/${shopProductId}/inventory-lots`,
    undefined,
    { 'X-Shop-Id': shopId }
  );
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to fetch inventory lots');
}

/**
 * Apply a signed stock delta with a mandatory reason, recorded as a real
 * `stock_movements` ledger row — the "stock adjustment flow" the Edit Shop
 * Pricing & Stock modal's Stock field has always pointed at (it previously
 * pointed at nothing; this is the backend endpoint that already existed).
 * `shopProductId` is the URL's `:productId` segment per the backend's own
 * naming (it is actually `shop_products.id`, not the master product id).
 */
export async function adjustShopProductStock(
  shopId: string,
  shopProductId: string,
  payload: AdjustShopProductStockPayload
): Promise<ShopProduct> {
  const res = await apiClient.post<{ shopProduct: ShopProduct; movement: unknown }>(
    `/api/v1/shops/${shopId}/products/${shopProductId}/adjust-stock`,
    payload,
    { 'X-Shop-Id': shopId }
  );
  if (res.success && res.data) return res.data.shopProduct;
  throw new Error(res.message || 'Failed to adjust stock');
}

/**
 * Backfill a vendor batch for a shop product whose stock never came
 * through the real Vendor Procurement receiving pipeline — creates a real
 * `inventory_lots` row (vendor name, quantity, expiry, optional quality
 * video) tagged as manual, so it shows up in the same "Vendor Batches"
 * panel as a real receipt does. Optionally also applies the quantity as a
 * stock delta (`also_add_to_stock`) in the same backend transaction.
 */
export async function createManualInventoryLot(
  shopId: string,
  shopProductId: string,
  payload: CreateManualInventoryLotPayload
): Promise<CreateManualInventoryLotResult> {
  const res = await apiClient.post<CreateManualInventoryLotResult>(
    `/api/v1/shops/${shopId}/products/${shopProductId}/inventory-lots/manual`,
    payload,
    { 'X-Shop-Id': shopId }
  );
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to backfill vendor batch');
}
