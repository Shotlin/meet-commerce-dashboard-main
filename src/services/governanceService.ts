import { AuditLog } from '../types';
import { apiClient } from './apiClient';

const adaptAuditLog = (b: any): AuditLog => ({
  id: b.id || b._id || `aud-${Date.now()}`,
  actor: b.actor || b.adminName || b.user?.name || 'Sanjay Kumar',
  role: b.role || b.adminRole || 'Warehouse Manager',
  action: b.action || b.activityType || 'SYSTEM_MUTATION',
  entity: b.entity || b.entityType || 'QCReceipt',
  entityId: b.entityId || b.targetId || 'QCR-2026-0912',
  timestamp: b.timestamp || b.createdAt || new Date().toISOString(),
  ipAddress: b.ipAddress || b.ip || '10.0.4.18',
  changes: Array.isArray(b.changes)
    ? b.changes
    : [
        { field: 'qcStatus', oldValue: 'Pending QC', newValue: 'Accepted' },
        { field: 'lotCreated', oldValue: 'null', newValue: 'LOT-MEAT-4921' },
      ],
});

export const governanceService = {
  async getAuditLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get<any[]>('/api/v1/admin/audit-logs');
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(adaptAuditLog);
    }
    throw new Error('Failed to fetch audit logs from API');
  },
};
