/**
 * Razorpay settings types — mirror the backend's `razorpay_settings` table
 * (migration 132) and `/api/v1/admin/razorpay-settings` admin API.
 */

export type RazorpayMode = 'TEST' | 'PRODUCTION';

export type RazorpayTestStatus = 'SUCCESS' | 'FAILED';

/** Admin-safe view of one environment — the raw secret is never returned. */
export interface RazorpayEnvironmentSettings {
  configured: boolean;
  maskedKeyId: string | null;
  hasWebhookSecret: boolean;
  lastTestedAt: string | null;
  lastTestStatus: RazorpayTestStatus | null;
  lastTestMessage: string | null;
}

export interface RazorpaySettings {
  activeMode: RazorpayMode;
  environments: {
    TEST: RazorpayEnvironmentSettings;
    PRODUCTION: RazorpayEnvironmentSettings;
  };
  updatedAt: string | null;
}

/** Result of a live "Test Connection" check (draft or stored credentials). */
export interface RazorpayTestResult {
  success: boolean;
  statusCode: number | null;
  message: string;
}

/** `keyId`/`keySecret` both omitted -> tests whatever is already saved for `mode`. */
export interface TestRazorpayCredentialsPayload {
  mode: RazorpayMode;
  keyId?: string;
  keySecret?: string;
}

/** Omit a field to leave it untouched; empty string clears it. */
export interface SaveRazorpayCredentialsPayload {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
}

export interface ActivateRazorpayModePayload {
  mode: RazorpayMode;
  /** Required (true) when activating PRODUCTION. */
  confirm?: boolean;
}
