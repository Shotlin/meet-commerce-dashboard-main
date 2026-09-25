// Types for the FreshCuts vendor procurement module. Mirrors the backend
// vendor-procurement module (migrations 133–137, Fastify responses) — keep in
// sync with meet-commerce-backend-main/src/modules/vendor-procurement/.

export type ProcurementMode = 'FIXED_OFFER' | 'RFQ';

export type ProcurementRequestStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'AWARDED'
  | 'IN_FULFILMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type RecipientStatus =
  | 'NEW'
  | 'VIEWED'
  | 'DECLINED'
  | 'RESPONDED'
  | 'AWARDED'
  | 'NOT_SELECTED'
  | 'EXPIRED';

export type SupplyStatus =
  | 'AWARDED'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'CLEANING'
  | 'VIDEO_SUBMITTED'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED_PENDING_RECEIPT'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED_AT_RECEIPT';

export type QuantityUnit = 'KG' | 'PC' | 'PACK' | 'LTR';

export interface ProcurementRequestItem {
  id: string;
  request_id: string;
  category_id: string;
  product_id: string | null;
  item_name: string;
  requested_quantity: string | number;
  unit: QuantityUnit;
  spec_note: string | null;
  fixed_unit_price: string | number | null;
  fixed_line_total: string | number | null;
  category_name?: string;
  created_at?: string;
}

export interface ProcurementRecipient {
  id: string;
  request_id: string;
  vendor_id: string;
  status: RecipientStatus;
  eligibility: Record<string, unknown>;
  viewed_at: string | null;
  responded_at: string | null;
  decided_at: string | null;
  vendor_name?: string;
  vendor_phone?: string;
  vendor_email?: string;
}

export interface ProcurementRequest {
  id: string;
  request_number: string;
  shop_id: string;
  mode: ProcurementMode;
  status: ProcurementRequestStatus;
  title: string;
  required_delivery_at: string | null;
  response_deadline: string | null;
  notes: string | null;
  quality_instructions: string | null;
  substitutes_allowed: boolean;
  offer_total: string | number | null;
  awarded_vendor_id: string | null;
  awarded_at: string | null;
  award_total: string | number | null;
  published_at: string | null;
  closed_at: string | null;
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  shop_name?: string;
  shop_city?: string;
  shop_pincode?: string;
  shop_serviceable_pincodes?: string[];
  awarded_vendor_name?: string | null;
  recipient_count?: number;
  responded_count?: number;
}

export interface ProcurementRequestDetail extends ProcurementRequest {
  items: ProcurementRequestItem[];
  recipients: ProcurementRecipient[];
}

export interface ProcurementRequestListRow extends ProcurementRequest {
  item_summary?: Array<Record<string, unknown>> | null;
}

export interface ProcurementQuoteItem {
  id: string;
  quote_id: string;
  request_item_id: string;
  quoted_quantity: string | number;
  unit_price: string | number;
  line_total: string | number;
}

export interface ProcurementQuote {
  id: string;
  request_id: string;
  vendor_id: string;
  status: 'SUBMITTED' | 'UPDATED' | 'SELECTED' | 'NOT_SELECTED' | 'WITHDRAWN' | 'EXPIRED';
  grand_total: string | number;
  promised_delivery_at: string | null;
  note: string | null;
  validity_until: string | null;
  submitted_at: string;
  updated_at: string;
  vendor_name: string;
  vendor_phone?: string;
  vendor_email?: string;
  completed_review_count?: number;
  vendor_rating?: string | number | null;
  vendor_issue_count?: number;
  quote_items?: ProcurementQuoteItem[];
}

export interface SupplyOrderItem {
  id: string;
  supply_order_id: string;
  request_item_id: string | null;
  category_id: string | null;
  item_name: string;
  agreed_quantity: string | number;
  unit: QuantityUnit;
  agreed_unit_price: string | number;
  agreed_line_total: string | number;
}

export interface SupplyEvent {
  id: string;
  supply_order_id: string;
  from_status: string | null;
  to_status: string;
  actor_id: string | null;
  actor_role: string | null;
  note: string | null;
  created_at: string;
}

export interface ProcurementEvidence {
  id: string;
  supply_order_id: string;
  vendor_id: string;
  evidence_type: 'QUALITY_VIDEO' | 'QUALITY_IMAGE' | 'PACKING_IMAGE' | 'DISPATCH_PROOF' | 'OTHER';
  media_public_id: string;
  media_url: string;
  mime_type: string | null;
  duration_seconds: number | null;
  size_bytes: string | number | null;
  uploaded_by: string | null;
  review_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  review_comment: string | null;
  created_at: string;
}

export interface SupplyOrder {
  id: string;
  supply_number: string;
  request_id: string;
  vendor_id: string;
  shop_id: string;
  quote_id: string | null;
  source_mode: ProcurementMode;
  status: SupplyStatus;
  award_amount: string | number;
  promised_delivery_at: string | null;
  dispatch_note: string | null;
  delivery_reference: string | null;
  vehicle_note: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  closed_at: string | null;
  created_at: string;
  request_number?: string;
  request_title?: string;
  quality_instructions?: string | null;
  vendor_name?: string;
  vendor_phone?: string;
  vendor_email?: string;
  shop_name?: string;
  shop_city?: string;
  shop_pincode?: string;
  item_summary?: Array<Record<string, unknown>> | null;
  has_evidence?: boolean;
}

export interface SupplyOrderDetail extends SupplyOrder {
  items: SupplyOrderItem[];
  events: SupplyEvent[];
  evidence: ProcurementEvidence[];
}

export interface EligibilitySnapshot {
  shop_pincode?: string | null;
  shop_serviceable_pincodes?: string[];
  matched_categories?: string[];
  matched_pincodes?: string[];
  categories_unavailable?: boolean;
  service_pincodes_unavailable?: boolean;
  checks?: Record<string, boolean>;
}

export interface EligibleVendorPreviewResponse {
  eligible_count: number;
  eligible: Array<{ vendor_id: string; eligibility: EligibilitySnapshot }>;
  rejected: Array<{ vendor_id: string; reasons: string[] }>;
}

// ── Inputs ──────────────────────────────────────────────────────────────────

export interface RequestItemInput {
  category_id: string;
  product_id?: string;
  item_name: string;
  requested_quantity: number;
  unit: QuantityUnit;
  spec_note?: string;
  fixed_unit_price?: number;
}

export interface CreateRequestInput {
  shop_id: string;
  mode: ProcurementMode;
  title: string;
  required_delivery_at?: string;
  response_deadline?: string;
  notes?: string;
  quality_instructions?: string;
  substitutes_allowed?: boolean;
  items: RequestItemInput[];
}

export interface UpdateRequestInput extends Partial<Omit<CreateRequestInput, 'shop_id' | 'items'>> {
  items?: RequestItemInput[];
}

export interface SubmitQuoteInput {
  items: Array<{ request_item_id: string; quoted_quantity: number; unit_price: number }>;
  promised_delivery_at?: string;
  note?: string;
  validity_until?: string;
}

export interface ServiceProfileInput {
  category_ids?: string[];
  service_pincodes?: string[];
  shop_ids?: string[];
}
