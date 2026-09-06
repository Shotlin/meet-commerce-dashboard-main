// Ported from bakaloo-dashboard's src/types/theme.types.ts — the theme-
// builder's own type surface. `MerchBinding` and `ThemeTab` are declared
// directly here (bakaloo's exact required-fields shape) rather than
// re-exported from Phase 2's sectionService.ts/themeTabService.ts, whose
// equivalents have optional fields and a flat (non-nested theme_a/theme_b)
// ThemeTab shape — real differences, not just naming, that broke callers
// throughout the ported builder code when re-exported directly. Phase 2's
// own components keep using their own service-local types unaffected;
// theme-tabs.service.ts's normalizeThemeTab() is what actually produces a
// value matching this file's ThemeTab shape.
export type { SectionType, Section as SectionManifest } from '../services/sectionService';
export type { StoreKey as ThemeStoreKey, TabStatus as ThemeTabStatus, MerchConfig as ThemeTabMerchConfig, MerchConfigSection as MerchSectionConfig, MerchConfigRail as CategoryRailConfig } from '../services/themeTabService';
import type { SectionType } from '../services/sectionService';
import type { StoreKey as _ThemeStoreKey, TabStatus as _ThemeTabStatus, MerchConfig as _ThemeTabMerchConfig } from '../services/themeTabService';

export interface MerchBinding {
  category_ids: string[];
  product_ids: string[];
  tags?: string[];
  limit: number;
  source: 'category' | 'tag' | 'manual';
}

export interface CreateSectionPayload {
  section_type: SectionType;
  config?: Record<string, unknown>;
  visible?: boolean;
  merch_binding?: MerchBinding;
}

export interface UpdateSectionPayload {
  config?: Record<string, unknown>;
  visible?: boolean;
}

export interface ReorderSectionsPayload {
  order: string[];
}

export interface UpdateSectionMerchPayload {
  category_ids?: string[];
  product_ids?: string[];
  tags?: string[];
  limit?: number;
  source?: 'category' | 'tag' | 'manual';
}

export interface SectionManifestVersion {
  id: string;
  tab_id: string;
  version: number;
  snapshot?: unknown[];
  created_by: string | null;
  scheduled_at: string | null;
  status: 'applied' | 'scheduled' | 'expired';
  ab_variant: 'A' | 'B';
  ab_split_percent: number;
  created_at: string;
}

export interface ScheduleSectionLayoutPayload {
  scheduled_at: string;
}

export interface ThemeTabFilters {
  store_key?: _ThemeStoreKey;
  status?: _ThemeTabStatus;
}

export interface CreateThemeTabPayload {
  store_key: _ThemeStoreKey;
  key: string;
  label: string;
  image_url?: string | null;
  text_color?: string | null;
  sort_order?: number;
  status?: _ThemeTabStatus;
  is_default?: boolean;
  merch_config?: Partial<_ThemeTabMerchConfig>;
}

export interface UpdateThemeTabPayload {
  store_key?: _ThemeStoreKey;
  key?: string;
  label?: string;
  image_url?: string | null;
  text_color?: string | null;
  sort_order?: number;
  status?: _ThemeTabStatus;
  is_default?: boolean;
  merch_config?: Partial<_ThemeTabMerchConfig>;
}

export interface TopBarTheme {
  backgroundColor: string;
  textColor: string;
}

export interface StoreSelectorTheme {
  backgroundColor: string;
  activeChipColor: string;
}

export interface CategoryTabsTheme {
  visible: boolean;
  textColor: string;
  indicatorColor: string;
  backgroundColor?: string;
}

export interface SearchZoneTheme {
  backgroundColor: string;
  waveColor: string;
  searchHints: string[];
  promoBoxImageUrl: string | null;
}

export interface BannerAnimationTheme {
  lottieUrl: string | null;
  backgroundGradient: [string, string];
  containerColor: string;
}

export interface FeeStripTheme {
  imageUrl: string | null;
  visible: boolean;
}

export interface HeroTileTheme {
  title: string;
  gradient: [string, string];
  badgeText: string;
  badgeGradient: [string, string];
}

export interface MiniTileTheme {
  title: string;
  gradient: [string, string];
  imageUrl: string | null;
}

export interface SeasonalMosaicTheme {
  containerColor: string;
  heroTile: HeroTileTheme;
  miniTiles: MiniTileTheme[];
}

export interface BankOffersTheme {
  visible: boolean;
  bannerImageUrls: string[];
}

export interface ThemeMeta {
  seasonLabel: string;
  statusBarBrightness: 'light' | 'dark';
}

export interface ThemeSections {
  topBar: TopBarTheme;
  storeSelector: StoreSelectorTheme;
  categoryTabs: CategoryTabsTheme;
  searchZone: SearchZoneTheme;
  bannerAnimation: BannerAnimationTheme;
  feeStrip: FeeStripTheme;
  seasonalMosaic: SeasonalMosaicTheme;
  bankOffers: BankOffersTheme;
}

export interface ThemeData {
  sections: ThemeSections;
  meta: ThemeMeta;
}

export type ThemeStatus = 'draft' | 'active' | 'scheduled' | 'archived';
export type ABVariant = 'A' | 'B';

export interface ThemeLinkSummary {
  id: string;
  name: string;
  status: ThemeStatus;
  updated_at: string;
}

// The theme-builder's own ThemeTab shape — nested theme_a/theme_b (unlike
// Phase 2's flat themeTabService.ThemeTab) — produced by
// theme-tabs.service.ts's normalizeThemeTab().
export interface ThemeTab {
  id: string;
  store_key: _ThemeStoreKey;
  key: string;
  label: string;
  image_url: string | null;
  text_color: string | null;
  sort_order: number;
  status: _ThemeTabStatus;
  is_default: boolean;
  merch_config: _ThemeTabMerchConfig;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  theme_a: ThemeLinkSummary | null;
  theme_b: ThemeLinkSummary | null;
}

// The named, versioned "whole-blob" theme row from `app_themes` — distinct
// from a `SectionManifest` (one row per section within a theme_tabs layout).
export interface Theme {
  id: string;
  name: string;
  is_active: boolean;
  theme_data: ThemeData;
  tab_id: string | null;
  tab_key: string | null;
  tab_label: string | null;
  tab_icon_url: string | null;
  tab_order: number;
  store_key: _ThemeStoreKey | null;
  tab_status: _ThemeTabStatus | null;
  status: ThemeStatus;
  scheduled_at: string | null;
  expires_at: string | null;
  base_theme_id: string | null;
  ab_variant: ABVariant;
  ab_split_percent: number;
  version: number;
  etag: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateThemePayload {
  name: string;
  theme_data: ThemeData;
  tab_id?: string | null;
  tab_key?: string;
  tab_label?: string;
  tab_icon_url?: string;
  tab_order?: number;
  status?: ThemeStatus;
  ab_variant?: ABVariant;
  ab_split_percent?: number;
}

export interface UpdateThemePayload {
  name?: string;
  theme_data?: ThemeData;
  tab_id?: string | null;
  tab_key?: string;
  tab_label?: string;
  tab_icon_url?: string;
  tab_order?: number;
  status?: ThemeStatus;
  scheduled_at?: string | null;
  expires_at?: string | null;
  ab_variant?: ABVariant;
  ab_split_percent?: number;
}

export interface ThemeVersion {
  id: string;
  version: number;
  created_by: string | null;
  created_at: string;
}

export interface ScheduleThemePayload {
  scheduled_at: string;
}

export interface RollbackPayload {
  version_id: string;
}
