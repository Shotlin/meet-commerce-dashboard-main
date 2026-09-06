// Minimal compatibility hook for the ported theme builder — NOT a full port
// of bakaloo-dashboard's useBanners.ts, which layers a multi-shop
// "Shop_Switcher" cache-scoping system meet-commerce-dashboard doesn't have.
// Backed by the existing bannerService (Phase 1), remapped from its
// camelCase Banner shape to the snake_case shape the ported builder files
// (PropertyEditor.tsx, previews/CarouselPreview.tsx) read.
import { useQuery } from '@tanstack/react-query';
import { bannerService } from '../services/bannerService';

export interface SystemBanner {
  id: string;
  title: string;
  image_url: string;
  link_type: string;
  link_value: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners', 'system'],
    queryFn: async (): Promise<SystemBanner[]> => {
      const banners = await bannerService.getBanners();
      return banners.map((b) => ({
        id: b.id,
        title: b.title,
        image_url: b.imageUrl,
        link_type: b.linkType,
        link_value: b.linkValue,
        is_active: b.isActive,
        sort_order: b.sortOrder,
      }));
    },
    staleTime: 30_000,
  });
}
