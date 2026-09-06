import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productsAdminService';
import type { ProductFilters, ProductPayload } from '../types/product.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function useAdminProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products-admin', filters],
    queryFn: () => getProducts(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminProduct(id: string | null) {
  return useQuery({
    queryKey: ['products-admin', id],
    queryFn: () => getProduct(id as string),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => {
      toast.success('Product created');
      qc.invalidateQueries({ queryKey: ['products-admin'] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
      qc.invalidateQueries({ queryKey: ['product-families'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) =>
      updateProduct(id, payload),
    onSuccess: (_, { id }) => {
      toast.success('Product updated');
      qc.invalidateQueries({ queryKey: ['products-admin'] });
      qc.invalidateQueries({ queryKey: ['products-admin', id] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
      qc.invalidateQueries({ queryKey: ['product-families'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['products-admin'] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
      qc.invalidateQueries({ queryKey: ['product-families'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
