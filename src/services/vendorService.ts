import { Vendor } from '../types';
import { apiClient } from './apiClient';

// Adapter function to map backend vendor payload to frontend Vendor interface
const adaptVendor = (b: any): Vendor => ({
  id: b.id || b.vendorId || `VEN-${Math.floor(Math.random() * 1000)}`,
  companyName: b.companyName || b.name || 'Vendor Partner',
  contactPerson: b.contactPerson || b.ownerName || 'Contact Person',
  email: b.email || 'vendor@meetcommerce.com',
  phone: b.phone || '+91 98000 00000',
  category: b.category || 'Meat & Poultry',
  kycStatus:
    b.kycStatus === 'VERIFIED' || b.kycStatus === 'Verified' || b.status === 'VERIFIED' || b.status === 'ACTIVE'
      ? 'Verified'
      : b.kycStatus === 'REJECTED' || b.kycStatus === 'Rejected' || b.status === 'SUSPENDED' || b.status === 'DEACTIVATED'
      ? 'Rejected'
      : b.kycStatus === 'PENDING_DOCS' || b.status === 'KYC_SUBMITTED'
      ? 'Pending Docs'
      : 'Under Review',
  riskScore:
    b.riskScore === 'HIGH' || b.riskScore === 'High'
      ? 'High'
      : b.riskScore === 'MEDIUM' || b.riskScore === 'Medium'
      ? 'Medium'
      : 'Low',
  activeBatches: b.activeBatches ?? b.batchCount ?? 4,
  totalFulfilledValue: Number(b.totalFulfilledValue ?? b.totalGmv ?? 1500000),
  rating: Number(b.rating ?? 4.8),
  joinedDate: b.joinedDate || b.createdAt || '2024-01-01',
  licenseNumber: b.licenseNumber || b.fssaiLicense || b.profile?.fssai_license || 'FSSAI-11521034000192',
});

export const vendorService = {
  async getVendors(): Promise<Vendor[]> {
    const response = await apiClient.get<any[]>('/api/v1/vendors');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(adaptVendor);
    }
    throw new Error('Failed to fetch vendors from API');
  },

  async updateVendorKyc(id: string, kycStatus: Vendor['kycStatus']): Promise<Vendor> {
    const response = await apiClient.patch<any>(`/api/v1/vendors/${id}/kyc`, {
      kycStatus,
    });
    if (response.success && response.data) {
      return adaptVendor(response.data);
    }
    throw new Error(`Failed to update KYC status for vendor ${id} on API`);
  },
};
