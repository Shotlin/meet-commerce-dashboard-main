// Shapes returned by GET /api/v1/admin/overview. The backend returns
// snake_case and `null` for anything it could not measure (never a
// fabricated number) — the UI shows an honest "not tracked" state for those.

export type OverviewRangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface OverviewQuery {
  range: OverviewRangeKey;
  from?: string;
  to?: string;
  shopId?: string | null;
  pincode?: string | null;
}

export interface Metric {
  value: number | null;
  previous: number | null;
  change_pct: number | null;
}

export interface OverviewKpis {
  gross_revenue: Metric;
  net_revenue: Metric;
  gross_profit: Metric;
  net_profit: Metric;
  aov: Metric;
  orders: Metric;
  discounts: Metric;
  refunds: Metric;
  taxes: Metric;
  delivery_revenue: Metric;
  operating_cost: Metric;
  net_margin: { value: number | null; previous: number | null };
  cost_coverage: number | null;
}

export interface CostItem extends Metric {
  key: string;
  label: string;
  note?: string;
}

export interface OverviewCostBreakdown {
  items: CostItem[];
  untracked: { key: string; label: string }[];
  vendor_purchases: number;
  total_tracked: number;
}

export interface OrderHealthCounts {
  placed: number;
  preparing: number;
  packed: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  return_requested: number;
  total: number;
}

export interface OverviewOrderHealth {
  current: OrderHealthCounts;
  previous: OrderHealthCounts | null;
  changes: Record<keyof OrderHealthCounts, number | null>;
  daily: { day: string; total: number; delivered: number; cancelled: number; refunded: number }[];
}

export interface OverviewProductRow {
  product_id: string;
  name: string;
  units: number;
  revenue: number;
  margin: number | null;
  profit: number | null;
  growth: number | null;
  refunded_units: number;
  refund_rate: number | null;
  refunded_value: number;
  repeat_buyers: number;
}

export interface OverviewSlowMover {
  product_id: string;
  name: string;
  stock: number;
  units_sold: number;
  stock_value: number | null;
}

export interface OverviewProducts {
  top_selling: OverviewProductRow[];
  top_revenue: OverviewProductRow[];
  top_profit: OverviewProductRow[];
  trending: OverviewProductRow[];
  high_returns: OverviewProductRow[];
  slow_moving: OverviewSlowMover[];
}

export interface OverviewArea {
  pincode: string;
  orders: number;
  customers: number;
  net_revenue: number;
  collected: number;
  aov: number;
  delivery_revenue: number;
  delivery_cost: number;
  delivery_cost_per_order: number;
  revenue_change_pct: number | null;
  top_products: { product_id: string; name: string; units: number }[];
}

export interface OverviewCustomers {
  active: number;
  new: number;
  repeat: number;
  repeat_purchase_rate: number | null;
  avg_frequency: number | null;
  avg_lifetime_value: number | null;
  ltv_note: string | null;
  top: { customer_id: string; name: string | null; phone: string | null; orders: number; spend: number; lifetime_orders: number }[];
  lapsed: {
    total: number;
    monthly_value: number;
    top: { customer_id: string; name: string | null; phone: string | null; orders: number; last_order_at: string; monthly_value: number }[];
  };
}

export interface OverviewVendor {
  vendor_id: string;
  name: string;
  supply_orders: number;
  purchases: number;
  rejected_value: number;
  rejection_rate: number | null;
  revenue_generated: number;
  margin_generated: number | null;
  margin_pct: number | null;
  best_sku: { name: string; profit: number; margin: number } | null;
  worst_sku: { name: string; profit: number; margin: number } | null;
}

export interface OverviewDelivery {
  delivered: Metric;
  avg_cost_per_order: number | null;
  rider_cost: number;
  shiprocket_cost: number;
  avg_minutes: number | null;
  avg_minutes_previous: number | null;
  on_time_rate: number | null;
  on_time_sample: number;
  failed: Metric;
}

export type InsightKind = 'leakage' | 'opportunity' | 'data';
export type InsightSeverity = 'high' | 'medium' | 'low' | 'info';

export interface OverviewInsight {
  id: string;
  kind: InsightKind;
  category: 'product' | 'area' | 'vendor' | 'discount' | 'customer' | 'inventory' | 'data';
  severity: InsightSeverity;
  title: string;
  detail: string;
  impact_inr: number | null;
  entity: { type: string; id: string; name: string } | null;
  link: string | null;
}

export interface OverviewInsights {
  items: OverviewInsight[];
  investigate_today: OverviewInsight[];
  totals: { leakage_inr: number; opportunity_inr: number; leakage_count: number; opportunity_count: number };
}

export interface OverviewData {
  range: {
    key: string;
    label: string;
    days: number;
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
    bucket: 'hour' | 'day';
  };
  filters: { shop_id: string | null; pincode: string | null; shop_locked: boolean; store_wide_hidden: boolean };
  options: { shops: { id: string; name: string }[]; pincodes: string[] };
  kpis: OverviewKpis | null;
  series: { bucket: string; orders: number; net_revenue: number; net_profit: number }[];
  cost_breakdown: OverviewCostBreakdown | null;
  order_health: OverviewOrderHealth | null;
  products: OverviewProducts;
  areas: OverviewArea[];
  customers: OverviewCustomers;
  vendors: OverviewVendor[];
  delivery: OverviewDelivery | null;
  insights: OverviewInsights;
  section_errors: Record<string, string>;
  generated_at: string;
}
