import { apiClient } from './apiClient';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerSegmentInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const customerSegmentService = {
  async getSegments(): Promise<CustomerSegment[]> {
    const res = await apiClient.get<CustomerSegment[]>('/api/v1/admin/customer-segments');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch customer segments');
  },
  async createSegment(input: CustomerSegmentInput): Promise<CustomerSegment> {
    const res = await apiClient.post<CustomerSegment>('/api/v1/admin/customer-segments', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create customer segment');
  },
  async updateSegment(id: string, input: Partial<CustomerSegmentInput>): Promise<CustomerSegment> {
    const res = await apiClient.patch<CustomerSegment>(`/api/v1/admin/customer-segments/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update customer segment ${id}`);
  },
  async deleteSegment(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/customer-segments/${id}`);
    if (!res.success) throw new Error(`Failed to delete customer segment ${id}`);
  },
};
