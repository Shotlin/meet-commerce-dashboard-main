export type UserRole = 
  | 'HQ Admin' 
  | 'Warehouse Manager' 
  | 'Vendor' 
  | 'Fulfilment Agent' 
  | 'Finance Lead' 
  | 'Governance Auditor';

export type ScopeLocation = 
  | 'All Hubs (HQ Global)' 
  | 'North Delhi Regional Hub' 
  | 'South Mumbai FC' 
  | 'Bengaluru Central FC' 
  | 'Vendor: MeatCraft Farms';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'In QC'
  | 'Cutting Completed'
  | 'Packed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  // A real backend status this dashboard doesn't recognize — rendered as
  // an "Unknown" badge instead of silently defaulting to 'Pending' or
  // crashing. Meet Commerce's real order-status vocabulary is only
  // PENDING/ORDER_PLACED/CONFIRMED/PREPARING/PACKED/OUT_FOR_DELIVERY/
  // DELIVERED/CANCELLED/REFUNDED — 'In QC'/'Cutting Completed'/'Returned'
  // above don't actually exist as real order statuses anywhere in this
  // codebase (no backend value ever produces them); they're kept only so
  // any old data/tests referencing them still type-check.
  | 'Unknown';

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

export type QCStatus = 'Accepted' | 'Quarantined' | 'Rejected' | 'Pending QC';

export type VideoModerationStatus = 'Approved' | 'Pending Review' | 'Rejected';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  cutType?: string;
  storageTemp?: string;
  shelfLifeDays?: number;
  inStock: boolean;
}

export interface OrderItem {
  id: string;
  productName: string;
  category: string;
  cutType: string;
  // Optional: Meet Commerce has no backend data model for declared/actual
  // per-item weight at all (see orderService.ts's adaptOrder) — these are
  // only ever populated for a system that actually records them.
  declaredWeightKg?: number;
  actualWeightKg?: number;
  unitPrice: number;
  totalPrice: number;
  lotId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  riderId?: string;
  riderName?: string;
  createdAt: string;
  warehouseLocation: string;
  cuttingEvidenceUrl?: string;
  videoModerationStatus?: VideoModerationStatus;
  weightVarianceKg?: number;
  lotTraceIds: string[];
}

export interface QCReceipt {
  id: string;
  receiptNumber: string;
  appointmentId: string;
  vendorName: string;
  categoryName: string;
  declaredQtyKg: number;
  measuredQtyKg: number;
  varianceQtyKg: number;
  temperatureCelsius: number;
  temperatureStatus: 'Normal' | 'Warning' | 'Critical';
  qcStatus: QCStatus;
  inspectorName: string;
  receivedAt: string;
  notes?: string;
  lotIdCreated?: string;
  evidencePhotoUrls: string[];
}

export interface InventoryLot {
  id: string;
  lotNumber: string;
  sku: string;
  productName: string;
  vendorName: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string;
  availableWeightKg: number;
  reservedWeightKg: number;
  pickedWeightKg: number;
  storageTempCelsius: number;
  warehouseLocation: string;
  status: 'Active' | 'Low Stock' | 'Quarantined' | 'Expired';
  lineage: {
    vendorId: string;
    supplyBatchId: string;
    qcReceiptId: string;
    farmOrigin: string;
  };
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  kycStatus: 'Verified' | 'Under Review' | 'Pending Docs' | 'Rejected';
  riskScore: 'Low' | 'Medium' | 'High';
  activeBatches: number;
  totalFulfilledValue: number;
  rating: number;
  joinedDate: string;
  licenseNumber: string;
}

export interface FinanceSummary {
  gmv: number;
  netRevenue: number;
  platformFees: number;
  refundsTotal: number;
  payoutHealth: 'Optimal' | 'Review Required' | 'Delayed';
  pendingSettlements: number;
  recentSettlements: {
    id: string;
    vendorName: string;
    amount: number;
    period: string;
    status: 'Settled' | 'Processing' | 'On Hold';
    processedAt: string;
  }[];
}

export interface AnalyticsKPI {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface ExceptionItem {
  id: string;
  title: string;
  type: 'Temperature Risk' | 'QC Rejection' | 'Payment Exception' | 'Delivery Delay' | 'Recall Warning';
  severity: 'Critical' | 'Warning' | 'Info';
  location: string;
  timestamp: string;
  actionRequired: string;
}

// Re-exported so ported theme-builder files (originally against bakaloo-dashboard's
// "@/types" barrel) can import ApiResponse from "@/types" unchanged — the real
// definition lives in apiClient.ts, the single source of truth for the response envelope.
export type { ApiResponse } from '../services/apiClient';
