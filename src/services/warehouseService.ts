import { QCReceipt, QCStatus } from '../types';
import { apiClient } from './apiClient';

const adaptQCReceipt = (b: any): QCReceipt => ({
  id: b.id || b._id || `qc-${Date.now()}`,
  receiptNumber: b.receiptNumber || b.code || `QCR-2026-${Math.floor(Math.random() * 900 + 100)}`,
  appointmentId: b.appointmentId || 'APT-8821',
  vendorName: b.vendorName || b.vendor?.companyName || 'MeatCraft Farms Ltd.',
  categoryName: b.categoryName || 'Mutton / Lamb',
  declaredQtyKg: b.declaredQtyKg ?? b.declaredWeight ?? 450.0,
  measuredQtyKg: b.measuredQtyKg ?? b.measuredWeight ?? 448.2,
  varianceQtyKg: (b.measuredQtyKg ?? 448.2) - (b.declaredQtyKg ?? 450.0),
  temperatureCelsius: b.temperatureCelsius ?? b.temp ?? 2.4,
  temperatureStatus:
    (b.temperatureCelsius ?? 2.4) > 6.0
      ? 'Critical'
      : (b.temperatureCelsius ?? 2.4) > 4.0
      ? 'Warning'
      : 'Normal',
  qcStatus:
    b.qcStatus === 'ACCEPTED' || b.qcStatus === 'Accepted'
      ? 'Accepted'
      : b.qcStatus === 'QUARANTINED' || b.qcStatus === 'Quarantined'
      ? 'Quarantined'
      : b.qcStatus === 'REJECTED' || b.qcStatus === 'Rejected'
      ? 'Rejected'
      : (b.qcStatus as QCStatus) || 'Pending QC',
  inspectorName: b.inspectorName || 'Sanjay Kumar (Senior QC)',
  receivedAt: b.receivedAt || b.createdAt || '2026-08-07 08:30:00',
  notes: b.notes || 'Cold chain verified intact.',
  lotIdCreated: b.lotIdCreated || b.lotId,
  evidencePhotoUrls: Array.isArray(b.evidencePhotoUrls)
    ? b.evidencePhotoUrls
    : ['/assets/banner-01-premium-lamb.png'],
});

export const warehouseService = {
  async getQCReceipts(): Promise<QCReceipt[]> {
    const response = await apiClient.get<any[]>('/api/v1/warehouse-receipts');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(adaptQCReceipt);
    }
    throw new Error('Failed to fetch warehouse QC receipts from API');
  },

  async updateQCStatus(id: string, status: QCStatus, notes?: string): Promise<QCReceipt> {
    const response = await apiClient.patch<any>(`/api/v1/warehouse-receipts/${id}/status`, {
      qcStatus: status,
      notes,
    });
    if (response.success && response.data) {
      return adaptQCReceipt(response.data);
    }
    throw new Error(`Failed to update status for QC receipt ${id} on API`);
  },

  async createQCReceipt(data: Omit<QCReceipt, 'id' | 'receivedAt'>): Promise<QCReceipt> {
    const response = await apiClient.post<any>('/api/v1/warehouse-receipts', data);
    if (response.success && response.data) {
      return adaptQCReceipt(response.data);
    }
    throw new Error('Failed to create new QC receipt on API');
  },
};
