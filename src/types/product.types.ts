export type FoodType = "VEG" | "NON_VEG" | "EGG" | "NONE"
export type OriginTag = "IMPORTED" | "LOCAL" | "NONE"
export type SkinType = "SKIN_ON" | "SKINLESS" | "NONE"
export type ReturnPolicy = "no_return" | "7_day" | "instant"

/** GET /api/v1/products (list) response row — snake_case, matches the API as-is. */
export interface AdminProduct {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number
  sale_price: number | null
  cost_price?: number | null
  wholesale_price?: number | null
  stock_quantity: number
  unit: string
  thumbnail_url: string | null
  images?: string[]
  tags?: string[]
  is_active: boolean
  is_featured: boolean
  total_sold: number
  sku: string | null
  barcode: string | null
  low_stock_threshold: number
  max_order_qty?: number | null
  category_id: string | null
  category_name: string | null
  product_family_id: string | null
  family_name: string | null
  option_label: string | null
  option_count?: number
  option_sort_order: number
  is_default_option: boolean
  food_type: FoodType | null
  origin_tag: OriginTag | null
  custom_badges: string[] | null
  display_delivery_minutes: number | null
  net_quantity: string | null
  avg_rating: number | null
  rating_count: number | null
  cut_type: string | null
  piece_count: string | null
  skin_type: SkinType | null
  ingredients?: string | null
  allergen_info?: string | null
  shelf_life?: string | null
  storage_instructions?: string | null
  certifications?: string[] | null
  nutrition_info?: Record<string, string> | null
  brand?: string | null
  brand_logo_url?: string | null
  vendor_name?: string | null
  vendor_address?: string | null
  vendor_fssai?: string | null
  return_policy?: ReturnPolicy
  meta_title?: string | null
  meta_description?: string | null
}

/** POST/PUT /api/v1/products body — camelCase, matches the API as-is. */
export interface ProductPayload {
  name: string
  description?: string
  price: number
  salePrice?: number
  costPrice?: number
  wholesalePrice?: number
  categoryId?: string | null
  stock?: number
  unit?: string
  thumbnailUrl?: string | null
  images?: string[]
  tags?: string[]
  isFeatured?: boolean
  isActive?: boolean
  sku?: string
  barcode?: string
  lowStockThreshold?: number
  maxOrderQty?: number
  netQuantity?: string
  ingredients?: string
  allergenInfo?: string
  shelfLife?: string
  storageInstructions?: string
  certifications?: string[]
  nutritionInfo?: Record<string, string>
  metaTitle?: string
  metaDescription?: string
  brand?: string
  brandLogoUrl?: string
  vendorName?: string
  vendorAddress?: string
  vendorFssai?: string
  returnPolicy?: ReturnPolicy
  isAuthentic?: boolean
  productFamilyId?: string | null
  optionLabel?: string
  optionSortOrder?: number
  isDefaultOption?: boolean
  foodType?: FoodType
  originTag?: OriginTag
  customBadges?: string[]
  displayDeliveryMinutes?: number
  cutType?: string
  pieceCount?: string
  skinType?: SkinType
}

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: "active" | "inactive" | "low_stock" | "out_of_stock" | "on_sale"
}
