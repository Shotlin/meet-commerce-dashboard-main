import { Order, QCReceipt, InventoryLot, Vendor, FinanceSummary, AnalyticsKPI, ExceptionItem, AuditLog } from '../types';

export const mockOrders: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'MC-2026-8841',
    customerName: 'Aarav Patel',
    customerPhone: '+91 98200 12345',
    totalAmount: 1850.00,
    status: 'In QC',
    paymentStatus: 'Paid',
    deliveryAddress: '42 Lotus Towers, Bandra West, Mumbai',
    riderName: 'Vikram Singh',
    createdAt: '2026-08-07 18:24:10',
    warehouseLocation: 'South Mumbai FC',
    cuttingEvidenceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoModerationStatus: 'Approved',
    weightVarianceKg: 0.045,
    lotTraceIds: ['LOT-MEAT-4921', 'LOT-MEAT-8812'],
    items: [
      {
        id: 'item-1',
        productName: 'Premium Goat Curry Cut (Fresh)',
        category: 'Mutton',
        cutType: 'Curry Cut Small',
        declaredWeightKg: 1.00,
        actualWeightKg: 1.045,
        unitPrice: 1200.00,
        totalPrice: 1254.00,
        lotId: 'LOT-MEAT-4921'
      },
      {
        id: 'item-2',
        productName: 'Fresh Sea Bass Fillet',
        category: 'Fish & Seafood',
        cutType: 'Skinless Fillet',
        declaredWeightKg: 0.50,
        actualWeightKg: 0.50,
        unitPrice: 1192.00,
        totalPrice: 596.00,
        lotId: 'LOT-MEAT-8812'
      }
    ]
  },
  {
    id: 'ord-1002',
    orderNumber: 'MC-2026-8842',
    customerName: 'Priya Sharma',
    customerPhone: '+91 99100 67890',
    totalAmount: 940.00,
    status: 'Cutting Completed',
    paymentStatus: 'Paid',
    deliveryAddress: 'B-104 Green Glen Layout, Bellandur, Bengaluru',
    riderName: 'Ramesh Kumar',
    createdAt: '2026-08-07 19:10:00',
    warehouseLocation: 'Bengaluru Central FC',
    cuttingEvidenceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoModerationStatus: 'Pending Review',
    weightVarianceKg: -0.020,
    lotTraceIds: ['LOT-MEAT-3310'],
    items: [
      {
        id: 'item-3',
        productName: 'Antibiotic-Free Whole Chicken',
        category: 'Poultry',
        cutType: 'With Skin Medium Cut',
        declaredWeightKg: 1.20,
        actualWeightKg: 1.18,
        unitPrice: 400.00,
        totalPrice: 472.00,
        lotId: 'LOT-MEAT-3310'
      }
    ]
  },
  {
    id: 'ord-1003',
    orderNumber: 'MC-2026-8843',
    customerName: 'Rajesh Nair',
    customerPhone: '+91 98450 54321',
    totalAmount: 3450.00,
    status: 'Pending',
    paymentStatus: 'Pending',
    deliveryAddress: 'Sector 15, Vashi, Navi Mumbai',
    createdAt: '2026-08-07 20:05:40',
    warehouseLocation: 'South Mumbai FC',
    lotTraceIds: ['LOT-MEAT-9901'],
    items: [
      {
        id: 'item-4',
        productName: 'Organic Lamb Chops',
        category: 'Mutton',
        cutType: 'Rib Chops',
        declaredWeightKg: 2.00,
        unitPrice: 1725.00,
        totalPrice: 3450.00,
        lotId: 'LOT-MEAT-9901'
      }
    ]
  },
  {
    id: 'ord-1004',
    orderNumber: 'MC-2026-8844',
    customerName: 'Ananya Gupta',
    customerPhone: '+91 98111 22334',
    totalAmount: 1420.00,
    status: 'Delivered',
    paymentStatus: 'Paid',
    deliveryAddress: '78 Civil Lines, North Delhi',
    riderName: 'Sunil Verma',
    createdAt: '2026-08-07 14:15:22',
    warehouseLocation: 'North Delhi Regional Hub',
    cuttingEvidenceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    videoModerationStatus: 'Approved',
    weightVarianceKg: 0.000,
    lotTraceIds: ['LOT-MEAT-1102'],
    items: [
      {
        id: 'item-5',
        productName: 'Fresh Tiger Prawns (Cleaned)',
        category: 'Fish & Seafood',
        cutType: 'Deveined Large',
        declaredWeightKg: 0.80,
        actualWeightKg: 0.80,
        unitPrice: 1775.00,
        totalPrice: 1420.00,
        lotId: 'LOT-MEAT-1102'
      }
    ]
  }
];

