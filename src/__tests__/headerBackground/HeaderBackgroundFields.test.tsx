import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HeaderBackgroundFields } from "@/components/builder/HeaderBackgroundFields"
import { setHeaderLayoutMetrics, computeHeaderBackgroundSpec, headerPlusPromoPrompt } from "@/components/builder/headerBackgroundLayout"
import type { ThemeSections } from "@/types/theme.types"

const sectionsWith = (headerBackground: ThemeSections["headerBackground"]) =>
  ({ headerBackground } as unknown as ThemeSections)

/** Minimal stateful host so the toggle round-trips through real patchSections. */
function Host({ initial, spy }: { initial: ThemeSections; spy?: (p: Partial<ThemeSections>) => void }) {
  const [sections, setSections] = React.useState(initial)
  return (
    <HeaderBackgroundFields
      sections={sections}
      patchSections={(p) => {
        spy?.(p)
        setSections((s) => ({ ...s, ...p }))
      }}
    />
  )
}

beforeEach(() => setHeaderLayoutMetrics({ topRegionLayoutPx: 224.7, layoutWidthPx: 430 }))
afterEach(() => {
  setHeaderLayoutMetrics({ topRegionLayoutPx: null, layoutWidthPx: null })
  vi.unstubAllGlobals()
})

describe("HeaderBackgroundFields — toggle OFF", () => {
  it("shows exactly the header-only size and the OFF help text", () => {
    render(<Host initial={sectionsWith({ imageUrl: null })} />)
    expect(screen.getByText("Recommended image size").nextSibling?.textContent).toBe("1080 × 564 px")
    expect(screen.getByText("Header + search + category region").nextSibling?.textContent).toBe("564 px")
    expect(
      screen.getByText(/One image painted behind the Top Bar, Search Bar and Category Tabs combined\. Recommended upload size: 1080 × 564 px\./)
    ).toBeTruthy()
    // No promo breakdown in OFF mode.
    expect(screen.queryByText("Mini promotional banner region")).toBeNull()
    expect(screen.queryByText("Total combined height")).toBeNull()
  })

  it("has the new toggle, switched off", () => {
    render(<Host initial={sectionsWith({ imageUrl: null })} />)
    expect(screen.getByText("Extend into mini promotional bar")).toBeTruthy()
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false")
  })
})

describe("HeaderBackgroundFields — toggle ON", () => {
  it("shows the exact A / B / Y breakdown, the note, and the ON help text", () => {
    render(<Host initial={sectionsWith({ imageUrl: null, extendToPromoBar: true })} />)
    expect(screen.getByText("Recommended image size").nextSibling?.textContent).toBe("1080 × 725 px")
    expect(screen.getByText("Top header + search + category region").nextSibling?.textContent).toBe("564 px")
    expect(screen.getByText("Mini promotional banner region").nextSibling?.textContent).toBe("161 px")
    expect(screen.getByText("Total combined height").nextSibling?.textContent).toBe("725 px")

    expect(screen.getByText("Top region height = 564 px")).toBeTruthy()
    expect(screen.getByText("Promo strip height = 161 px")).toBeTruthy()
    expect(screen.getByText(/Total upload size = 1080 × 725 px \(564 \+\s*161\)/)).toBeTruthy()

    expect(
      screen.getByText(
        /One image painted behind the Top Bar, Search Bar, Category Tabs and Mini Promotional Bar combined\. Recommended upload size: 1080 × 725 px\. The upper 564 px of the image maps to the top header area, and the lower 161 px maps to the mini promotional bar\./
      )
    ).toBeTruthy()
    expect(screen.getByText(/one vertically continuous visual/)).toBeTruthy()
  })

  it("flipping the toggle persists the flag TOGETHER with the exact split", () => {
    const spy = vi.fn()
    render(<Host initial={sectionsWith({ imageUrl: "https://cdn.test/h.png" })} spy={spy} />)

    fireEvent.click(screen.getByRole("switch"))

    expect(spy).toHaveBeenCalledWith({
      headerBackground: {
        imageUrl: "https://cdn.test/h.png",
        extendToPromoBar: true,
        recommendedWidth: 1080,
        topRegionHeight: 564,
        promoRegionHeight: 161,
        totalHeight: 725,
      },
    })
    // …and the panel switches to the extended numbers.
    expect(screen.getByText("Total combined height").nextSibling?.textContent).toBe("725 px")
  })

  it("flipping OFF again restores the header-only numbers", () => {
    const spy = vi.fn()
    render(<Host initial={sectionsWith({ imageUrl: null, extendToPromoBar: true })} spy={spy} />)
    fireEvent.click(screen.getByRole("switch"))
    expect(spy.mock.calls[0][0].headerBackground).toMatchObject({ extendToPromoBar: false, promoRegionHeight: 0, totalHeight: 564 })
    expect(screen.getByText("Recommended image size").nextSibling?.textContent).toBe("1080 × 564 px")
  })
})

