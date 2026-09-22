import { describe, expect, it } from "vitest"
import {
  buildSectionHeaderPrompt,
  getCategoryLayoutConfig,
  getSectionContainerConfig,
  getSectionHeaderConfig,
  gridRowCount,
  patchSectionContainer,
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

describe("Premium Fresh section container config", () => {
  it("defaults to white background, light-gray border color, zero border width and 16px top radius", () => {
    expect(getSectionContainerConfig({})).toEqual({
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 0,
      topRadius: 16,
    })
  })

  it("reads every field an admin can set in the Section Container editor", () => {
    const container = getSectionContainerConfig({
      container_background_color: "#FDF2E9",
      container_border_color: "#D97706",
      container_border_width: 2,
      container_top_radius: 20,
    })

    expect(container).toEqual({
      backgroundColor: "#FDF2E9",
      borderColor: "#D97706",
      borderWidth: 2,
      topRadius: 20,
    })
  })

  it("falls back to the default for a blank/whitespace-only color instead of storing an empty swatch", () => {
    const container = getSectionContainerConfig({
      container_background_color: "   ",
      container_border_color: "",
    })

    expect(container.backgroundColor).toBe("#FFFFFF")
    expect(container.borderColor).toBe("#E5E7EB")
  })

  it("clamps a negative border width or top radius up to zero, never negative", () => {
    const container = getSectionContainerConfig({
      container_border_width: -5,
      container_top_radius: -10,
    })

    expect(container.borderWidth).toBe(0)
    expect(container.topRadius).toBe(0)
  })

  it("patchSectionContainer merges flat container_* keys alongside the rest of the section config", () => {
    const next = patchSectionContainer(
      { title: "Products", section_header: { style: "graphic" } },
      { container_background_color: "#FDF2E9" }
    )

    expect(next).toEqual({
      title: "Products",
      section_header: { style: "graphic" },
      container_background_color: "#FDF2E9",
    })
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
