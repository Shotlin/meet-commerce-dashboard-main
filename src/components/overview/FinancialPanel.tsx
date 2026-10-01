import React from 'react';
import {
  Area, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Banknote, Calculator, Landmark, LineChart as LineIcon, PieChart as PieIcon, PiggyBank, Receipt, ShoppingBag, ShoppingCart,
  Tag, Truck, Undo2, Wallet,
} from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { EmptyNote, KpiTile, NotTracked, SectionCard, SectionError, TONES, surface } from './parts';

const Group: React.FC<{ title: string; hint: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="mb-5">
    <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3">
      <h3 className="text-base font-bold text-[#1B2437]">{title}</h3>
      <span className="text-sm text-[#667085]">{hint}</span>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  </div>
);

export const FinancialKpis: React.FC<{ data: OverviewData }> = ({ data }) => {
  const k = data.kpis;
  if (!k) return <div className="mb-5"><SectionError show /></div>;
  const noProfit = k.net_profit.value == null;
  const lossNow = (k.net_profit.value ?? 0) < 0;
  return (
    <div>
      <Group title="Money coming in" hint="What customers bought">
        <KpiTile icon={<ShoppingBag className="h-4 w-4" />} tone="blue" label="Total sales" value={inr(k.gross_revenue.value, { compact: true })}
          help="All the items customers bought, before any discount or refund." pct={k.gross_revenue.change_pct} />
        <KpiTile icon={<Wallet className="h-4 w-4" />} tone="green" label="Sales you keep" value={inr(k.net_revenue.value, { compact: true })}
          help="Total sales minus discounts and refunds." pct={k.net_revenue.change_pct} />
        <KpiTile icon={<Receipt className="h-4 w-4" />} tone="violet" label="Orders" value={num(k.orders.value)}
          help="How many orders were placed." pct={k.orders.change_pct} />
        <KpiTile icon={<ShoppingCart className="h-4 w-4" />} tone="teal" label="Average order" value={inr(k.aov.value)}
          help="What one customer pays on average per order." pct={k.aov.change_pct} />
      </Group>

      <Group title="Profit" hint="What is left after paying for the items and delivery">
        <KpiTile icon={<PiggyBank className="h-4 w-4" />} tone="green" label="Profit on items" value={noProfit ? '—' : inr(k.gross_profit.value, { compact: true })}
          valueTone={noProfit ? undefined : (k.gross_profit.value ?? 0) < 0 ? 'red' : 'green'}
          help="Sales you keep minus what the items cost you to buy." pct={k.gross_profit.change_pct}
          placeholder={noProfit ? 'Needs cost prices' : undefined} />
        <KpiTile icon={<Banknote className="h-4 w-4" />} tone={lossNow ? 'red' : 'green'} label="Profit you take home" value={noProfit ? '—' : inr(k.net_profit.value, { compact: true })}
          valueTone={noProfit ? undefined : lossNow ? 'red' : 'green'}
          help={k.net_margin.value != null ? `Out of every ₹100 of sales you ${lossNow ? 'lose' : 'keep'} about ₹${Math.abs(k.net_margin.value * 100).toFixed(0)}.` : 'After item cost and delivery cost.'}
          pct={k.net_profit.change_pct} placeholder={noProfit ? 'Needs cost prices' : undefined} />
        <KpiTile icon={<Truck className="h-4 w-4" />} tone="teal" label="Delivery fees earned" value={inr(k.delivery_revenue.value, { compact: true })}
          help="Delivery charges that customers paid you." pct={k.delivery_revenue.change_pct} />
        <KpiTile icon={<Landmark className="h-4 w-4" />} tone="slate" label="Tax collected" value={inr(k.taxes.value, { compact: true })}
          help="Tax you collect and pass on. It is not your income." pct={k.taxes.change_pct} />
      </Group>

      <Group title="Money going out" hint="Lower is better">
        <KpiTile icon={<Tag className="h-4 w-4" />} tone="amber" label="Discounts given" value={inr(k.discounts.value, { compact: true })}
          help="Money you gave away through offers and coupons." pct={k.discounts.change_pct} inverse />
        <KpiTile icon={<Undo2 className="h-4 w-4" />} tone="red" label="Refunds" value={inr(k.refunds.value, { compact: true })}
          help="Money you returned to customers." pct={k.refunds.change_pct} inverse />
        <KpiTile icon={<Calculator className="h-4 w-4" />} tone="violet" label="All costs we can measure" value={inr(k.operating_cost.value, { compact: true })}
          help="Item cost + delivery + refunds + discounts." pct={k.operating_cost.change_pct} inverse />
      </Group>

      {k.cost_coverage != null && k.cost_coverage < 1 && (
        <div className="mb-5">
          <NotTracked tone="amber">
            Profit is counted only on orders where <b>every</b> item has a cost price — right now that is <b>{Math.round(k.cost_coverage * 100)}%</b> of orders.
            We never guess. Warehouse packing and vendor transport costs are not recorded yet, so profit is a little higher than the real figure.
          </NotTracked>
        </div>
      )}
    </div>
  );
};

