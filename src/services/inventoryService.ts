import { InventoryLot } from '../types';
import { apiClient } from './apiClient';

// Real fields only below — the backend's GET /inventory/lots (see
// InventoryRepository#listLots) now LEFT JOINs the actual vendor-procurement
// chain (receipt item -> receipt -> supply order -> vendor -> quality
// video), so a vendor-sourced lot has real data here. A lot that was never
// linked to a vendor receipt (e.g. a manual stock adjustment) genuinely has
// none of this — shown as "Unknown"/null rather than an invented name, per
// this codebase's "no fake mockup" convention (see CLAUDE.md's Orders
// audit, which deleted a near-identical fabricated component for the same
// reason).
const adaptLot = (b: any): InventoryLot => ({
  id: b.id,
  lotNumber: b.batchNumber || b.batch_number || b.id,
  sku: b.sku || b.product_id || '—',
  productName: b.productName || b.product_name || 'Unknown product',
  vendorName: b.vendorName || b.vendor_name || 'Unknown vendor',
  batchNumber: b.batchNumber || b.batch_number || '—',
  receivedDate: b.receivedDate || b.created_at || '',
  expiryDate: b.expiryDate || b.expiry_date || '',
  availableWeightKg: Number(b.availableWeightKg ?? b.quantity_available ?? 0),
  reservedWeightKg: Number(b.reservedWeightKg ?? b.quantity_reserved ?? 0),
  pickedWeightKg: Number(b.pickedWeightKg ?? 0),
  storageTempCelsius: Number(b.storageTempCelsius ?? 0),
  warehouseLocation: b.warehouseLocation || b.warehouse_name || b.warehouse_code || 'Unknown warehouse',
  status:
    b.status === 'QUARANTINED' || b.status === 'Quarantined'
      ? 'Quarantined'
      : b.status === 'LOW_STOCK' || b.status === 'Low Stock'
      ? 'Low Stock'
      : b.status === 'EXPIRED' || b.status === 'Expired'
      ? 'Expired'
      : 'Active',
  lineage: {
    vendorId: b.lineage?.vendorId || b.vendor_id || '',
    supplyBatchId: b.lineage?.supplyBatchId || b.supply_number || '',
    qcReceiptId: b.lineage?.qcReceiptId || '',
    farmOrigin: b.lineage?.farmOrigin || '',
  },
  vendorTrace:
    b.vendor_name || b.vendorName
      ? {
          vendorName: b.vendorName || b.vendor_name,
          supplyNumber: b.supplyNumber || b.supply_number || '',
          videoUrl: b.videoUrl || b.video_url || null,
        }
      : null,
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