describe("HeaderBackgroundFields — prompts", () => {
  it("shows both prompts with the exact calculated numbers substituted", () => {
    render(<Host initial={sectionsWith({ imageUrl: null })} />)
    expect(screen.getByText(/Prompt A — header only/)).toBeTruthy()
    expect(screen.getByText(/Prompt B — header \+ mini promo bar/)).toBeTruthy()
    expect(screen.getByText(/Canvas size: 1080 × 564 px\. The image will appear behind the top header/)).toBeTruthy()
    expect(screen.getByText(/Canvas size: 1080 × 725 px\. The top 564 px of the image will appear behind the top header/)).toBeTruthy()
    expect(screen.getByText(/The bottom 161 px will appear inside a mini promotional banner strip/)).toBeTruthy()
  })

  it("marks the prompt that matches the current toggle", () => {
    const { unmount } = render(<Host initial={sectionsWith({ imageUrl: null })} />)
    expect(screen.getAllByText("matches your current setting")).toHaveLength(1)
    expect(screen.getByText(/Prompt A/).textContent).toContain("matches your current setting")
    unmount()
    render(<Host initial={sectionsWith({ imageUrl: null, extendToPromoBar: true })} />)
    expect(screen.getByText(/Prompt B/).textContent).toContain("matches your current setting")
  })

  it("Copy prompt puts the exact text on the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } })
    render(<Host initial={sectionsWith({ imageUrl: null, extendToPromoBar: true })} />)

    fireEvent.click(screen.getAllByRole("button", { name: /copy prompt/i })[1])

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(headerPlusPromoPrompt(computeHeaderBackgroundSpec(224.7, 430)))
    )
  })
})

describe("HeaderBackgroundFields — before the simulator is measured", () => {
  it("shows no made-up numbers, prompts, or breakdown", () => {
    setHeaderLayoutMetrics({ topRegionLayoutPx: null, layoutWidthPx: null })
    render(<Host initial={sectionsWith({ imageUrl: null, extendToPromoBar: true })} />)
    expect(screen.getAllByText(/Measuring the preview/).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/\d{3} × \d{3} px/)
    expect(screen.queryByText(/Prompt A/)).toBeNull()
  })
})

describe("HeaderBackgroundFields — uploaded image check", () => {
  const stubImage = (w: number, h: number) =>
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = w
        naturalHeight = h
        onload: (() => void) | null = null
        set src(_: string) {
          queueMicrotask(() => this.onload?.())
        }
      }
    )

  it("confirms a correctly proportioned image", async () => {
    stubImage(1080, 725)
    render(<Host initial={sectionsWith({ imageUrl: "https://cdn.test/h.png", extendToPromoBar: true })} />)
    expect(await screen.findByText(/Proportions match the recommended 1080 × 725 px/)).toBeTruthy()
  })

  it("warns (crop, never stretch) when the proportions differ", async () => {
    stubImage(1080, 900) // the OLD recommendation, wrong for extended mode
    render(<Host initial={sectionsWith({ imageUrl: "https://cdn.test/h.png", extendToPromoBar: true })} />)
    expect(await screen.findByText(/Recommended is 1080 × 725 px\. Other proportions are cropped to fit \(never stretched\)/)).toBeTruthy()
  })

  it("the same image is judged against the header-only size when the toggle is OFF", async () => {
    stubImage(1080, 564)
    render(<Host initial={sectionsWith({ imageUrl: "https://cdn.test/h.png" })} />)
    expect(await screen.findByText(/Proportions match the recommended 1080 × 564 px/)).toBeTruthy()
  })
})
