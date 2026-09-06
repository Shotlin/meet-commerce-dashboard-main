/**
 * Product family types — mirrors backend `product_families` table and
 * `/api/v1/admin/product-families` endpoints. A family groups related
 * purchasable options (e.g. Chicken Curry Cut 500g / 1kg) under a shared
 * name; each option is a distinct product row with `product_family_id`
 * linking back to its family.
 */

export interface ProductFamily {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  thumbnail_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Populated by GET /:id — count of active products in this family */
  product_count?: number;
}

export interface ProductFamilyCreatePayload {
  name: string;
  slug?: string;
  category_id?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductFamilyUpdatePayload {
  name?: string;
  slug?: string;
  category_id?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductFamilyListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  is_active?: 'true' | 'false';
}

export interface FamilyOptionRow {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
  option_label: string | null;
  option_sort_order: number;
  is_default_option: boolean;
  food_type: string;
  origin_tag: string;
  custom_badges: string[] | null;
  display_delivery_minutes: number | null;
  cut_type: string | null;
  piece_count: string | null;
  skin_type: string | null;
  product_family_id: string | null;
  category_id: string | null;
  category_name: string | null;
}

export interface FamilyOptionsResult {
  family: ProductFamily;
  options: FamilyOptionRow[];
}
