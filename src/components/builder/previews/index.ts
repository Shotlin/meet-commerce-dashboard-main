import type { FC } from "react"
import type { SectionManifest, SectionType } from "../../../types/theme.types"
import ArchedShowcasePreview from "./ArchedShowcasePreview"
import BannerPreview from "./BannerPreview"
import CarouselPreview from "./CarouselPreview"
import CategoryIconsPreview from "./CategoryIconsPreview"
import CustomBannerPreview from "./CustomBannerPreview"
import FeeStripPreview from "./FeeStripPreview"
import MosaicPreview from "./MosaicPreview"
import ProductGridPreview from "./ProductGridPreview"
import SpacerPreview from "./SpacerPreview"
import TextHeaderPreview from "./TextHeaderPreview"
import TrendingPreview from "./TrendingPreview"

// The source project's `@/types` module exports `Category`/`Product` shapes
// tailored to its own real product-catalog API. This project's `src/types`
// doesn't have an equivalent yet — `types/index.ts`'s `Product` is a
// different, unrelated mock domain (see `catalogPickerService.ts`'s own
// comment on that), and `catalogPickerService.ts`'s `ProductOption` /
// `CategoryOption` are close but don't carry every field these preview
// components read (`net_weight`, `images`, `image_url`). Declared locally
// here with just the fields actually used below.
export interface Product {
  id: string
  name: string
  price: number | string
  sale_price: number | string | null
  thumbnail_url: string | null
  net_weight?: string | null
  images?: string[]
}

export interface Category {
  id: string
  name: string
  image_url?: string | null
}

export interface PreviewProps {
  section: SectionManifest
  isSelected: boolean
  onClick: () => void
  categories?: Category[]
  products?: Product[]
}

export const previewRegistry: Record<SectionType, FC<PreviewProps>> = {
  animated_banner: BannerPreview,
  fee_strip: FeeStripPreview,
  seasonal_mosaic: MosaicPreview,
  round_category_icons: CategoryIconsPreview,
  category_product_grid: ProductGridPreview,
  product_carousel: CarouselPreview,
  trending_products: TrendingPreview,
  promo_carousel: CarouselPreview,
  bank_offers: FeeStripPreview,
  custom_banner: CustomBannerPreview,
  text_header: TextHeaderPreview,
  arched_product_showcase: ArchedShowcasePreview,
  spacer: SpacerPreview,
}
