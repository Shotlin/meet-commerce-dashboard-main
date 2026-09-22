/* eslint-disable @next/next/no-img-element */

import { memo } from "react"
import { cn } from "../../../lib/utils"
import type { PreviewProps } from "./index"
import styles from "../MobilePreviewFrame.module.css"
import { getCategoryLayoutConfig, getSectionHeaderConfig } from "../sectionHeader"

const FALLBACK_ICONS = ["🥦", "🥛", "🍞", "🧃", "🍎", "✨", "🥩", "🧄"]
const FALLBACK_LABELS = [
  "Fruits & Veg",
  "Dairy & Eggs",
  "Bakery & Bread",
  "Beverages",
  "Fresh",
  "Beauty",
  "Meat",
  "Spices",
]

interface CategoryIconPreviewItem {
  category_id?: string
  label?: string
  image_url?: string
}

function normalizeItems(value: unknown): CategoryIconPreviewItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      category_id:
        typeof item.category_id === "string" ? item.category_id : undefined,
      label: typeof item.label === "string" ? item.label : undefined,
      image_url:
        typeof item.image_url === "string" ? item.image_url : undefined,
    }))
}

function CategoryIconsPreview({
  section,
  isSelected,
  onClick,
  categories,
}: PreviewProps) {
  const config = section.config as Record<string, unknown>
  const header = getSectionHeaderConfig(config)
  const categoryLayout = getCategoryLayoutConfig(config)
  const { iconSize, gap, rowGap, showLabels } = categoryLayout
  const configuredItems = normalizeItems(config.items)
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category]))

  // The preview must reflect the same item count as the mobile manifest: a
  // ten-category selection is a 4/4/2 grid, not an eight-item approximation.
  const resolvedCategories = categories ?? []
  const resolvedItems = configuredItems.length > 0
    ? configuredItems.slice(0, 10).map((item, index) => {
      const linkedCategory = item.category_id ? categoryMap.get(item.category_id) : undefined
      return {
        key: `${item.category_id ?? "custom"}-${index}`,
        label:
          item.label?.trim() ||
          linkedCategory?.name ||
          FALLBACK_LABELS[index % FALLBACK_LABELS.length],
        imageUrl: item.image_url?.trim() || linkedCategory?.image_url || null,
        emoji: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
      }
    })
    : []

  return (
    <button
      type="button"
      className={cn(
        styles.sectionSlot,
        styles.sectionSlotHover,
        isSelected && styles.sectionSlotSelected
      )}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <div style={{ padding: "10px 0 6px", textAlign: "left" }}>
        {header.showText && (typeof config.title === "string" || typeof config.subtitle === "string") ? (
          <div style={{ padding: "0 16px 10px" }}>
            {typeof config.title === "string" && config.title.trim() ? <div style={{ color: "#141414", fontSize: 18, fontWeight: 700 }}>{config.title}</div> : null}
            {typeof config.subtitle === "string" && config.subtitle.trim() ? <div style={{ color: "#626262", fontSize: 12, marginTop: 4 }}>{config.subtitle}</div> : null}
          </div>
        ) : null}
        {header.showGraphic && header.imageUrl ? (
          <div style={{ margin: `0 ${header.horizontalMargin}px ${header.bottomSpacing}px`, aspectRatio: String(header.aspectRatio), borderRadius: header.borderRadius, overflow: "hidden", background: "#f8fafc" }}>
            <img src={header.imageUrl} alt="Section banner" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ) : null}
        <div
          style={{
            display: categoryLayout.mode === "grid" ? "grid" : "flex",
            gridTemplateColumns: categoryLayout.mode === "grid" ? "repeat(4, minmax(0, 1fr))" : undefined,
            columnGap: gap,
            rowGap: categoryLayout.mode === "grid" ? rowGap : undefined,
            overflowX: categoryLayout.mode === "grid" ? "hidden" : "auto",
            scrollbarWidth: "none",
            padding: "0 16px",
          }}
        >
          {resolvedItems.length > 0
            ? resolvedItems.map((item) => (
              <div
                key={item.key}
                style={{
                  minWidth: categoryLayout.mode === "grid" ? 0 : 82,
                  width: categoryLayout.mode === "grid" ? "100%" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: `min(100%, ${iconSize}px)`,
                    aspectRatio: "1",
                    borderRadius: 22,
                    background: "#ffffff",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: iconSize * 0.36 }}>
                      {item.emoji}
                    </span>
                  )}
                </div>
                {showLabels ? (
                  <span
                    style={{
                      width: "100%",
                      fontSize: 11,
                      lineHeight: 1.05,
                      fontWeight: 700,
                      color: "#131313",
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.label}
                  </span>
                ) : null}
              </div>
            ))
            : resolvedCategories.length > 0
            ? resolvedCategories.map((cat, index) => (
              <div
                key={cat.id}
                style={{
                  minWidth: categoryLayout.mode === "grid" ? 0 : 82,
                  width: categoryLayout.mode === "grid" ? "100%" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Category icon container — matches Flutter: 64px, borderRadius 22 */}
                <div
                  style={{
                    width: `min(100%, ${iconSize}px)`,
                    aspectRatio: "1",
                    borderRadius: 22,
                    background: "#ffffff",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: iconSize * 0.36 }}>
                      {FALLBACK_ICONS[index % FALLBACK_ICONS.length]}
                    </span>
                  )}
                </div>
                {showLabels ? (
                  <span
                    style={{
                      width: "100%",
                      fontSize: 11,
                      lineHeight: 1.05,
                      fontWeight: 700,
                      color: "#131313",
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {cat.name}
                  </span>
                ) : null}
              </div>
            ))
            : /* Fallback: emoji icons when no API data */
              FALLBACK_ICONS.slice(0, 6).map((emoji, index) => (
              <div
                key={emoji}
                style={{
                  minWidth: categoryLayout.mode === "grid" ? 0 : 82,
                  width: categoryLayout.mode === "grid" ? "100%" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: `min(100%, ${iconSize}px)`,
                    aspectRatio: "1",
                    borderRadius: 22,
                    background: "#ffffff",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: iconSize * 0.36,
                  }}
                >
                  {emoji}
                </div>
                {showLabels ? (
                  <span
                    style={{
                      width: "100%",
                      fontSize: 11,
                      lineHeight: 1.05,
                      fontWeight: 700,
                      color: "#131313",
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {FALLBACK_LABELS[index]}
                  </span>
                ) : null}
              </div>
            ))}
        </div>
      </div>
    </button>
  )
}

export default memo(CategoryIconsPreview)
