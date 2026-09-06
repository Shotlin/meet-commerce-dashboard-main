import { apiClient } from './apiClient';

export interface SupportTicket {
  id: string;
  customerName: string;
  category: string;
  title?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  orderNumber: string;
  createdAt: string;
  notes?: string[];
  resolutionType?: string;
}

export interface RecallIncident {
  id: string;
  lotNumber: string;
  reason: string;
  affectedUnits: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Initiated' | 'Quarantined' | 'Completed' | 'Active';
  createdAt: string;
  notified?: boolean;
}

// Adapter — backend product_recalls rows are snake_case and have no
// `severity` concept, so it's derived from status/quantity as a reasonable
// local-dev proxy rather than fabricated outright.
const adaptRecall = (b: any): RecallIncident => ({
  id: b.id,
  lotNumber: b.lotNumber || b.lot_number || 'N/A',
  reason: b.reason || '',
  affectedUnits: Number(b.affectedUnits ?? b.affected_units ?? 0),
  severity:
    b.severity ||
    (b.status === 'ACTIVE'
      ? Number(b.affected_units ?? 0) > 50
        ? 'Critical'
        : 'High'
      : b.status === 'DRAFT'
      ? 'Medium'
      : 'Low'),
  status:
    b.status === 'ACTIVE'
      ? 'Active'
      : b.status === 'COMPLETED'
      ? 'Completed'
      : b.status === 'DRAFT'
      ? 'Initiated'
      : b.status || 'Initiated',
  createdAt: b.createdAt || b.created_at || new Date().toISOString(),
  notified: b.notified ?? false,
});

export const supportService = {
  async getTickets(): Promise<SupportTicket[]> {
    const res = await apiClient.get<SupportTicket[]>('/api/v1/support/tickets');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error('Failed to fetch support tickets from API');
  },

  async addPrivateNote(ticketId: string, note: string): Promise<SupportTicket> {
    const res = await apiClient.post<SupportTicket>(`/api/v1/support/tickets/${ticketId}/notes`, { note });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(`Failed to add private note to ticket ${ticketId}`);
  },

  async processRefundOrReplacement(ticketId: string, type: 'Refund' | 'Replacement'): Promise<SupportTicket> {
    const res = await apiClient.post<SupportTicket>(`/api/v1/support/tickets/${ticketId}/refund`, { type });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(`Failed to process ${type} for ticket ${ticketId}`);
  },

  async getRecalls(): Promise<RecallIncident[]> {
    const res = await apiClient.get<any[]>('/api/v1/support/recalls');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(adaptRecall);
    }
    throw new Error('Failed to fetch quality recalls from API');
  },

  async issueEmergencyQuarantine(recallId: string): Promise<RecallIncident> {
    const res = await apiClient.post<any>(`/api/v1/support/recalls/${recallId}/quarantine`);
    if (res.success && res.data) {
      return adaptRecall(res.data);
    }
    throw new Error(`Failed to issue emergency quarantine for recall ${recallId}`);
  },

  async notifyTaskforce(recallId: string): Promise<{ message: string }> {
    const res = await apiClient.post<any>(`/api/v1/support/recalls/${recallId}/notify`);
    if (res.success) {
      return { message: res.message || `Quality taskforce notified for recall ${recallId}` };
    }
    throw new Error(`Failed to notify quality taskforce for recall ${recallId}`);
  }
};
