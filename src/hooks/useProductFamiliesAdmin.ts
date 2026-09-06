import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createProductFamily,
  deactivateProductFamily,
  getProductFamily,
  listFamilyOptions,
  listProductFamilies,
  updateProductFamily,
} from '../services/productFamiliesAdminService';
import type {
  ProductFamilyCreatePayload,
  ProductFamilyListParams,
  ProductFamilyUpdatePayload,
} from '../types/productFamily.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function useProductFamiliesList(params: ProductFamilyListParams = {}) {
  return useQuery({
    queryKey: ['product-families', params],
    queryFn: () => listProductFamilies(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useProductFamily(id: string | undefined) {
  return useQuery({
    queryKey: ['product-families', 'detail', id],
    queryFn: () => getProductFamily(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useFamilyOptions(familyId: string | undefined) {
  return useQuery({
    queryKey: ['product-families', 'options', familyId],
    queryFn: () => listFamilyOptions(familyId as string),
    enabled: !!familyId,
    staleTime: 15_000,
  });
}

export function useCreateProductFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductFamilyCreatePayload) => createProductFamily(payload),
    onSuccess: () => {
      toast.success('Product family created');
      qc.invalidateQueries({ queryKey: ['product-families'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateProductFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductFamilyUpdatePayload }) =>
      updateProductFamily(id, payload),
    onSuccess: (data) => {
      toast.success('Product family updated');
      qc.invalidateQueries({ queryKey: ['product-families'] });
      qc.invalidateQueries({ queryKey: ['product-families', 'detail', data.id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeactivateProductFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateProductFamily(id),
    onSuccess: () => {
      toast.success('Product family deactivated');
      qc.invalidateQueries({ queryKey: ['product-families'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
