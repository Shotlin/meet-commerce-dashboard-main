# Shared Section Header Design

## Goal

Extend the existing `product_carousel`, `round_category_icons`, and
`category_product_grid` manifest sections with one reusable graphical header
contract. The extension must render identically in the Theme Builder simulator
and the Flutter app while preserving the current physical-shop, store-key, tab,
and section scope.

## Scope and non-goals

This design changes existing section configuration only. It does not add a
section type, a second builder, a new persistence table, or a new store/tab
inheritance rule. Existing Premium Fresh product-card widgets and their grid
column/card-size logic remain unchanged.

The feature applies to:

- `product_carousel` (Premium Fresh — Product Slider)
- `round_category_icons` (Category Icons)
- `category_product_grid` (Premium Fresh — Product Grid)

## Persisted configuration contract

The section manifest's existing `config` JSONB column remains the sole source
of configuration. Each supported type may contain this nested object:

```json
{
  "title": "Our current hits",
  "subtitle": "Here’s what everyone’s eating!",
  "section_header": {
    "style": "text",
    "image_url": null,
    "visible": true,
    "image_aspect_ratio": 3.6,
    "image_width": 1080,
    "image_height": 300,
    "border_radius": 14,
    "horizontal_margin": 16,
    "bottom_spacing": 12,
    "link_url": null,
    "graphic_description": "",
    "store_name": ""
  }
}
```

`style` is one of `text`, `graphic`, or `text_graphic`. Missing
`section_header` is interpreted as the backwards-compatible default `text`.
The existing `title` and `subtitle` remain the canonical text values; the
prompt editor's Heading and Supporting text fields edit those same keys rather
than creating competing copies. A `graphic` style hides both text fields in
the renderer, allowing artwork with embedded copy. `visible: false` suppresses
the uploaded graphic without altering the selected style or stored asset.

The fixed image metadata is persisted with every new header rather than
inferred from arbitrary uploads. This makes the renderer's ratio deterministic:
`renderedHeight = availableWidth / 3.6`, equivalently
`availableWidth * 300 / 1080`. No renderer may hardcode a 100 logical-pixel
height. Images use contain/full-composition behavior when it fits; only a
necessary crop uses centered `BoxFit.cover` / `object-fit: cover`.

The Category Icons config also gains:

```json
{
  "layout_mode": "horizontal_scroll",
  "columns": 4,
  "icon_size": 64,
  "gap": 12,
  "row_gap": 14,
  "show_labels": true
}
```

`layout_mode` defaults to `horizontal_scroll`. In grid mode, `columns` defaults
to and is constrained to four for the Premium Fresh mobile layout. The item
width is calculated from the available width and the inter-column gap; rows are
natural (`ceil(itemCount / 4)`) and the incomplete final row is left aligned.

## Dashboard behavior

`sectionTypesMeta.ts` supplies defaults for all existing cards of the three
types. The Property Editor supplies a reusable Section Header panel to the
existing product and category editors. It includes:

- Header Style: Text, Graphic Banner, Text + Graphic Banner.
- one image uploader with the exact copy below it:
  - `Recommended size: 1080 × 300 px`
  - `Aspect ratio: 3.6:1`
  - PNG, JPG, WebP; recommended maximum file size: 2 MB.
- graphic visibility, radius, horizontal margin, bottom spacing, and optional
  link controls.
- Heading, Supporting text, Graphic description / campaign requirement, and
  Store/brand name inputs, followed by a Copy Image Prompt action.

The copied prompt is exactly this template, with the bracketed values resolved
from the section's current title, subtitle, type label, and editable fields:

```text
Create a premium graphical section header banner for a mobile grocery/meat commerce application. Canvas size exactly 1080 × 300 px, aspect ratio 3.6:1. This artwork will appear directly above the [SECTION NAME] section. Theme/store: [STORE NAME]. Main heading/message: [HEADING]. Supporting message: [SUBHEADING]. Create a polished premium quick-commerce visual with strong branding, clean hierarchy, rich product imagery or illustrations, mobile-safe typography and balanced spacing. Keep all critical text/logo content inside the central safe area. Do not add device frames, UI controls or excessive empty margins. Output one complete 1080×300 banner ready for direct upload.
```

The Category Icons editor additionally exposes Layout (Horizontal Scroll or
Multi-row Grid), Columns, Icon Size, Horizontal Gap, Vertical Gap, labels, and
the existing category item/binding controls. Its initial values are four
columns, 64px icon size, 12px horizontal gap, 14px vertical gap, and labels on.

Preview renderers consume only the section's local config. They render optional
text, then a stationary graphic, then the existing rail/grid. The Category
Icons preview grid wraps at four calculated columns; its scroll view remains
non-wrapping with roughly four normal-size items visible. The product-carousel
preview has only its product-card list horizontally scrollable.

## Flutter behavior

`section_registry.dart` owns a reusable manifest header widget and a parsed
header value derived from `SectionManifestEntry.config`. It produces these
orders:

```text
text style:          title/subtitle → content
graphic style:        graphic → content
text_graphic style:   title/subtitle → graphic → content
```

The graphic is a sibling above, never inside, the product ListView or category
rail. It uses the configured 16px horizontal margin, 14px radius, 12px bottom
gap, and the 3.6:1 ratio defaults. A populated link invokes the existing
manifest-link action path; an absent link is not tappable. The Product Grid
passes the same product list, variant, and column count to the existing card
layout after the header has rendered.

The category renderer chooses between the existing horizontal ListView and a
new non-scrollable Wrap/Grid implementation. Both retain the same category
selection and image behavior. Grid mode has no horizontal overflow and its
height is determined by the number of category items.

## Persistence and scope isolation

No database migration is required: `section_manifests.config` is already JSONB
and the admin section service merges incoming config into that section's
existing config. The repository already materializes a physical shop's copy of
the selected tab layout before mutation, and every lookup uses `tab_id` plus
the nullable `shop_id` scope. The public manifest endpoint returns that resolved
section config unchanged for the requested store, physical shop, price mode,
and tab. Flutter cache/provider keys already include the same scope tuple.

Therefore an image or layout change is isolated by the existing manifest row:
Kolkata and Delhi can differ; All and Chicken can differ; a section configured
only on All does not appear in another tab unless that tab's own manifest
contains the section. The change must not add fallback copying or config-level
inheritance.

## Verification

Dashboard tests will cover header defaults, prompt substitution, style-driven
preview order/visibility, aspect-ratio math, and Category Icons scroll versus
four-column grid behavior including a 10-item, three-row grid.

Backend tests will extend the existing tab/shop manifest isolation fixture with
different `section_header.image_url` values in distinct shop and tab manifests,
proving public resolution does not cross scopes.

Flutter widget/unit tests will cover 3.6:1 constrained rendering, title hiding
in graphic mode, stationary banners around a horizontal product rail, and ten
category items rendering as 4/4/2 with no horizontal scroll in grid mode. The
existing scoped manifest-provider tests remain the regression proof for store,
shop, and tab cache identity.
