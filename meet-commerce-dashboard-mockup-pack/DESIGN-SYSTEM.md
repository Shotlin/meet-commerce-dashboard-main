# Meet Commerce design system

## Visual position

Premium, transparent and operationally serious. The product should feel like a trustworthy food brand at the customer-facing edges and a highly legible control room in back-office use. Pink is the brand signal; it must never become the only way to communicate status.

## Type

- **Primary:** Manrope, 400 / 500 / 600 / 700. Use for navigation, headings, body and controls.
- **Numbers and IDs:** DM Mono, 500 / 600. Use for order IDs, lot IDs, values, timestamps and audit diffs.
- **Fallback stack:** `Manrope, Inter, ui-sans-serif, system-ui, sans-serif` and `DM Mono, ui-monospace, monospace`.
- **Scale:** 12 (metadata), 13 (dense table), 14 (body), 16 (section), 20 (page title), 28 (KPI / headline). Line-height: 1.35 for data and 1.45 for prose.

## Palette

| Token | Value | Intended use |
|---|---:|---|
| Ink | `#351226` | Heading and high-emphasis text |
| Brand berry | `#9D174D` | Navigation foundation, strong emphasis |
| Brand raspberry | `#E31E64` | Primary buttons, selected state, active series |
| Rose 100 | `#FCE7EF` | Selected-row / selected-nav wash |
| Rose 50 | `#FFF5F8` | Application canvas |
| Surface | `#FFFFFF` | Cards, tables, forms |
| Border | `#F1D7E1` | Separators and quiet inputs |
| Success | `#179B73` | Accepted, paid, delivered, verified |
| Info | `#2769D7` | Informational status, in-progress location |
| Warning | `#D98900` | Temperature risk, review, quarantine |
| Danger | `#D63B4D` | Rejected, recall, failed or destructive actions |
| Neutral | `#667085` | Muted data, empty/disabled state |

## Components

- Canvas: `#FFF5F8`; cards: white with a 1px `#F1D7E1` border and 12px radius.
- Primary action: raspberry fill, white label; destructive action: danger outline until confirmation.
- Sidebar: use a deep berry field for HQ mode and a light surface for operational sub-apps. Always keep section grouping visible.
- Tables: 44-52px rows, pinned headers, no striped rows, hover surface in Rose 50, filter chips above rather than inside headers.
- Status: use icon + label + colour. Never use colour alone.
- Charts: one active raspberry series; comparison in slate/grey; success in teal; exceptions in warning/danger. Put values in tooltips and reserve direct labels for key inflection points.

## Data visualisation rules

- **Trend over time:** line/area chart with prior-period dashed comparison.
- **State mix:** donut with direct legend values; do not exceed six states.
- **Category or vendor comparison:** sorted horizontal/vertical bars.
- **Operations flow:** stepper or lineage graph, never a generic pie chart.
- **Geography:** delivery coverage and recall exposure maps only, with a visible legend and accessible list alternative.
- **Risk:** heat strip plus table, with critical exceptions still exposed in the global queue.

## Responsive behaviour

The pack is desktop-first at 1440px. At tablet width, place filters in a horizontal drawer and collapse the secondary detail pane into a right-side sheet. On handheld scanners, retain only task-specific flows (pick, pack, receive, QC); do not reproduce the HQ dashboard.