export const mockQCReceipts: QCReceipt[] = [
  {
    id: 'qc-501',
    receiptNumber: 'QCR-2026-0912',
    appointmentId: 'APT-8821',
    vendorName: 'MeatCraft Farms Ltd.',
    categoryName: 'Mutton / Lamb',
    declaredQtyKg: 450.00,
    measuredQtyKg: 448.20,
    varianceQtyKg: -1.80,
    temperatureCelsius: 2.4,
    temperatureStatus: 'Normal',
    qcStatus: 'Accepted',
    inspectorName: 'Sanjay Kumar (Senior QC)',
    receivedAt: '2026-08-07 08:30:00',
    notes: 'Cold chain intact. Ph level 5.8, fresh texture, stamp verified.',
    lotIdCreated: 'LOT-MEAT-4921',
    evidencePhotoUrls: ['/assets/banner-01-premium-lamb.png']
  },
  {
    id: 'qc-502',
    receiptNumber: 'QCR-2026-0913',
    appointmentId: 'APT-8822',
    vendorName: 'Coastal Harvest Seafoods',
    categoryName: 'Fish & Prawns',
    declaredQtyKg: 200.00,
    measuredQtyKg: 194.50,
    varianceQtyKg: -5.50,
    temperatureCelsius: 6.8,
    temperatureStatus: 'Warning',
    qcStatus: 'Quarantined',
    inspectorName: 'Meera Rao (QC Spec)',
    receivedAt: '2026-08-07 09:15:00',
    notes: 'Temperature slightly elevated above 4°C limit. Secondary lab swab ordered.',
    evidencePhotoUrls: ['/assets/banner-02-seafood.png']
  },
  {
    id: 'qc-503',
    receiptNumber: 'QCR-2026-0914',
    appointmentId: 'APT-8825',
    vendorName: 'Apex Poultry Processing',
    categoryName: 'Poultry',
    declaredQtyKg: 600.00,
    measuredQtyKg: 600.00,
    varianceQtyKg: 0.00,
    temperatureCelsius: 1.8,
    temperatureStatus: 'Normal',
    qcStatus: 'Accepted',
    inspectorName: 'Sanjay Kumar (Senior QC)',
    receivedAt: '2026-08-07 10:45:00',
    notes: 'Batch passed all microbiological fast-tests.',
    lotIdCreated: 'LOT-MEAT-3310',
    evidencePhotoUrls: ['/assets/banner-03-ready-to-cook.png']
  }
];

