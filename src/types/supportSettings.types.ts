/**
 * Centralized brand name / support phone / support email — the single
 * source of truth every mobile "Need Help"/"Contact Us" surface reads
 * from (see backend `support-settings` module, migration 131).
 */
export interface SupportSettings {
  brandName: string;
  supportPhone: string | null;
  supportEmail: string | null;
  updatedAt: string | null;
}

export interface SaveSupportSettingsPayload {
  brandName?: string;
  supportPhone?: string;
  supportEmail?: string;
}
