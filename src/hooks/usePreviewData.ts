// Ported from bakaloo-dashboard's src/hooks/usePreviewData.ts — feeds the
// MobilePreviewFrame's live preview with real category/product data.
// `Category`/`Product` come from catalogPickerService's CategoryOption/
// ProductOption (Phase 2's real-shape types) rather than bakaloo's own
// `@/types` Category/Product, which don't exist in this project.
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/products.service';
import { catalogPickerService, type CategoryOption, type ProductOption } from '../services/catalogPickerService';

export type Category = CategoryOption;
export type Product = ProductOption;

export interface PreviewData {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
}

export function usePreviewData(productIds: string[] = []): PreviewData {
  const ids = [...new Set(productIds)].sort()
  const selectedProductsQuery = useQuery({
    queryKey: ["products", "preview-selected", ids],
    queryFn: () => catalogPickerService.getProductsByIds(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogPickerService.listCategories(),
    staleTime: 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'preview'],
    queryFn: () => getProducts({ limit: 30 }),
    staleTime: 60_000,
  });

  return {
    categories: categoriesQuery.data ?? [],
    products: [...new Map([...(productsQuery.data?.products ?? []), ...(selectedProductsQuery.data ?? [])].map(product => [product.id, product])).values()],
    isLoading: categoriesQuery.isLoading || productsQuery.isLoading,
  };
}

/** Resolve products for a section based on its merch_binding category_ids */
export function resolveProductsForSection(
  allProducts: Product[],
  section: { merch_binding?: { category_ids?: string[]; product_ids?: string[] } | null },
  limit = 6
): Product[] {
  const binding = section.merch_binding;
  if (!binding) return allProducts.slice(0, limit);

  // Manual product IDs
  if (binding.product_ids?.length) {
    const byId = new Map(allProducts.map(product => [product.id, product]));
    return binding.product_ids.flatMap(id => byId.has(id) ? [byId.get(id)!] : []).slice(0, limit);
  }

  // Category-scoped
  if (binding.category_ids?.length) {
    const ids = new Set(binding.category_ids);
    const scoped = allProducts.filter((p) => p.category_id && ids.has(p.category_id));
    return scoped.slice(0, limit);
  }

  return allProducts.slice(0, limit);
}

/** Resolve categories for a section's merch_binding */
export function resolveCategoriesForSection(
  allCategories: Category[],
  section: { merch_binding?: { category_ids?: string[] } | null },
  limit = 8
): Category[] {
  const binding = section.merch_binding;
  const active = allCategories.filter((c) => c.is_active);

  if (binding?.category_ids?.length) {
    const ids = new Set(binding.category_ids);
    const matched = active.filter((c) => ids.has(c.id) || (c.parent_id && ids.has(c.parent_id)));
    if (matched.length) return matched.slice(0, limit);
  }

  // Fallback: top-level categories
  const parents = active.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  return (parents.length ? parents : active).slice(0, limit);
}
