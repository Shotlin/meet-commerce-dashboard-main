import { describe, expect, it } from "vitest"
import {
  buildSectionHeaderPrompt,
  getCategoryLayoutConfig,
  getSectionHeaderConfig,
  gridRowCount,
} from "@/components/builder/sectionHeader"

describe("shared section-header config", () => {
  it("keeps legacy sections text-only until an admin opts into a graphic", () => {
    const header = getSectionHeaderConfig({ title: "Our current hits" })

    expect(header.style).toBe("text")
    expect(header.showText).toBe(true)
    expect(header.showGraphic).toBe(false)
    expect(header.aspectRatio).toBe(3.6)
    expect(header.borderRadius).toBe(14)
    expect(header.horizontalMargin).toBe(16)
    expect(header.bottomSpacing).toBe(12)
  })

  it("hides normal title text only for a visible graphic-only header", () => {
    const header = getSectionHeaderConfig({
      section_header: {
        style: "graphic",
        visible: true,
        image_url: "https://cdn.test/header.webp",
      },
    })

    expect(header.showText).toBe(false)
    expect(header.showGraphic).toBe(true)
  })

  it("uses the exact approved prompt with the current editable values", () => {
    const prompt = buildSectionHeaderPrompt({
      sectionName: "Premium Fresh — Product Slider",
      storeName: "FreshCuts Kolkata",
      heading: "Our current hits",
      subheading: "Here’s what everyone’s eating!",
      graphicDescription: "Durga Puja chicken campaign",
    })

    expect(prompt).toBe(
      "Create a premium graphical section header banner for a mobile grocery/meat commerce application. Canvas size exactly 1080 × 300 px, aspect ratio 3.6:1. This artwork will appear directly above the Premium Fresh — Product Slider section. Theme/store: FreshCuts Kolkata. Main heading/message: Our current hits. Supporting message: Here’s what everyone’s eating!. Create a polished premium quick-commerce visual with strong branding, clean hierarchy, rich product imagery or illustrations, mobile-safe typography and balanced spacing. Keep all critical text/logo content inside the central safe area. Do not add device frames, UI controls or excessive empty margins. Output one complete 1080×300 banner ready for direct upload.\n\nGraphic description / campaign requirement: Durga Puja chicken campaign"
    )
  })
})

describe("round_category_icons layout config", () => {
  it("keeps the existing horizontal rail as the default", () => {
    expect(getCategoryLayoutConfig({})).toEqual({
      mode: "horizontal_scroll",
      columns: 4,
      iconSize: 64,
      gap: 12,
      rowGap: 14,
      showLabels: true,
    })
  })

  it("creates natural four-column grid rows without stretching the last row", () => {
    expect(gridRowCount(10, 4)).toBe(3)
    expect(gridRowCount(8, 4)).toBe(2)
    expect(gridRowCount(0, 4)).toBe(0)
  })
})
