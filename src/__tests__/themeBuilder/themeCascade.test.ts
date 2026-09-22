import { describe, expect, it } from "vitest"
import {
  mergeThemeData,
  resolveTabThemeData,
  withoutFallbackHeaderImage,
} from "@/components/builder/themeCascade"
import type { ThemeData } from "@/types/theme.types"

// Kept in lockstep with the backend fixture in
// meet-commerce-backend-main/tests/unit/themes/tab-manifest-isolation.test.js —
// same scenario, same expected shape, so the two can never silently diverge.
const ALL_THEME_DATA = {
  sections: {
    topBar: { backgroundColor: "#111111", textColor: "#ffffff" },
    categoryTabs: { backgroundColor: "#111111" },
    headerBackground: {
      imageUrl: "https://cdn.test/all-header.png",
      extendToPromoBar: true,
      recommendedWidth: 1080,
      topRegionHeight: 564,
      promoRegionHeight: 161,
      totalHeight: 725,
    },
  },
} as unknown as ThemeData

describe("resolveTabThemeData — header image isolation (mirrors the backend)", () => {
  it("a brand-new tab with NO theme row (null) inherits colors but NOT the header image — the reported bug", () => {
    const chicken = resolveTabThemeData(ALL_THEME_DATA, "chicken", null)!
    expect(chicken.sections.topBar.backgroundColor).toBe("#111111")
    expect(chicken.sections.headerBackground?.imageUrl).toBeNull()
    expect(chicken.sections.headerBackground?.extendToPromoBar).toBe(false)
    expect(chicken.sections.headerBackground?.topRegionHeight).toBeUndefined()
  })

  it("a tab with its own theme row (no image of its own) still does not inherit the image", () => {
    const fish = resolveTabThemeData(ALL_THEME_DATA, "fish", {
      sections: { topBar: { backgroundColor: "#00FF00" } },
    } as unknown as ThemeData)!
    expect(fish.sections.topBar.backgroundColor).toBe("#00FF00")
    expect(fish.sections.headerBackground?.imageUrl).toBeNull()
  })

  it("a tab that explicitly sets its OWN header image keeps exactly that image", () => {
    const mutton = resolveTabThemeData(ALL_THEME_DATA, "mutton", {
      sections: { headerBackground: { imageUrl: "https://cdn.test/mutton.png" } },
    } as unknown as ThemeData)!
    expect(mutton.sections.headerBackground?.imageUrl).toBe("https://cdn.test/mutton.png")
    expect(mutton.sections.topBar.backgroundColor).toBe("#111111")
  })

  it('the "all" tab itself always keeps its own header image', () => {
    const all = resolveTabThemeData(ALL_THEME_DATA, "all", ALL_THEME_DATA)!
    expect(all.sections.headerBackground?.imageUrl).toBe("https://cdn.test/all-header.png")
  })

  it("no All theme at all: every other tab resolves to null, never throws", () => {
    expect(resolveTabThemeData(null, "chicken", null)).toBeNull()
    expect(
      resolveTabThemeData(null, "chicken", {
        sections: { topBar: { backgroundColor: "#X" } },
      } as unknown as ThemeData)
    ).toEqual({ sections: { topBar: { backgroundColor: "#X" } } })
  })

  it("two physical shops of the same store never bleed into each other through this pure function", () => {
    const kolkataChicken = resolveTabThemeData(ALL_THEME_DATA, "chicken", {
      sections: { topBar: { backgroundColor: "#K" } },
    } as unknown as ThemeData)!
    const delhiAll = {
      sections: {
        topBar: { backgroundColor: "#D" },
        headerBackground: { imageUrl: "https://cdn.test/delhi.png" },
      },
    } as unknown as ThemeData
    const delhiChicken = resolveTabThemeData(delhiAll, "chicken", null)!

    expect(kolkataChicken.sections.topBar.backgroundColor).toBe("#K")
    expect(delhiChicken.sections.topBar.backgroundColor).toBe("#D")
    expect(delhiChicken.sections.headerBackground?.imageUrl).toBeNull()
  })
})

describe("withoutFallbackHeaderImage", () => {
  it("strips the image and its layout settings, leaves everything else untouched", () => {
    const stripped = withoutFallbackHeaderImage(ALL_THEME_DATA)!
    expect(stripped.sections.headerBackground).toEqual({ imageUrl: null, extendToPromoBar: false })
    expect(stripped.sections.topBar).toEqual(ALL_THEME_DATA.sections.topBar)
  })

  it("does not mutate its input", () => {
    const before = JSON.stringify(ALL_THEME_DATA)
    withoutFallbackHeaderImage(ALL_THEME_DATA)
    expect(JSON.stringify(ALL_THEME_DATA)).toBe(before)
  })

  it("passes through null/non-object input unchanged", () => {
    expect(withoutFallbackHeaderImage(null)).toBeNull()
  })
})

describe("mergeThemeData", () => {
  it("cascades any key the override omits", () => {
    const merged = mergeThemeData({ a: 1, b: { c: 2, d: 3 } }, { b: { c: 20 } })
    expect(merged).toEqual({ a: 1, b: { c: 20, d: 3 } })
  })

  it("a null/undefined override returns the base untouched", () => {
    const base = { a: 1 }
    expect(mergeThemeData(base, null)).toBe(base)
    expect(mergeThemeData(base, undefined)).toBe(base)
  })

  it("an array override replaces outright, never merges element-by-element", () => {
    expect(mergeThemeData({ tags: ["a", "b"] }, { tags: ["z"] })).toEqual({ tags: ["z"] })
  })

  it("is idempotent: merging a value with itself changes nothing observable", () => {
    expect(mergeThemeData(ALL_THEME_DATA, ALL_THEME_DATA)).toEqual(ALL_THEME_DATA)
  })
})
