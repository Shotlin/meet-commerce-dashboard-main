import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
import { queryKeys } from '../../services/queryKeys';
import { sectionService, Section, SectionType } from '../../services/sectionService';

const humanize = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AnimatedBannerBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div
    className="w-full rounded-[10px] flex items-end p-2"
    style={{
      height: Math.min(Number(config.height) || 120, 120),
      background: Array.isArray(config.gradient)
        ? `linear-gradient(135deg, ${config.gradient[0] ?? '#eee'}, ${config.gradient[1] ?? '#ccc'})`
        : config.container_color || '#eee',
    }}
  >
    <span className="text-[9px] font-bold text-ink/70 bg-white/60 rounded px-1.5 py-0.5">{config.layout_variant ?? 'banner'}</span>
  </div>
);

const FeeStripBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div className="w-full rounded-full px-3 py-1.5 text-[10px] font-bold text-white text-center" style={{ backgroundColor: config.accent_color || '#999' }}>
    {config.image_url ? 'Fee banner image' : 'Free delivery above ₹299 · No rain fee today'}
  </div>
);

const SeasonalMosaicBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div className="w-full rounded-[10px] p-1.5 grid grid-cols-3 gap-1" style={{ backgroundColor: config.container_color || '#eee' }}>
    {Array.from({ length: config.layout_variant === 'two_by_three' ? 6 : 5 }).map((_, i) => (
      <div key={i} className={`bg-white/40 rounded-[6px] ${i === 0 && config.layout_variant === 'hero_plus_four' ? 'col-span-2 row-span-2 h-12' : 'h-5'}`} />
    ))}
  </div>
);

const RoundCategoryIconsBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div className="flex gap-2 overflow-hidden" style={{ gap: Math.min(Number(config.gap) || 8, 12) }}>
    {Array.from({ length: Number(config.columns) || 4 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-1 shrink-0">
        <div className="rounded-full bg-rose-200" style={{ width: 24, height: 24 }} />
        {config.show_labels && <div className="w-6 h-1 bg-rose-100 rounded" />}
      </div>
    ))}
  </div>
);

const ProductGridBlock: React.FC<{ config: Record<string, any>; limit?: number }> = ({ config, limit }) => (
  <div>
    {config.title && <p className="text-[10px] font-bold text-ink mb-1">{config.title}</p>}
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(Number(config.columns) || 3, 4)}, 1fr)` }}>
      {Array.from({ length: Math.min(limit ?? (Number(config.columns) || 3), 6) }).map((_, i) => (
        <div key={i} className="aspect-square bg-rose-100 rounded-[6px]" />
      ))}
    </div>
  </div>
);

const CarouselBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div>
    {config.title && <p className="text-[10px] font-bold text-ink mb-1">{config.title}</p>}
    <div className="flex gap-1.5 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-10 h-10 bg-rose-100 rounded-[6px] shrink-0" style={{ borderColor: config.accent_color }} />
      ))}
    </div>
  </div>
);

const PromoCarouselBlock: React.FC<{ config: Record<string, any> }> = ({ config }) => (
  <div className="w-full bg-rose-100 flex items-center justify-center text-[9px] text-status-neutral" style={{ borderRadius: config.border_radius ?? 8, aspectRatio: (config.aspect_ratio || '16:9').replace(':', '/'), height: 50 }}>
    promo
  </div>
);

const GenericBlock: React.FC<{ type: SectionType }> = ({ type }) => (
  <div className="w-full border border-dashed border-border rounded-[8px] py-2 text-center text-[9px] text-status-neutral">
    {humanize(type)}
  </div>
);

const SectionBlock: React.FC<{ section: Section }> = ({ section }) => {
  const config = section.config ?? {};
  switch (section.section_type) {
    case 'animated_banner': return <AnimatedBannerBlock config={config} />;
    case 'fee_strip': return <FeeStripBlock config={config} />;
    case 'seasonal_mosaic': return <SeasonalMosaicBlock config={config} />;
    case 'round_category_icons': return <RoundCategoryIconsBlock config={config} />;
    case 'category_product_grid': return <ProductGridBlock config={config} limit={section.merch_binding?.limit} />;
    case 'product_carousel': return <CarouselBlock config={config} />;
    case 'trending_products': return <CarouselBlock config={config} />;
    case 'promo_carousel': return <PromoCarouselBlock config={config} />;
    default: return <GenericBlock type={section.section_type} />;
  }
};

export const ThemeLivePreview: React.FC<{ tabId: string; tabLabel: string }> = ({ tabId, tabLabel }) => {
  // Deliberately reuses the same query key as SectionCanvasPanel — TanStack
  // Query dedupes/shares the cache, so this never issues an extra network
  // request and updates the instant the canvas's own data changes (after a
  // save, no page reload needed).
  const { data: sections = [] } = useQuery({
    queryKey: queryKeys.sections.byTab(tabId),
    queryFn: () => sectionService.listByTab(tabId),
  });

  const visible = sections.filter((s) => s.visible);

  return (
    <div className="sticky top-4">
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-status-neutral uppercase tracking-wide">
        <Smartphone className="w-3.5 h-3.5" /> Live Preview — {tabLabel}
      </div>
      <div className="mx-auto w-[220px] rounded-[28px] border-4 border-ink/80 bg-white shadow-card overflow-hidden">
        <div className="h-4 bg-ink/80 flex items-center justify-center">
          <div className="w-10 h-1.5 bg-white/30 rounded-full" />
        </div>
        <div className="h-[420px] overflow-y-auto p-2 space-y-2 bg-rose-50/40">
          {visible.length === 0 ? (
            <p className="text-[10px] text-status-neutral text-center py-6">No visible sections yet.</p>
          ) : (
            visible.map((section) => <SectionBlock key={section.id} section={section} />)
          )}
        </div>
      </div>
      <p className="text-[10px] text-status-neutral text-center mt-2">Approximate — not a pixel-exact render of the mobile app.</p>
    </div>
  );
};
