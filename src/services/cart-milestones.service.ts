import { apiClient } from './apiClient';
import type {
  CartMilestone,
  CreateCartMilestonePayload,
  UpdateCartMilestonePayload,
} from '../types/cart-milestone.types';

export async function getCartMilestones(): Promise<CartMilestone[]> {
  const res = await apiClient.get<CartMilestone[]>('/api/v1/cart-milestones');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch cart milestones');
}

export async function createCartMilestone(payload: CreateCartMilestonePayload): Promise<CartMilestone> {
  const res = await apiClient.post<CartMilestone>('/api/v1/cart-milestones', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create cart milestone');
}

export async function updateCartMilestone(
  id: string,
  payload: UpdateCartMilestonePayload
): Promise<CartMilestone> {
  const res = await apiClient.patch<CartMilestone>(`/api/v1/cart-milestones/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update cart milestone');
}

export async function deleteCartMilestone(id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/cart-milestones/${id}`);
  if (!res.success) throw new Error(res.message || 'Failed to delete cart milestone');
}
