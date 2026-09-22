export const SECTION_HEADER_ASPECT_RATIO = 1080 / 300

export type SectionHeaderStyle = "text" | "graphic" | "text_graphic"

export interface SectionHeaderConfig {
  style: SectionHeaderStyle
  imageUrl: string | null
  visible: boolean
  aspectRatio: number
  width: number
  height: number
  borderRadius: number
  horizontalMargin: number
  bottomSpacing: number
  linkUrl: string | null
  graphicDescription: string
  storeName: string
  showText: boolean
  showGraphic: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const asString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null

export function getSectionHeaderConfig(config: Record<string, unknown>): SectionHeaderConfig {
  const raw = isRecord(config.section_header) ? config.section_header : {}
  const candidate = raw.style
  const style: SectionHeaderStyle =
    candidate === "graphic" || candidate === "text_graphic" ? candidate : "text"
  const imageUrl = asString(raw.image_url)
  const visible = raw.visible !== false
  const showGraphic = style !== "text" && visible && imageUrl !== null

  return {
    style,
    imageUrl,
    visible,
    aspectRatio: asNumber(raw.image_aspect_ratio, SECTION_HEADER_ASPECT_RATIO),
    width: asNumber(raw.image_width, 1080),
    height: asNumber(raw.image_height, 300),
    borderRadius: asNumber(raw.border_radius, 14),
    horizontalMargin: asNumber(raw.horizontal_margin, 16),
    bottomSpacing: asNumber(raw.bottom_spacing, 12),
    linkUrl: asString(raw.link_url),
    graphicDescription: typeof raw.graphic_description === "string" ? raw.graphic_description : "",
    storeName: typeof raw.store_name === "string" ? raw.store_name : "",
    showText: style !== "graphic",
    showGraphic,
  }
}

export function patchSectionHeader(
  config: Record<string, unknown>,
  patch: Partial<Record<string, unknown>>
) {
  const current = isRecord(config.section_header) ? config.section_header : {}
  return { ...config, section_header: { ...current, ...patch } }
}

export function buildSectionHeaderPrompt({
  sectionName,
  storeName,
  heading,
  subheading,
  graphicDescription,
}: {
  sectionName: string
  storeName: string
  heading: string
  subheading: string
  graphicDescription: string
}) {
  const base = `Create a premium graphical section header banner for a mobile grocery/meat commerce application. Canvas size exactly 1080 × 300 px, aspect ratio 3.6:1. This artwork will appear directly above the ${sectionName} section. Theme/store: ${storeName}. Main heading/message: ${heading}. Supporting message: ${subheading}. Create a polished premium quick-commerce visual with strong branding, clean hierarchy, rich product imagery or illustrations, mobile-safe typography and balanced spacing. Keep all critical text/logo content inside the central safe area. Do not add device frames, UI controls or excessive empty margins. Output one complete 1080×300 banner ready for direct upload.`
  return graphicDescription.trim()
    ? `${base}\n\nGraphic description / campaign requirement: ${graphicDescription.trim()}`
    : base
}

export function getCategoryLayoutConfig(config: Record<string, unknown>) {
  return {
    mode: config.layout_mode === "grid" ? "grid" as const : "horizontal_scroll" as const,
    columns: 4,
    iconSize: Math.min(96, Math.max(40, asNumber(config.icon_size, 64))),
    gap: Math.min(24, Math.max(4, asNumber(config.gap, 12))),
    rowGap: Math.min(32, Math.max(4, asNumber(config.row_gap, 14))),
    showLabels: config.show_labels !== false,
  }
}

export function gridRowCount(itemCount: number, columns = 4) {
  if (itemCount <= 0) return 0
  return Math.ceil(itemCount / Math.max(1, columns))
}
