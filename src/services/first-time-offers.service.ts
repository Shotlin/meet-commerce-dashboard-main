import { apiClient } from './apiClient';
import type {
  FirstTimeOffer,
  CreateFirstTimeOfferPayload,
  UpdateFirstTimeOfferPayload,
} from '../types/first-time-offer.types';

export async function getFirstTimeOffers(): Promise<FirstTimeOffer[]> {
  const res = await apiClient.get<FirstTimeOffer[]>('/api/v1/first-time-offers');
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error('Failed to fetch first-time offers');
}

export async function createFirstTimeOffer(payload: CreateFirstTimeOfferPayload): Promise<FirstTimeOffer> {
  const res = await apiClient.post<FirstTimeOffer>('/api/v1/first-time-offers', payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create first-time offer');
}

export async function updateFirstTimeOffer(
  id: string,
  payload: UpdateFirstTimeOfferPayload
): Promise<FirstTimeOffer> {
  const res = await apiClient.patch<FirstTimeOffer>(`/api/v1/first-time-offers/${id}`, payload);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to update first-time offer');
}

export async function deleteFirstTimeOffer(id: string): Promise<void> {
  const res = await apiClient.delete<null>(`/api/v1/first-time-offers/${id}`);
  if (!res.success) throw new Error(res.message || 'Failed to delete first-time offer');
}
