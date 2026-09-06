import { SectionType } from '../../services/sectionService';

// Typed field definitions per section type, ground-truthed from the real
// `config` JSONB seeded on section_manifests (see PROGRESS.md's "Phase 2
// kickoff findings" for the raw samples this was built from). Only types
// with real seed data to infer a shape from get an entry here — anything
// else falls back to the generic JSON editor in `SectionCanvasPanel.tsx`.
export type FieldDef =
  | { type: 'text'; key: string; label: string; placeholder?: string }
  | { type: 'number'; key: string; label: string; min?: number; max?: number }
  | { type: 'color'; key: string; label: string }
  | { type: 'combo'; key: string; label: string; suggestions: string[] }
  | { type: 'toggle'; key: string; label: string }
  | { type: 'color-pair'; key: string; label: string; labels: [string, string] };

export const SECTION_FIELD_DEFS: Partial<Record<SectionType, FieldDef[]>> = {
  animated_banner: [
    { type: 'number', key: 'height', label: 'Height (px)', min: 1 },
    { type: 'color-pair', key: 'gradient', label: 'Gradient', labels: ['Start', 'End'] },
    { type: 'combo', key: 'layout_variant', label: 'Layout Variant', suggestions: ['editorial_hero', 'full_bleed', 'dark_feature', 'festival_hero', 'fresh_highlight'] },
    { type: 'color', key: 'container_color', label: 'Container Color' },
  ],
  fee_strip: [
    { type: 'toggle', key: 'visible', label: 'Show Fee Pill' },
    { type: 'text', key: 'image_url', label: 'Image URL (optional)' },
    { type: 'combo', key: 'pill_style', label: 'Pill Style', suggestions: ['soft', 'solid'] },
    { type: 'color', key: 'accent_color', label: 'Accent Color' },
  ],
  seasonal_mosaic: [
    { type: 'combo', key: 'hero_ratio', label: 'Hero Ratio', suggestions: ['16:10', '4:3', '1:1'] },
    { type: 'number', key: 'tile_radius', label: 'Tile Radius (px)', min: 0 },
    { type: 'combo', key: 'layout_variant', label: 'Layout Variant', suggestions: ['two_by_three', 'hero_plus_four'] },
    { type: 'color', key: 'container_color', label: 'Container Color' },
  ],
  round_category_icons: [
    { type: 'number', key: 'gap', label: 'Gap (px)', min: 0 },
    { type: 'number', key: 'columns', label: 'Columns', min: 1, max: 12 },
    { type: 'number', key: 'icon_size', label: 'Icon Size (px)', min: 1 },
    { type: 'toggle', key: 'show_labels', label: 'Show Labels' },
  ],
  promo_carousel: [
    { type: 'combo', key: 'aspect_ratio', label: 'Aspect Ratio', suggestions: ['16:9', '1:1', '4:3'] },
    { type: 'number', key: 'border_radius', label: 'Border Radius (px)', min: 0 },
    { type: 'toggle', key: 'show_pagination', label: 'Show Pagination' },
    { type: 'number', key: 'auto_scroll_speed', label: 'Auto-Scroll Speed (ms)', min: 0 },
  ],
  category_product_grid: [
    { type: 'text', key: 'title', label: 'Title' },
    { type: 'number', key: 'columns', label: 'Columns', min: 1, max: 6 },
    { type: 'combo', key: 'card_shape', label: 'Card Shape', suggestions: ['rounded', 'square'] },
    { type: 'combo', key: 'image_ratio', label: 'Image Ratio', suggestions: ['1:1', '4:3', '16:9'] },
    { type: 'toggle', key: 'show_quick_add', label: 'Show Quick-Add' },
  ],
  product_carousel: [
    { type: 'text', key: 'title', label: 'Title' },
    { type: 'number', key: 'peek', label: 'Edge Peek (px)', min: 0 },
    { type: 'combo', key: 'card_style', label: 'Card Style', suggestions: ['standard', 'compact'] },
    { type: 'toggle', key: 'auto_scroll', label: 'Auto-Scroll' },
  ],
  trending_products: [
    { type: 'text', key: 'title', label: 'Title' },
    { type: 'number', key: 'limit', label: 'Item Limit', min: 1, max: 50 },
    { type: 'combo', key: 'card_style', label: 'Card Style', suggestions: ['standard', 'compact'] },
    { type: 'color', key: 'accent_color', label: 'Accent Color' },
  ],
};
