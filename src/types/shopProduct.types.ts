/**
 * Shop product types — mirrors the `shop_products` table and
 * `/api/v1/shop-products` endpoints (shop-scoped via the X-Shop-Id header
 * or a shop-staff JWT). A shop product is a per-shop override row layered
 * on top of a global master `products` row: null price/stock fields
 * inherit from the master product.
 */

export interface ShopProductCatalogRef {
  id: string;
  name: string | null;
  sku: string | null;
  image_url: string | null;
  category_id: string | null;
  category_name: string | null;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  product_id: string;
  price: number | string | null;
  sale_price: number | string | null;
  cost_price: number | string | null;
  wholesale_price: number | string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  max_order_qty: number;
  is_available: boolean;
  is_featured: boolean;
  sold_out_at: string | null;
  approval_status: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  product: ShopProductCatalogRef;
  shop_name: string | null;
}

export interface ShopProductListResult {
  items: ShopProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ShopProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_available?: 'true' | 'false';
  low_stock?: 'true' | 'false';
}

export interface CreateShopProductPayload {
  product_id: string;
  price?: number | null;
  sale_price?: number | null;
  cost_price?: number | null;
  wholesale_price?: number | null;
  stock_quantity?: number;
  low_stock_threshold?: number;
  max_order_qty?: number;
  is_available?: boolean;
  is_featured?: boolean;
}

export interface UpdateShopProductPayload {
  price?: number | null;
  sale_price?: number | null;
  cost_price?: number | null;
  wholesale_price?: number | null;
  low_stock_threshold?: number;
  max_order_qty?: number;
  is_available?: boolean;
  is_featured?: boolean;
}

/**
 * A vendor-supplied batch backing (part of) a shop product's sellable
 * stock — one row per `inventory_lots` record, joined through to the
 * procurement receipt that produced it. `GET /api/v1/shop-products/:id/inventory-lots`.
 */
export interface ShopProductInventoryLot {
  id: string;
  batch_number: string;
  quantity_on_hand: number | string;
  quantity_reserved: number | string;
  expiry_date: string | null;
  created_at: string;
  supply_order_id: string | null;
  supply_number: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  video_url: string | null;
}

export interface ShopProductInventoryLotsResult {
  shopProduct: ShopProduct;
  lots: ShopProductInventoryLot[];
  lotQuantityTotal: number;
}

/** `POST /api/v1/shops/:shopId/products/:shopProductId/adjust-stock`. */
export interface AdjustShopProductStockPayload {
  quantity_delta: number;
  type: 'MANUAL_ADJUSTMENT' | 'DAMAGED_STOCK' | 'RETURN_STOCK';
  reason: string;
}
