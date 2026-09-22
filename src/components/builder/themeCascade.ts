/**
 * Mirrors, byte-for-byte, the resolution logic the BACKEND uses to build the
 * per-tab `theme_data` every customer's app actually renders
 * (`buildTabManifestResponse` / `withoutFallbackHeaderImage` /
 * `mergeThemeData` in `meet-commerce-backend-main/src/modules/themes/public.controller.js`).
 *
 * The builder's admin API (`/admin/themes/tabs`) returns RAW, un-merged theme
 * rows — one tab may have no row of its own at all. Without this, the builder
 * preview and the actual storefront can show two different things for the
 * same tab: the preview showing a tab's bare row (or a wrong, all-or-nothing
 * fallback to "All"), while the app shows the correctly cascaded result. Any
 * change here MUST be mirrored on the backend, and vice versa — that pair is
 * the single source of truth for "what does tab X actually look like".
 */
import type { ThemeData, ThemeSections } from "@/types/theme.types"

const HEADER_IMAGE_LAYOUT_KEYS = [
  "recommendedWidth",
  "topRegionHeight",
  "promoRegionHeight",
  "totalHeight",
] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

/**
 * "All" is a layout fallback. Its header photo (and the settings that
 * describe how that one image is laid out) must never leak into another tab
 * — including a tab that has never been given a theme row of its own.
 */
export function withoutFallbackHeaderImage(
  themeData: ThemeData | null
): ThemeData | null {
  if (!isPlainObject(themeData)) return themeData
  const clone = { ...(themeData as Record<string, unknown>) }
  const sections = clone.sections
  if (isPlainObject(sections)) {
    const nextSections = { ...sections } as Record<string, unknown>
    const headerBackground = nextSections.headerBackground
    if (isPlainObject(headerBackground)) {
      const nextHeader: Record<string, unknown> = {
        ...headerBackground,
        imageUrl: null,
        extendToPromoBar: false,
      }
      for (const key of HEADER_IMAGE_LAYOUT_KEYS) delete nextHeader[key]
      nextSections.headerBackground = nextHeader
    }
    clone.sections = nextSections
  }
  return clone as unknown as ThemeData
}

/**
 * Deep-merge `overrideValue` onto `baseValue`: any key `overrideValue` does
 * not set falls through to `baseValue` (the cascade); `overrideValue` being
 * `null`/`undefined` means "nothing of its own" and returns `baseValue`
 * as-is; arrays and primitives in `overrideValue` always win outright
 * (never merged element-by-element).
 */
export function mergeThemeData<T>(baseValue: T, overrideValue: unknown): T {
  if (overrideValue === null || overrideValue === undefined) {
    return (baseValue ?? null) as T
  }
  if (Array.isArray(overrideValue)) {
    return overrideValue as T
  }
  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const merged: Record<string, unknown> = { ...baseValue }
    for (const [key, value] of Object.entries(overrideValue)) {
      merged[key] = mergeThemeData((baseValue as Record<string, unknown>)[key], value)
    }
    return merged as T
  }
  return overrideValue as T
}

/**
 * What a customer will actually see for `tabKey`, given "All"'s theme_data
 * and (if the tab has one) its own theme_data — the exact function the
 * builder preview must call instead of using either verbatim. Never call
 * `mergeThemeData` directly on tab data outside this file.
 */
export function resolveTabThemeData(
  allThemeData: ThemeData | null,
  tabKey: string,
  tabOwnThemeData: ThemeData | null
): ThemeData | null {
  const isolateHeaderImage = tabKey !== "all"
  const base = isolateHeaderImage
    ? withoutFallbackHeaderImage(allThemeData)
    : allThemeData
  return mergeThemeData(base, tabOwnThemeData)
}

export type { ThemeData, ThemeSections }