export const mockInventoryLots: InventoryLot[] = [
  {
    id: 'lot-1',
    lotNumber: 'LOT-MEAT-4921',
    sku: 'SKU-MUT-G01',
    productName: 'Premium Goat Whole Carcass',
    vendorName: 'MeatCraft Farms Ltd.',
    batchNumber: 'BATCH-2026-88',
    receivedDate: '2026-08-07',
    expiryDate: '2026-08-11',
    availableWeightKg: 312.50,
    reservedWeightKg: 45.00,
    pickedWeightKg: 90.70,
    storageTempCelsius: 2.1,
    warehouseLocation: 'South Mumbai FC (Cold Bay 3)',
    status: 'Active',
    lineage: {
      vendorId: 'VEN-101',
      supplyBatchId: 'SB-8821',
      qcReceiptId: 'QCR-2026-0912',
      farmOrigin: 'Satara Organic Farms, Maharashtra'
    }
  },
  {
    id: 'lot-2',
    lotNumber: 'LOT-MEAT-8812',
    sku: 'SKU-FSH-SB2',
    productName: 'Fresh Sea Bass (Whole)',
    vendorName: 'Coastal Harvest Seafoods',
    batchNumber: 'BATCH-2026-41',
    receivedDate: '2026-08-06',
    expiryDate: '2026-08-09',
    availableWeightKg: 18.50,
    reservedWeightKg: 8.00,
    pickedWeightKg: 85.00,
    storageTempCelsius: 1.5,
    warehouseLocation: 'South Mumbai FC (Seafood Deep Chiller)',
    status: 'Low Stock',
    lineage: {
      vendorId: 'VEN-102',
      supplyBatchId: 'SB-4109',
      qcReceiptId: 'QCR-2026-0899',
      farmOrigin: 'Ratnagiri Deep Sea Catch'
    }
  },
  {
    id: 'lot-3',
    lotNumber: 'LOT-MEAT-3310',
    sku: 'SKU-CHk-W01',
    productName: 'Fresh Whole Farm Chicken',
    vendorName: 'Apex Poultry Processing',
    batchNumber: 'BATCH-2026-99',
    receivedDate: '2026-08-07',
    expiryDate: '2026-08-10',
    availableWeightKg: 520.00,
    reservedWeightKg: 65.00,
    pickedWeightKg: 15.00,
    storageTempCelsius: 1.8,
    warehouseLocation: 'Bengaluru Central FC (Chiller A2)',
    status: 'Active',
    lineage: {
      vendorId: 'VEN-103',
      supplyBatchId: 'SB-9912',
      qcReceiptId: 'QCR-2026-0914',
      farmOrigin: 'Hosur Bio-Secure Poultry Farm'
    }
  }
];

export const mockVendors: Vendor[] = [
  {
    id: 'VEN-101',
    companyName: 'MeatCraft Farms Ltd.',
    contactPerson: 'Harshvardhan Joshi',
    email: 'h.joshi@meatcraftfarms.com',
    phone: '+91 98900 11223',
    category: 'Mutton & Lamb',
    kycStatus: 'Verified',
    riskScore: 'Low',
    activeBatches: 6,
    totalFulfilledValue: 4520000.00,
    rating: 4.9,
    joinedDate: '2024-03-15',
    licenseNumber: 'FSSAI-11521034000192'
  },
  {
    id: 'VEN-102',
    companyName: 'Coastal Harvest Seafoods',
    contactPerson: 'Karan Merchant',
    email: 'karan@coastalharvest.in',
    phone: '+91 97690 88776',
    category: 'Fish & Seafood',
    kycStatus: 'Under Review',
    riskScore: 'Medium',
    activeBatches: 2,
    totalFulfilledValue: 1890000.00,
    rating: 4.4,
    joinedDate: '2024-11-01',
    licenseNumber: 'FSSAI-11522089000451'
  },
  {
    id: 'VEN-103',
    companyName: 'Apex Poultry Processing',
    contactPerson: 'Anish Nambiar',
    email: 'anish@apexpoultry.com',
    phone: '+91 98800 44332',
    category: 'Poultry',
    kycStatus: 'Verified',
    riskScore: 'Low',
    activeBatches: 9,
    totalFulfilledValue: 8400000.00,
    rating: 4.8,
    joinedDate: '2023-08-20',
    licenseNumber: 'FSSAI-10019043000887'
  }
];

