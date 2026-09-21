/**
 * Header Background — exact export sizes, derived from the REAL simulator.
 *
 * The header block in `FixedHeaderPreview` (top bar + search bar + category
 * tabs) is measured live in the browser; the mini promotional bar is rendered
 * from `MINI_PROMO_BAR_HEIGHT_PX` below. Both are converted to a canonical
 * 1080px-wide export so an artist knows exactly how tall each part of the
 * image is. Nothing here is a guessed estimate: change the preview layout and
 * every number (panel, prompts, saved theme, mobile app) follows.
 */
import { useSyncExternalStore } from "react"
import type { HeaderBackgroundTheme } from "@/types/theme.types"

/** Canonical design width every recommendation is expressed in. */
export const HEADER_BG_CANONICAL_WIDTH = 1080

/**
 * Height of the mini promotional bar, in simulator layout px (the phone frame
 * is laid out 430px wide before its visual scale-down). This constant is what
 * `FixedHeaderPreview` renders, and is converted to export px by
 * `computeHeaderBackgroundSpec`.
 */
export const MINI_PROMO_BAR_HEIGHT_PX = 64

export interface HeaderBackgroundSpec {
  /** Always 1080. */
  width: number
  /** A — Top Bar + Search Bar + Category Tabs (also the whole image when the toggle is OFF). */
  topRegionHeight: number
  /** B — mini promotional bar. */
  promoRegionHeight: number
  /** Y = A + B (toggle ON). */
  totalHeight: number
}

/** Layout px → export px at the canonical width. */
export function toExportPx(layoutPx: number, layoutWidthPx: number): number {
  return Math.round((layoutPx * HEADER_BG_CANONICAL_WIDTH) / layoutWidthPx)
}

/**
 * A and B are rounded independently and Y is their sum, so the three numbers
 * shown to the user always add up exactly.
 */
export function computeHeaderBackgroundSpec(
  topRegionLayoutPx: number,
  layoutWidthPx: number,
  promoBarLayoutPx: number = MINI_PROMO_BAR_HEIGHT_PX
): HeaderBackgroundSpec {
  const topRegionHeight = toExportPx(topRegionLayoutPx, layoutWidthPx)
  const promoRegionHeight = toExportPx(promoBarLayoutPx, layoutWidthPx)
  return {
    width: HEADER_BG_CANONICAL_WIDTH,
    topRegionHeight,
    promoRegionHeight,
    totalHeight: topRegionHeight + promoRegionHeight,
  }
}

/**
 * The persisted `headerBackground` object for the current mode. OFF keeps the
 * legacy meaning (one image behind the top region only): promo 0, total = A.
 */
export function withHeaderBackgroundSpec(
  current: HeaderBackgroundTheme | undefined,
  spec: HeaderBackgroundSpec,
  extend: boolean
): HeaderBackgroundTheme {
  return {
    ...(current ?? { imageUrl: null }),
    extendToPromoBar: extend,
    recommendedWidth: spec.width,
    topRegionHeight: spec.topRegionHeight,
    promoRegionHeight: extend ? spec.promoRegionHeight : 0,
    totalHeight: extend ? spec.totalHeight : spec.topRegionHeight,
  }
}

/** Share of the tall image (from the top) that belongs to the top region: A / Y. */
export function topRegionFraction(spec: Pick<HeaderBackgroundSpec, "topRegionHeight" | "totalHeight">): number {
  return spec.topRegionHeight / spec.totalHeight
}

// ── live measurement of the simulator's header block ─────────────────────────

export interface HeaderLayoutMetrics {
  /** Height of the top region in simulator layout px (untransformed). */
  topRegionLayoutPx: number | null
  /** Width of the simulator in layout px (untransformed). */
  layoutWidthPx: number | null
}

let metrics: HeaderLayoutMetrics = { topRegionLayoutPx: null, layoutWidthPx: null }
const listeners = new Set<() => void>()

export function setHeaderLayoutMetrics(next: HeaderLayoutMetrics): void {
  if (
    next.topRegionLayoutPx === metrics.topRegionLayoutPx &&
    next.layoutWidthPx === metrics.layoutWidthPx
  ) {
    return
  }
  metrics = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useHeaderLayoutMetrics(): HeaderLayoutMetrics {
  return useSyncExternalStore(subscribe, () => metrics)
}

export function getHeaderLayoutMetrics(): HeaderLayoutMetrics {
  return metrics
}

/** `null` until the simulator has been laid out and measured. */
export function specFromMetrics(m: HeaderLayoutMetrics): HeaderBackgroundSpec | null {
  if (!m.topRegionLayoutPx || !m.layoutWidthPx) return null
  return computeHeaderBackgroundSpec(m.topRegionLayoutPx, m.layoutWidthPx)
}

// ── copy-ready prompts ───────────────────────────────────────────────────────

export function headerOnlyPrompt(spec: HeaderBackgroundSpec): string {
  const X = spec.topRegionHeight
  return (
    `Create a premium mobile commerce header background image for a grocery/meat delivery app. ` +
    `Canvas size: ${spec.width} × ${X} px. ` +
    `The image will appear behind the top header, search bar and category navigation tabs only. ` +
    `Keep important branding, logo-safe content, and visual highlights in the upper and middle zones. ` +
    `Use a clean premium app-like composition with rich gradients, subtle lighting, high readability, and mobile-friendly spacing. ` +
    `Do not place important text at the extreme bottom edge.`
  )
}

export function headerPlusPromoPrompt(spec: HeaderBackgroundSpec): string {
  const { topRegionHeight: A, promoRegionHeight: B, totalHeight: Y } = spec
  return (
    `Create one vertically continuous premium mobile commerce background image for a grocery/meat delivery app. ` +
    `Canvas size: ${spec.width} × ${Y} px. ` +
    `The top ${A} px of the image will appear behind the top header, search bar and category navigation. ` +
    `The bottom ${B} px will appear inside a mini promotional banner strip below the category tabs. ` +
    `Design the full image as one continuous composition. ` +
    `The top area should feel like a rich branded header background. ` +
    `The bottom area should contain a promotional graphic zone suitable for offers, highlights, campaign visuals or brand messaging. ` +
    `Keep the transition between the upper and lower zones visually premium and cohesive. ` +
    `Ensure mobile readability and do not place critical text too close to crop-sensitive edges.`
  )
}
