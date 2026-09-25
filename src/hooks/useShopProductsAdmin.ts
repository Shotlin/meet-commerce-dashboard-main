import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adjustShopProductStock,
  createShopProduct,
  deleteShopProduct,
  getShopProductInventoryLots,
  listShopProducts,
  updateShopProduct,
} from '../services/shopProductsAdminService';
import type {
  AdjustShopProductStockPayload,
  CreateShopProductPayload,
  ShopProductListParams,
  UpdateShopProductPayload,
} from '../types/shopProduct.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function useShopProducts(shopId: string | null, filters: ShopProductListParams = {}) {
  return useQuery({
    queryKey: ['shop-products', shopId, filters],
    queryFn: () => listShopProducts(shopId as string, filters),
    enabled: !!shopId,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateShopProduct(shopId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShopProductPayload) => createShopProduct(shopId as string, payload),
    onSuccess: () => {
      toast.success('Product added to shop');
      qc.invalidateQueries({ queryKey: ['shop-products', shopId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateShopProduct(shopId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShopProductPayload }) =>
      updateShopProduct(shopId as string, id, payload),
    onSuccess: () => {
      toast.success('Shop product updated');
      qc.invalidateQueries({ queryKey: ['shop-products', shopId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteShopProduct(shopId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShopProduct(shopId as string, id),
    onSuccess: () => {
      toast.success('Product removed from shop');
      qc.invalidateQueries({ queryKey: ['shop-products', shopId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/**
 * The vendor batches backing one shop product's stock — "which vendor
 * supplied this number." Only meaningful in edit mode (a shop product must
 * already exist), so callers pass `null` for `shopProductId` until then.
 */
export function useShopProductInventoryLots(shopId: string | null, shopProductId: string | null) {
  return useQuery({
    queryKey: ['shop-products', shopId, shopProductId, 'inventory-lots'],
    queryFn: () => getShopProductInventoryLots(shopId as string, shopProductId as string),
    enabled: !!shopId && !!shopProductId,
    staleTime: 15_000,
  });
}

export function useAdjustShopProductStock(shopId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shopProductId, payload }: { shopProductId: string; payload: AdjustShopProductStockPayload }) =>
      adjustShopProductStock(shopId as string, shopProductId, payload),
    onSuccess: (_data, { shopProductId }) => {
      toast.success('Stock adjusted');
      qc.invalidateQueries({ queryKey: ['shop-products', shopId] });
      qc.invalidateQueries({ queryKey: ['shop-products', shopId, shopProductId, 'inventory-lots'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
