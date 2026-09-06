import { apiClient } from './apiClient';

export interface PincodeMapping {
  id: string;
  pincode: string;
  city: string;
  area: string | null;
  state: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PincodeMappingInput {
  pincode: string;
  city: string;
  area?: string | null;
  state: string;
  isActive?: boolean;
}

export const pincodeMappingService = {
  async getMappings(): Promise<PincodeMapping[]> {
    const res = await apiClient.get<PincodeMapping[]>('/api/v1/admin/pincode-mappings');
    if (res.success && Array.isArray(res.data)) return res.data;
    throw new Error('Failed to fetch pincode mappings');
  },

  async createMapping(input: PincodeMappingInput): Promise<PincodeMapping> {
    const res = await apiClient.post<PincodeMapping>('/api/v1/admin/pincode-mappings', input);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create pincode mapping');
  },

  async updateMapping(id: string, input: Partial<PincodeMappingInput>): Promise<PincodeMapping> {
    const res = await apiClient.put<PincodeMapping>(`/api/v1/admin/pincode-mappings/${id}`, input);
    if (res.success && res.data) return res.data;
    throw new Error(`Failed to update pincode mapping ${id}`);
  },

  async deleteMapping(id: string): Promise<void> {
    const res = await apiClient.delete<null>(`/api/v1/admin/pincode-mappings/${id}`);
    if (!res.success) throw new Error(`Failed to delete pincode mapping ${id}`);
  },
};
