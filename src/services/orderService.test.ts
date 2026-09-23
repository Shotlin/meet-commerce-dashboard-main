import { describe, expect, it } from 'vitest';
import { adaptOrder } from './orderService';

/**
 * Regression coverage: `adaptOrder` (used by HQCommandCenter's live-feed
 * widget and exportReport.ts's CSV) previously invented a whole catalog of
 * fake values whenever the backend response was missing a field — a
 * hardcoded order number 'MC-2026-0000', a fake phone number, a fake
 * address, a hardcoded stock-image "cutting evidence" URL, a fake weight
 * variance (0.045), a fake lot id ('LOT-MEAT-4921'), fake product
 * name/category/cut-type/price for every item. This locks in that none of
 * those fabrications can silently come back.
 */
describe('orderService.adaptOrder', () => {
  it('maps a real, fully-populated backend order with no invention', () => {
    const order = adaptOrder({
      id: 'order-1',
      order_number: 'FC-KOL-20260923-0001',
      customer_name: 'Aarav Patel',
      customer_phone: '9000000001',
      total_payable: 210,
      status: 'DELIVERED',
      payment_status: 'PAID',
      shop_name: 'FreshCuts — Kolkata',
      created_at: '2026-09-23T11:15:46.362Z',
    });

    expect(order.orderNumber).toBe('FC-KOL-20260923-0001');
    expect(order.customerName).toBe('Aarav Patel');
    expect(order.warehouseLocation).toBe('FreshCuts — Kolkata');
    expect(order.status).toBe('Delivered');
    expect(order.paymentStatus).toBe('Paid');
  });

  it('never fabricates an order number, phone, or address when the backend sends none', () => {
    const order = adaptOrder({ id: 'order-2' });

    expect(order.orderNumber).not.toBe('MC-2026-0000');
    expect(order.customerPhone).not.toMatch(/^\+91 98000/);
    expect(order.customerPhone).toBe('');
    expect(order.deliveryAddress).toBe('');
  });

  it('never fabricates cutting-evidence: no fake banner image, no fake weight variance, no fake lot id', () => {
    const order = adaptOrder({ id: 'order-3' });

    expect(order.cuttingEvidenceUrl).toBeUndefined();
    expect(order.weightVarianceKg).toBeUndefined();
    expect(order.lotTraceIds).toEqual([]);
  });

  it('never fabricates per-item product name, category, cut type, price, or lot id', () => {
    const order = adaptOrder({ id: 'order-4', items: [{}] });
    const item = order.items[0];

    expect(item.productName).toBe('Item'); // an honest generic label, not "Fresh Meat Cut"
    expect(item.category).toBe('');
    expect(item.cutType).toBe('');
    expect(item.unitPrice).toBe(0); // not the fake 500
    expect(item.totalPrice).toBe(0); // not the fake 500
    expect(item.lotId).toBe(''); // not 'LOT-MEAT-4921'
    expect(item.declaredWeightKg).toBeUndefined();
  });

  it('renders an unrecognized real backend status as Unknown rather than silently defaulting to Pending', () => {
    const order = adaptOrder({ id: 'order-5', status: 'SOME_FUTURE_STATUS' });
    expect(order.status).toBe('Unknown');
  });

  it('still defaults to Pending only when the status field is genuinely absent', () => {
    const order = adaptOrder({ id: 'order-6' });
    expect(order.status).toBe('Pending');
  });

  it('fixes the real "HQ Central FC" bug: reads snake_case shop_name when camelCase shopName is absent', () => {
    const order = adaptOrder({ id: 'order-7', shop_name: 'FreshCuts — Kolkata' });
    expect(order.warehouseLocation).toBe('FreshCuts — Kolkata');
  });
});