function fmtBucket(b: string, hourly: boolean): string {
  const [date, time] = b.split('T');
  const [, m, d] = date.split('-');
  return hourly ? time : `${d}/${m}`;
}

const COST_COLORS: Record<string, string> = {
  product_cost: TONES.blue.solid, rider_cost: TONES.teal.solid, shiprocket_cost: TONES.violet.solid,
  refunds: TONES.red.solid, discounts: TONES.amber.solid,
};
const COST_HELP: Record<string, string> = {
  product_cost: 'What the items you sold cost to buy',
  rider_cost: 'Pay for your delivery riders',
  shiprocket_cost: 'Fees paid to Shiprocket',
  refunds: 'Money given back to customers',
  discounts: 'Offers and coupons',
};

export const TrendAndCosts: React.FC<{ data: OverviewData }> = ({ data }) => {
  const hourly = data.range.bucket === 'hour';
  const series = data.series.map((s) => ({ ...s, label: fmtBucket(s.bucket, hourly) }));
  const cb = data.cost_breakdown;
  const costs = (cb?.items ?? []).filter((c) => (c.value ?? 0) > 0);
  const total = costs.reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div className="mb-5 grid items-start gap-5 lg:grid-cols-5">
      <SectionCard className="lg:col-span-3" icon={<LineIcon className="h-6 w-6" />} tone="blue" title="Sales and profit over time"
        subtitle={`How much you sold and earned each ${hourly ? 'hour' : 'day'}.`}>
        {series.length === 0 ? <EmptyNote>No sales in this period.</EmptyNote> : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F6BFF" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2F6BFF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} width={52}
                    tickFormatter={(v) => inr(v, { compact: true })} />
                  <ReferenceLine y={0} stroke="#98A2B3" strokeDasharray="4 4" />
                  <Tooltip formatter={(v: number, name: string) => [inr(v), name]} contentStyle={{ borderRadius: 12, border: '1px solid #E6E9F2', fontSize: 13, boxShadow: '0 8px 24px rgba(16,24,40,0.12)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                  <Area type="monotone" name="Sales you keep" dataKey="net_revenue" stroke="#2F6BFF" strokeWidth={2.5} fill="url(#ovSales)" />
                  <Line type="monotone" name="Profit" dataKey="net_profit" stroke="#12A66B" strokeWidth={2.5} dot={{ r: 3, fill: '#12A66B' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 rounded-xl bg-[#F6F8FC] px-3.5 py-2.5 text-sm text-[#475467]">
              <b className="text-[#2457D6]">How to read it:</b> the blue area is your sales, the green line is your profit.
              When the green line goes <b>below the dotted zero line</b>, you lost money that day.
            </p>
          </>
        )}
      </SectionCard>

      <SectionCard className="lg:col-span-2" icon={<PieIcon className="h-6 w-6" />} tone="violet" title="Where the money goes"
        subtitle="Each colour is a cost. Bigger slice = bigger cost.">
        {!cb ? <SectionError show /> : costs.length === 0 ? <EmptyNote>No costs recorded in this period.</EmptyNote> : (
          <>
            <div className="relative mx-auto h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costs} dataKey="value" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                    {costs.map((c) => <Cell key={c.key} fill={COST_COLORS[c.key] ?? '#98A2B3'} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [inr(v), n]} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-[#667085]">Total cost</span>
                <span className="text-xl font-extrabold text-[#1B2437]">{inr(total, { compact: true })}</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {costs.map((c) => (
                <li key={c.key} className="flex items-start gap-2.5">
                  <i className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: COST_COLORS[c.key] ?? '#98A2B3' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-[#1B2437]">{c.label.replace(' (goods sold)', '')}</span>
                      <span className="text-sm font-bold text-[#1B2437]">{inr(c.value)} <span className="font-medium text-[#98A2B3]">· {ratio((c.value ?? 0) / total, 0)}</span></span>
                    </div>
                    <div className="text-xs text-[#667085]">{COST_HELP[c.key]}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              <div className={`${surface} flex items-center justify-between px-3.5 py-2.5 text-sm`}>
                <span className="text-[#475467]" title="Stock bought from vendors this period. It becomes a cost only when sold.">Stock bought from vendors</span>
                <b className="text-[#1B2437]">{inr(cb.vendor_purchases)}</b>
              </div>
              {cb.untracked.map((u) => (
                <div key={u.key} className="flex items-center justify-between rounded-xl border border-dashed border-[#D9DEE7] px-3.5 py-2.5 text-sm">
                  <span className="text-[#667085]">{u.label}</span>
                  <span className="rounded-full bg-[#F1F3F7] px-2 py-0.5 text-xs font-medium text-[#667085]">Not recorded yet</span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
};
