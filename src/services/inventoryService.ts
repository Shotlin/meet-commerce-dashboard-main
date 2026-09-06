import { InventoryLot } from '../types';
import { apiClient } from './apiClient';

const adaptLot = (b: any): InventoryLot => ({
  id: b.id || b._id || `lot-${Date.now()}`,
  lotNumber: b.lotNumber || b.batch_number || `LOT-MEAT-${Math.floor(Math.random() * 9000 + 1000)}`,
  sku: b.sku || 'SKU-MUT-G01',
  productName: b.productName || b.product_name || b.product?.title || 'Fresh Meat Lot',
  vendorName: b.vendorName || b.vendor?.companyName || 'MeatCraft Farms Ltd.',
  batchNumber: b.batchNumber || b.batch_number || b.batchCode || 'BATCH-2026-88',
  receivedDate: b.receivedDate || b.created_at || new Date().toISOString().split('T')[0],
  expiryDate: b.expiryDate || b.expiry_date || '2026-08-15',
  availableWeightKg: Number(b.availableWeightKg ?? b.quantity_available ?? b.stockKg ?? 100.0),
  reservedWeightKg: Number(b.reservedWeightKg ?? b.quantity_reserved ?? 0.0),
  pickedWeightKg: Number(b.pickedWeightKg ?? 0.0),
  storageTempCelsius: Number(b.storageTempCelsius ?? 2.1),
  warehouseLocation: b.warehouseLocation || 'North Delhi Hub (Cold Bay 1)',
  status:
    b.status === 'QUARANTINED' || b.status === 'Quarantined'
      ? 'Quarantined'
      : b.status === 'LOW_STOCK' || b.status === 'Low Stock'
      ? 'Low Stock'
      : b.status === 'EXPIRED' || b.status === 'Expired'
      ? 'Expired'
      : 'Active',
  lineage: {
    vendorId: b.lineage?.vendorId || 'VEN-101',
    supplyBatchId: b.lineage?.supplyBatchId || 'SB-8821',
    qcReceiptId: b.lineage?.qcReceiptId || 'QCR-2026-0912',
    farmOrigin: b.lineage?.farmOrigin || 'Satara Organic Farms, Maharashtra',
  },
});

export const inventoryService = {
  async getLots(): Promise<InventoryLot[]> {
    const response = await apiClient.get<any[]>('/api/v1/inventory/lots');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(adaptLot);
    }
    throw new Error('Failed to fetch inventory lots from API');
  },

  async getLotById(id: string): Promise<InventoryLot | undefined> {
    const response = await apiClient.get<any>(`/api/v1/inventory/${id}`);
    if (response.success && response.data) {
      return adaptLot(response.data);
    }
    throw new Error(`Inventory lot ${id} not found on API`);
  },

  async createLot(lotData: Partial<InventoryLot>): Promise<InventoryLot> {
    const response = await apiClient.post<any>('/api/v1/inventory', lotData);
    if (response.success && response.data) {
      return adaptLot(response.data);
    }
    throw new Error('Failed to create inventory lot on API');
  },

  async updateLotStatus(id: string, status: InventoryLot['status']): Promise<InventoryLot> {
    const response = await apiClient.patch<any>(`/api/v1/inventory/${id}/status`, {
      status,
    });
    if (response.success && response.data) {
      return adaptLot(response.data);
    }
    throw new Error(`Failed to update lot status for ${id} on API`);
  },
};
