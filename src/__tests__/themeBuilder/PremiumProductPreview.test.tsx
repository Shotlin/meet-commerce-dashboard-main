import React from "react"
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import PremiumProductPreview from "@/components/builder/previews/PremiumProductPreview"
import type { Section as SectionManifest } from "@/services/sectionService"

const BANNER = "https://cdn.test/premium-banner.png"

const section = (
  section_type: "product_carousel" | "category_product_grid",
  config: Record<string, unknown>
): SectionManifest =>
  ({
    id: "sec-1",
    tab_id: "tab-1",
    section_type,
    sort_order: 0,
    visible: true,
    config,
    merch_binding: null,
    created_at: "",
    updated_at: "",
  }) as SectionManifest

const mount = (section_type: "product_carousel" | "category_product_grid", config: Record<string, unknown>) =>
  render(
    <PremiumProductPreview
      section={section(section_type, config)}
      isSelected={false}
      onClick={() => {}}
      products={[]}
    />
  )

describe("PremiumProductPreview — graphic-only banner (the reported bug)", () => {
  for (const type of ["product_carousel", "category_product_grid"] as const) {
    it(`${type}: banner is flush against the container's top edge — no gap, full width`, () => {
      const { container } = mount(type, {
        section_header: { style: "graphic", image_url: BANNER },
      })

      const outer = container.firstElementChild as HTMLElement
      const bannerWrap = outer.querySelector<HTMLElement>(`img[src="${BANNER}"]`)!.parentElement!

      // The banner sits directly under the container element (nothing but
      // itself as the first child) — no heading, no top padding/margin.
      expect(outer.firstElementChild).toBe(bannerWrap)
      expect(bannerWrap.style.marginTop).toBe("0px")
      expect(bannerWrap.style.width).toBe("100%")

      // The container clips its own top corners and hides overflow — the
      // banner itself carries no radius or padding of its own.
      expect(outer.style.overflow).toBe("hidden")
      expect(bannerWrap.style.borderRadius).toBe("")
    })

    it(`${type}: container background/border/top-radius come from config and fill the whole body`, () => {
      const { container } = mount(type, {
        section_header: { style: "graphic", image_url: BANNER },
        container_background_color: "#FDF2E9",
        container_border_color: "#D97706",
        container_border_width: 2,
        container_top_radius: 20,
      })

      const outer = container.firstElementChild as HTMLElement
      expect(outer.style.background).toBe("rgb(253, 242, 233)")
      expect(outer.style.border).toBe("2px solid rgb(217, 119, 6)")
      // Only the top corners are rounded — the bottom edge is a plain seam.
      expect(outer.style.borderRadius).toBe("20px 20px 0 0")
    })

    it(`${type}: no border configured → no border drawn, background still defaults to white`, () => {
      const { container } = mount(type, {
        section_header: { style: "graphic", image_url: BANNER },
      })

      const outer = container.firstElementChild as HTMLElement
      expect(outer.style.border).toBe("")
      expect(outer.style.background).toBe("rgb(255, 255, 255)")
    })
  }
})

describe("PremiumProductPreview — text_graphic style keeps its own gap", () => {
  it("the banner is NOT glued to the container edge when a heading renders above it", () => {
    const { container } = mount("product_carousel", {
      section_header: { style: "text_graphic", image_url: BANNER },
    })

    const outer = container.firstElementChild as HTMLElement
    const bannerWrap = outer.querySelector<HTMLElement>(`img[src="${BANNER}"]`)!.parentElement!

    // A heading block renders first, so the banner is no longer the
    // container's first child, and it keeps its bottom-spacing gap above it.
    expect(outer.firstElementChild).not.toBe(bannerWrap)
    expect(bannerWrap.style.marginTop).not.toBe("0px")
  })
})

describe("PremiumProductPreview — no banner configured", () => {
  it("renders the container with no banner element and no reserved gap for one", () => {
    const { container } = mount("category_product_grid", {})

    const outer = container.firstElementChild as HTMLElement
    expect(outer.querySelector(`img[src="${BANNER}"]`)).toBeNull()
  })
})
