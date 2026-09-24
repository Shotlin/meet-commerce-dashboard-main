import { describe, expect, it } from 'vitest';
import { mapListRow, mapItem, mapPayment, mapOrderDetail } from './adminOrdersService';

/**
 * Regression coverage for the new Orders module's snake_case → camelCase
 * mapping — `apiClient` does no case conversion at all (confirmed root
 * cause of the old "HQ Central FC" bug: `b.shopName` never matched the
 * backend's real `shop_name`), and the whole rebuild's central rule is
 * "real value, or an honest empty state — never fabricated operational
 * data." These tests lock both properties in.
 */
describe('mapListRow', () => {
  it('reads real snake_case fields from the actual admin/orders API shape', () => {
    const raw = {
      id: 'order-1',
      order_number: 'FC-KOL-20260923-0001',
      status: 'CONFIRMED',
      customer_id: 'cust-1',
      customer_name: 'Aarav Patel',
      customer_phone: '9000000001',
      shop_id: 'shop-1',
      shop_name: 'FreshCuts — Kolkata',
      total_payable: '210.00',
      payment_method: 'ONLINE',
      payment_status: 'PAID',
      payment_needs_manual_review: true,
      payment_recovered_from_failed: false,
      order_type: 'EXPRESS',
      delivery_mode: 'ASAP',
      rider_id: 'rider-1',
      rider_name: 'Rohit Kumar',
      created_at: '2026-09-23T11:15:46.362Z',
    };

    const row = mapListRow(raw);

    expect(row.shopName).toBe('FreshCuts — Kolkata');
    expect(row.customerName).toBe('Aarav Patel');
    expect(row.totalAmount).toBe(210);
    expect(row.paymentNeedsReview).toBe(true);
    expect(row.orderType).toBe('EXPRESS');
    expect(row.riderName).toBe('Rohit Kumar');
  });

  it('never fabricates a fake shop/customer/rider name when the backend sends none — "—" is rendered by the UI, not invented here', () => {
    const row = mapListRow({ id: 'order-2', created_at: '2026-09-23T00:00:00Z' });

    expect(row.shopName).toBeNull();
    expect(row.customerName).toBeNull();
    expect(row.riderName).toBeNull();
    expect(row.totalAmount).toBe(0);
  });

  it('defaults orderType to STANDARD only for a real ASAP/non-scheduled order, never guesses EXPRESS/SCHEDULED', () => {
    expect(mapListRow({ id: 'o', created_at: '' }).orderType).toBe('STANDARD');
    expect(mapListRow({ id: 'o', created_at: '', order_type: 'SCHEDULED' }).orderType).toBe('SCHEDULED');
  });
});

describe('mapItem', () => {
  it('reads the real order_items join shape (product_name, unit_price, thumbnail_url, net_quantity)', () => {
    const item = mapItem(
      { product_id: 'p1', product_name: 'Chicken Breast Boneless (500 g)', quantity: 2, unit_price: 180, subtotal: 360, thumbnail_url: 'https://x/y.jpg', net_quantity: '500 g' },
      0
    );
    expect(item.productName).toBe('Chicken Breast Boneless (500 g)');
    expect(item.lineTotal).toBe(360);
    expect(item.netQuantity).toBe('500 g');
    expect(item.thumbnailUrl).toBe('https://x/y.jpg');
  });

  it('never invents a product name/price/category — a genuinely missing field stays null/generic, never a fake "Fresh Meat Cut"/₹500 placeholder', () => {
    const item = mapItem({}, 3);
    expect(item.productName).toBe('Item');
    expect(item.unitPrice).toBe(0);
    expect(item.thumbnailUrl).toBeNull();
  });
});

describe('mapPayment', () => {
  it('surfaces needsManualReview/recoveredFromFailed from the real payments row (the reconciliation-hardening fields)', () => {
    const payment = mapPayment({
      id: 'pay-1', razorpay_order_id: 'rzp_o', razorpay_payment_id: 'rzp_p', amount: 210,
      status: 'PAID', needs_manual_review: true, recovered_from_failed: true, review_reason: 'captured_after_order_moved_on',
    });
    expect(payment?.needsManualReview).toBe(true);
    expect(payment?.recoveredFromFailed).toBe(true);
    expect(payment?.reviewReason).toBe('captured_after_order_moved_on');
  });

  it('returns null (not a fake empty payment object) when there is no payment at all — e.g. a COD order', () => {
    expect(mapPayment(null)).toBeNull();
    expect(mapPayment(undefined)).toBeNull();
  });
});

describe('mapOrderDetail', () => {
  it('maps the full fee breakdown from real column names and defaults absent fees to 0, never a placeholder amount', () => {
    const detail = mapOrderDetail({
      id: 'order-1', created_at: '2026-09-23T00:00:00Z', subtotal: 180, delivery_fee: 25, platform_fee: 5, items: [], timeline: [],
    });
    expect(detail.subtotal).toBe(180);
    expect(detail.deliveryFee).toBe(25);
    expect(detail.platformFee).toBe(5);
    expect(detail.handlingFee).toBe(0);
    expect(detail.tipAmount).toBe(0);
  });

  it('evidence is always null — Meet Commerce has no backend data model for cutting evidence, so this must never be fabricated', () => {
    const detail = mapOrderDetail({ id: 'order-1', created_at: '', items: [], timeline: [] });
    expect(detail.evidence).toBeNull();
  });

  it('maps items and timeline arrays through their own mappers', () => {
    const detail = mapOrderDetail({
      id: 'order-1',
      created_at: '',
      items: [{ product_name: 'Mutton Curry Cut', quantity: 1, unit_price: 500, subtotal: 500 }],
      timeline: [{ id: 't1', to_status: 'CONFIRMED', changed_at: '2026-09-23T00:00:00Z', changed_by_name: 'Admin' }],
    });
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0].productName).toBe('Mutton Curry Cut');
    expect(detail.timeline).toHaveLength(1);
    expect(detail.timeline[0].changedByName).toBe('Admin');
  });

  it('maps the settlement block (manual COD/UPI payment collection) through its own mapper', () => {
    const detail = mapOrderDetail({
      id: 'order-1',
      created_at: '',
      items: [],
      timeline: [],
      settlement: {
        totalPayable: 380,
        walletAmount: 0,
        outstanding: 380,
        received: 200,
        amountDue: 180,
        paymentStatus: 'PARTIALLY_PAID',
        settledBy: null,
        settledAt: null,
        history: [
          {
            id: 'entry-1',
            entryType: 'SETTLEMENT',
            amount: 200,
            method: 'CASH',
            cashAmount: 200,
            upiAmount: 0,
            reference: null,
            methodNote: null,
            internalNote: null,
            reversesEntryId: null,
            recordedBy: 'admin-1',
            recordedByName: 'Sayan Mondal',
            createdAt: '2026-09-24T10:00:00Z',
          },
        ],
      },
    });

    expect(detail.settlement.amountDue).toBe(180);
    expect(detail.settlement.paymentStatus).toBe('PARTIALLY_PAID');
    expect(detail.settlement.history).toHaveLength(1);
    expect(detail.settlement.history[0].recordedByName).toBe('Sayan Mondal');
    expect(detail.settlement.history[0].method).toBe('CASH');
  });

  it('never fabricates a settlement block when the backend sends none — a real, zeroed "nothing due" shape, not undefined', () => {
    const detail = mapOrderDetail({ id: 'order-1', created_at: '', items: [], timeline: [] });
    expect(detail.settlement.amountDue).toBe(0);
    expect(detail.settlement.history).toEqual([]);
  });
});
