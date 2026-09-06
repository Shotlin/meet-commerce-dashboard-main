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
  low_stock_threshold?: number;
  max_order_qty?: number;
  is_available?: boolean;
  is_featured?: boolean;
}
