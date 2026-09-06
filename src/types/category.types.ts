export type CategoryType = "STANDARD" | "BUNDLE"

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  category_type: CategoryType
  product_count?: number
  created_at: string
  updated_at: string
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
}

export interface CategoryProductRank {
  product_id: string
  rank: number
  name: string
  thumbnail_url: string | null
  price: number
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  image_url?: string
  parent_id?: string | null
  sort_order?: number
  category_type?: CategoryType
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  image_url?: string
  parent_id?: string | null
  sort_order?: number
  is_active?: boolean
  category_type?: CategoryType
}
