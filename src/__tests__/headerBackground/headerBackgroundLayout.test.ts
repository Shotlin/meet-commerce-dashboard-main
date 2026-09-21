import { afterEach, describe, expect, it } from "vitest"
import {
  MINI_PROMO_BAR_HEIGHT_PX,
  computeHeaderBackgroundSpec,
  getHeaderLayoutMetrics,
  headerOnlyPrompt,
  headerPlusPromoPrompt,
  setHeaderLayoutMetrics,
  specFromMetrics,
  toExportPx,
  topRegionFraction,
  withHeaderBackgroundSpec,
} from "@/components/builder/headerBackgroundLayout"

afterEach(() => setHeaderLayoutMetrics({ topRegionLayoutPx: null, layoutWidthPx: null }))

describe("computeHeaderBackgroundSpec", () => {
  it("converts simulator layout px to a 1080-wide export", () => {
    // 430px-wide phone frame, header block measured 224.7px tall.
    const spec = computeHeaderBackgroundSpec(224.7, 430)
    expect(spec.width).toBe(1080)
    expect(spec.topRegionHeight).toBe(Math.round((224.7 * 1080) / 430)) // 564
    expect(spec.promoRegionHeight).toBe(Math.round((MINI_PROMO_BAR_HEIGHT_PX * 1080) / 430)) // 161
    expect(spec.topRegionHeight).toBe(564)
    expect(spec.promoRegionHeight).toBe(161)
  })

  it("Y is always exactly A + B (no rounding drift), for many layouts", () => {
    for (let w = 300; w <= 500; w += 7) {
      for (let h = 120; h <= 320; h += 3.3) {
        const s = computeHeaderBackgroundSpec(h, w)
        expect(s.totalHeight).toBe(s.topRegionHeight + s.promoRegionHeight)
      }
    }
  })

  it("is derived from the layout: a taller header or a different promo bar changes the numbers", () => {
    const base = computeHeaderBackgroundSpec(224.7, 430)
    expect(computeHeaderBackgroundSpec(250, 430).topRegionHeight).toBeGreaterThan(base.topRegionHeight)
    expect(computeHeaderBackgroundSpec(224.7, 430, 80).promoRegionHeight).toBeGreaterThan(base.promoRegionHeight)
    // The same design laid out twice as large (header AND promo bar doubled)
    // exports to the same 1080-wide size.
    expect(computeHeaderBackgroundSpec(224.7 * 2, 860, MINI_PROMO_BAR_HEIGHT_PX * 2)).toEqual(base)
  })

  it("toExportPx rounds to whole pixels", () => {
    expect(toExportPx(100, 1080)).toBe(100)
    expect(toExportPx(64, 430)).toBe(161)
  })

  it("topRegionFraction is A / Y", () => {
    expect(topRegionFraction({ topRegionHeight: 600, totalHeight: 800 })).toBe(0.75)
  })
})

describe("live metrics store", () => {
  it("yields no spec until the simulator has been measured", () => {
    expect(specFromMetrics(getHeaderLayoutMetrics())).toBeNull()
    setHeaderLayoutMetrics({ topRegionLayoutPx: 224.7, layoutWidthPx: 430 })
    expect(specFromMetrics(getHeaderLayoutMetrics())?.totalHeight).toBe(725)
  })

  it("ignores degenerate measurements (0 width/height)", () => {
    expect(specFromMetrics({ topRegionLayoutPx: 0, layoutWidthPx: 430 })).toBeNull()
    expect(specFromMetrics({ topRegionLayoutPx: 224, layoutWidthPx: 0 })).toBeNull()
  })
})

describe("withHeaderBackgroundSpec (what gets persisted)", () => {
  const spec = computeHeaderBackgroundSpec(224.7, 430)

  it("toggle ON persists the flag and the exact split", () => {
    expect(withHeaderBackgroundSpec({ imageUrl: "u" }, spec, true)).toEqual({
      imageUrl: "u",
      extendToPromoBar: true,
      recommendedWidth: 1080,
      topRegionHeight: 564,
      promoRegionHeight: 161,
      totalHeight: 725,
    })
  })

  it("toggle OFF keeps the legacy meaning: promo 0, total = A", () => {
    expect(withHeaderBackgroundSpec({ imageUrl: "u", extendToPromoBar: true }, spec, false)).toMatchObject({
      imageUrl: "u",
      extendToPromoBar: false,
      topRegionHeight: 564,
      promoRegionHeight: 0,
      totalHeight: 564,
    })
  })

  it("does not touch the image", () => {
    expect(withHeaderBackgroundSpec(undefined, spec, true).imageUrl).toBeNull()
  })
})

describe("generation prompts", () => {
  const spec = computeHeaderBackgroundSpec(224.7, 430)

  it("Prompt A embeds the exact header-only size", () => {
    const p = headerOnlyPrompt(spec)
    expect(p).toContain("Canvas size: 1080 × 564 px.")
    expect(p).toContain("behind the top header, search bar and category navigation tabs only")
    expect(p).not.toContain("725")
    expect(p).not.toMatch(/\{|\}|undefined|NaN/)
  })

  it("Prompt B embeds Y, A and B", () => {
    const p = headerPlusPromoPrompt(spec)
    expect(p).toContain("Canvas size: 1080 × 725 px.")
    expect(p).toContain("The top 564 px of the image")
    expect(p).toContain("The bottom 161 px")
    expect(p).toContain("one continuous composition")
    expect(p).not.toMatch(/\{|\}|undefined|NaN/)
  })
})
