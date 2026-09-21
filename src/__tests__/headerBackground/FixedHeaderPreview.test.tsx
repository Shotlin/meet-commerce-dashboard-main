import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { FixedHeaderPreview } from "@/components/builder/FixedHeaderPreview"
import { setHeaderLayoutMetrics } from "@/components/builder/headerBackgroundLayout"
import type { ThemeData } from "@/types/theme.types"

const IMG = "https://cdn.test/header.png"

const theme = (headerBackground: NonNullable<ThemeData["sections"]["headerBackground"]>): ThemeData =>
  ({
    sections: {
      topBar: { backgroundColor: "#000", textColor: "#fff", colorEnabled: false },
      storeSelector: { backgroundColor: "#000", activeChipColor: "#000" },
      categoryTabs: { visible: true, textColor: "#000", indicatorColor: "#000", colorEnabled: false },
      searchZone: { backgroundColor: "#fff", waveColor: "#fff", searchHints: [], promoBoxImageUrl: null, colorEnabled: false },
      headerBackground,
    },
    meta: { seasonLabel: "x", statusBarBrightness: "dark" },
  } as unknown as ThemeData)

const mount = (hb: NonNullable<ThemeData["sections"]["headerBackground"]>, interactive = true) =>
  render(
    <FixedHeaderPreview
      themeData={theme(hb)}
      activeTabKey="all"
      storeKey="zepto"
      onRegionClick={interactive ? () => {} : undefined}
    />
  )

const stripOf = (c: HTMLElement) => c.querySelector<HTMLElement>('div[data-region="header_background"]')

// jsdom has no layout, so the component's own ResizeObserver measurement is a
// no-op; the shared metrics are set to what the real simulator measured
// (224.7px tall × 430px wide ⇒ A 564, B 161, Y 725).
beforeEach(() => {
  ;(globalThis as any).ResizeObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  setHeaderLayoutMetrics({ topRegionLayoutPx: 224.7, layoutWidthPx: 430 })
})
afterEach(() => setHeaderLayoutMetrics({ topRegionLayoutPx: null, layoutWidthPx: null }))

describe("toggle OFF — existing behaviour is preserved", () => {
  it("one full-size image behind the top block, and NO promo strip", () => {
    const { container } = mount({ imageUrl: IMG })
    expect(stripOf(container)).toBeNull()
    const imgs = container.querySelectorAll<HTMLImageElement>(`img[src="${IMG}"]`)
    expect(imgs).toHaveLength(1)
    expect(imgs[0].style.height).toBe("100%")
    expect(imgs[0].style.objectFit).toBe("cover")
    expect(imgs[0].style.objectPosition).toBe("top")
  })

  it("an explicit extendToPromoBar:false with stored heights is still OFF", () => {
    const { container } = mount({ imageUrl: IMG, extendToPromoBar: false, topRegionHeight: 564, promoRegionHeight: 0, totalHeight: 564 })
    expect(stripOf(container)).toBeNull()
    expect(container.textContent).not.toContain("Mini promo bar region")
  })
})

describe("toggle ON — one tall image, two regions", () => {
  const on = { imageUrl: IMG, extendToPromoBar: true }

  it("renders the promo strip at the layout height that the export size was computed from", () => {
    const { container } = mount(on)
    expect(stripOf(container)?.style.height).toBe("64px")
  })

  it("the top block shows only the top A/Y share, top-anchored (image sized to block ÷ fraction)", () => {
    const { container } = mount(on)
    const top = container.querySelectorAll<HTMLImageElement>(`img[src="${IMG}"]`)[0]
    expect(parseFloat(top.style.height)).toBeCloseTo(100 / (564 / 725), 4)
    expect(top.style.objectPosition).toBe("top")
    expect(top.style.top).toBe("0px")
    expect(top.parentElement?.style.overflow).toBe("hidden")
  })

  it("the promo strip shows the bottom B/Y share of the SAME image, bottom-anchored", () => {
    const { container } = mount(on)
    const strip = stripOf(container)!
    const img = strip.querySelector<HTMLImageElement>(`img[src="${IMG}"]`)!
    expect(parseFloat(img.style.height)).toBeCloseTo(100 / (161 / 725), 4)
    expect(img.style.objectPosition).toBe("bottom")
    expect(img.style.bottom).toBe("0px")
    expect(strip.style.overflow).toBe("hidden")
  })

  it("both regions use one image URL (no second asset)", () => {
    const { container } = mount(on)
    const urls = new Set([...container.querySelectorAll("img")].map((i) => i.getAttribute("src")).filter((s) => s === IMG))
    expect(urls.size).toBe(1)
    expect(container.querySelectorAll(`img[src="${IMG}"]`)).toHaveLength(2)
  })

  it("edit mode shows both guide labels; runtime-style (non-interactive) does not", () => {
    const edit = mount(on)
    expect(edit.container.textContent).toContain("Top shared region")
    expect(edit.container.textContent).toContain("Mini promo bar region")
    edit.unmount()

    const runtime = mount(on, false)
    expect(runtime.container.textContent).not.toContain("Top shared region")
    expect(runtime.container.textContent).not.toContain("Mini promo bar region")
    expect(stripOf(runtime.container)).not.toBeNull() // the bar itself still renders
  })

  it("with no image yet, the strip is a labelled placeholder so the region is visible in the builder", () => {
    const { container } = mount({ imageUrl: null, extendToPromoBar: true })
    expect(stripOf(container)).not.toBeNull()
    expect(container.textContent).toContain("upload an image to fill it")
    expect(container.querySelectorAll("img[src]")).toHaveLength(0)
  })
})
