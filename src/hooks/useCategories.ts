// Minimal compatibility hook for the ported theme builder — NOT a full port
// of bakaloo-dashboard's useCategories.ts, which layers a multi-shop
// "Shop_Switcher" cache-scoping system meet-commerce-dashboard doesn't have.
// Backed by the existing catalogPickerService (Phase 2), exposing just a
// flat category list — the only shape the builder's merch-binding pickers
// actually read.
import { useQuery } from '@tanstack/react-query';
import { catalogPickerService } from '../services/catalogPickerService';

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: () => catalogPickerService.listCategories(),
    staleTime: 60_000,
  });
}

// LinkPicker.tsx's link-target picker treats bundles and categories as one
// combined list — this is the general "all bundle-type categories" list it
// needs (it never calls this with a productId in this project's usage),
// not bakaloo's richer per-product bundle-membership query.
export function useBundles() {
  return useQuery({
    queryKey: ['categories', 'bundles'],
    queryFn: async () => {
      const categories = await catalogPickerService.listCategories();
      return categories.filter((c) => c.category_type === 'BUNDLE');
    },
    staleTime: 60_000,
  });
}