export const mockFinanceSummary: FinanceSummary = {
  gmv: 14850900.00,
  netRevenue: 2227635.00,
  platformFees: 1188072.00,
  refundsTotal: 42150.00,
  payoutHealth: 'Optimal',
  pendingSettlements: 3,
  recentSettlements: [
    {
      id: 'SET-9901',
      vendorName: 'MeatCraft Farms Ltd.',
      amount: 458000.00,
      period: '01 Aug 2026 - 07 Aug 2026',
      status: 'Settled',
      processedAt: '2026-08-07 14:00:00'
    },
    {
      id: 'SET-9902',
      vendorName: 'Apex Poultry Processing',
      amount: 812000.00,
      period: '01 Aug 2026 - 07 Aug 2026',
      status: 'Processing',
      processedAt: '2026-08-07 16:30:00'
    },
    {
      id: 'SET-9903',
      vendorName: 'Coastal Harvest Seafoods',
      amount: 145000.00,
      period: '01 Aug 2026 - 07 Aug 2026',
      status: 'On Hold',
      processedAt: '2026-08-07 17:15:00'
    }
  ]
};

export const mockAnalyticsKPIs: AnalyticsKPI[] = [
  { title: 'Gross Merchandise Value (GMV)', value: '₹1,48,50,900', change: '+14.2%', isPositive: true, timeframe: 'vs last week' },
  { title: 'Order SLA Pass Rate', value: '98.6%', change: '+0.8%', isPositive: true, timeframe: 'vs 98.0% target' },
  { title: 'Inbound QC Acceptance', value: '94.2%', change: '-1.1%', isPositive: false, timeframe: '3 batches held' },
  { title: 'Avg Cold Chain Storage Temp', value: '2.1 °C', change: 'Optimal', isPositive: true, timeframe: 'Target: 0-4°C' }
];

export const mockExceptions: ExceptionItem[] = [
  {
    id: 'exc-1',
    title: 'Elevated Receiving Temperature (6.8°C)',
    type: 'Temperature Risk',
    severity: 'Critical',
    location: 'South Mumbai FC - Bay 2',
    timestamp: '2026-08-07 09:15:00',
    actionRequired: 'Lot placed in auto-quarantine. Lab swab required before release.'
  },
  {
    id: 'exc-2',
    title: 'Cutting Evidence Video Pending Verification',
    type: 'QC Rejection',
    severity: 'Warning',
    location: 'Bengaluru Central FC',
    timestamp: '2026-08-07 19:10:00',
    actionRequired: 'Order MC-2026-8842 video timestamp mismatch. Requires supervisor review.'
  },
  {
    id: 'exc-3',
    title: 'Gateway Provider Settlement Timeout',
    type: 'Payment Exception',
    severity: 'Warning',
    location: 'Razorpay / HDFC Provider',
    timestamp: '2026-08-07 17:15:00',
    actionRequired: 'Settlement SET-9903 requires manual event reconciliation.'
  },
  {
    id: 'exc-4',
    title: 'Traceability Chain Audit Check',
    type: 'Recall Warning',
    severity: 'Info',
    location: 'HQ Governance Explorer',
    timestamp: '2026-08-07 18:00:00',
    actionRequired: 'Batch BATCH-2026-88 export report generated successfully.'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-101',
    actor: 'Sanjay Kumar',
    role: 'Warehouse Manager',
    action: 'QC_RECEIPT_ACCEPTED',
    entity: 'QCReceipt',
    entityId: 'QCR-2026-0912',
    timestamp: '2026-08-07 08:30:12',
    ipAddress: '10.0.4.18',
    changes: [
      { field: 'qcStatus', oldValue: 'Pending QC', newValue: 'Accepted' },
      { field: 'lotCreated', oldValue: 'null', newValue: 'LOT-MEAT-4921' }
    ]
  },
  {
    id: 'aud-102',
    actor: 'Aditya Sharma',
    role: 'HQ Admin',
    action: 'VIDEO_EVIDENCE_MODERATED',
    entity: 'Order',
    entityId: 'MC-2026-8841',
    timestamp: '2026-08-07 18:30:00',
    ipAddress: '10.0.1.5',
    changes: [
      { field: 'videoModerationStatus', oldValue: 'Pending Review', newValue: 'Approved' }
    ]
  }
];
