import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdminCategories,
  getAdminBundles,
  getCategoriesForProduct,
  toggleCategoryMembership,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProductRanks,
  setCategoryProducts,
} from '../services/categoriesAdminService';
import type { Category, CategoryTree, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Build a parent/child tree from a flat category list. */
function buildTree(categories: Category[]): CategoryTree[] {
  const byParent = new Map<string | null, CategoryTree[]>();
  categories.forEach((c) => {
    const list = byParent.get(c.parent_id) ?? [];
    list.push({ ...c, children: [] });
    byParent.set(c.parent_id, list);
  });

  function attach(nodes: CategoryTree[]): CategoryTree[] {
    return nodes
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((node) => ({ ...node, children: attach(byParent.get(node.id) ?? []) }));
  }

  return attach(byParent.get(null) ?? []);
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['categories-admin'],
    queryFn: getAdminCategories,
    staleTime: 30_000,
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories-admin'],
    queryFn: getAdminCategories,
    staleTime: 30_000,
    select: buildTree,
  });
}

export function useAdminBundles() {
  return useQuery({
    queryKey: ['categories-admin', 'bundles'],
    queryFn: getAdminBundles,
    staleTime: 30_000,
  });
}

export function useCategoriesForProduct(productId?: string) {
  return useQuery({
    queryKey: ['categories-admin', 'for-product', productId ?? null],
    queryFn: () => getCategoriesForProduct(productId as string),
    enabled: !!productId,
  });
}

export function useToggleCategoryMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, productId, isMember }: { categoryId: string; productId: string; isMember: boolean }) =>
      toggleCategoryMembership(categoryId, productId, isMember),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-admin'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCreateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateCategoryPayload, 'category_type'>) =>
      createCategory({ ...payload, category_type: 'BUNDLE' }),
    onSuccess: () => {
      toast.success('Bundle created');
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) => updateCategory(id, payload),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCategoryProductRanks(categoryId: string | null) {
  return useQuery({
    queryKey: ['categories-admin', 'products', categoryId],
    queryFn: () => getCategoryProductRanks(categoryId as string),
    enabled: !!categoryId,
  });
}

export function useSetCategoryProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, productIds }: { categoryId: string; productIds: string[] }) =>
      setCategoryProducts(categoryId, productIds),
    onSuccess: () => {
      toast.success('Product order saved');
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
