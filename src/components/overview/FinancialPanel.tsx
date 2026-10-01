import React from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OverviewData } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { EmptyNote, KpiTile, NotTracked, SectionCard, SectionError } from './parts';

export const FinancialKpis: React.FC<{ data: OverviewData }> = ({ data }) => {
  const k = data.kpis;
  if (!k) return <div className="mb-5"><SectionError show /></div>;
  const noProfit = k.net_profit.value == null;
  const profitPlaceholder = noProfit ? 'Needs cost prices' : undefined;
  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <KpiTile label="Gross revenue" value={inr(k.gross_revenue.value, { compact: true })} pct={k.gross_revenue.change_pct} hint="Item sales before discounts" />
        <KpiTile label="Net revenue" value={inr(k.net_revenue.value, { compact: true })} pct={k.net_revenue.change_pct} hint="After discounts & refunds" />
        <KpiTile label="Gross profit" value={noProfit ? '—' : inr(k.gross_profit.value, { compact: true })} pct={k.gross_profit.change_pct}
          placeholder={profitPlaceholder} tone={(k.gross_profit.value ?? 0) < 0 ? 'bad' : 'default'} hint="Sales − product cost" />
        <KpiTile label="Net profit (contribution)" value={noProfit ? '—' : inr(k.net_profit.value, { compact: true })} pct={k.net_profit.change_pct}
          placeholder={profitPlaceholder} tone={(k.net_profit.value ?? 0) < 0 ? 'bad' : noProfit ? 'default' : 'good'}
          hint={k.net_margin.value != null ? `${ratio(k.net_margin.value)} margin` : undefined} />
        <KpiTile label="Avg order value" value={inr(k.aov.value)} pct={k.aov.change_pct} />
        <KpiTile label="Orders" value={num(k.orders.value)} pct={k.orders.change_pct} />
        <KpiTile label="Discounts" value={inr(k.discounts.value, { compact: true })} pct={k.discounts.change_pct} inverse />
        <KpiTile label="Refunds & returns" value={inr(k.refunds.value, { compact: true })} pct={k.refunds.change_pct} inverse />
        <KpiTile label="Taxes collected" value={inr(k.taxes.value, { compact: true })} pct={k.taxes.change_pct} hint="Pass-through, not income" />
        <KpiTile label="Delivery revenue" value={inr(k.delivery_revenue.value, { compact: true })} pct={k.delivery_revenue.change_pct} hint="Delivery fees charged" />
        <KpiTile label="Operating cost" value={inr(k.operating_cost.value, { compact: true })} pct={k.operating_cost.change_pct} inverse hint="Tracked costs" />
      </div>
      {k.cost_coverage != null && k.cost_coverage < 1 && (
        <div className="mt-3">
          <NotTracked>
            Profit uses only orders where every item has a cost price ({Math.round(k.cost_coverage * 100)}% of orders this period), so it is never estimated.
            Net profit is a contribution margin: it excludes warehouse handling and inbound freight, which are not recorded yet.
          </NotTracked>
        </div>
      )}
    </div>
  );
};

function fmtBucket(b: string, hourly: boolean): string {
  const [date, time] = b.split('T');
  const [, m, d] = date.split('-');
  return hourly ? `${time}` : `${d}/${m}`;
}

export const TrendAndCosts: React.FC<{ data: OverviewData }> = ({ data }) => {
  const hourly = data.range.bucket === 'hour';
  const series = data.series.map((s) => ({ ...s, label: fmtBucket(s.bucket, hourly) }));
  const cb = data.cost_breakdown;
  const maxCost = Math.max(...(cb?.items.map((i) => i.value ?? 0) ?? [0]), 1);
  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-5">
      <SectionCard className="lg:col-span-3" title="Revenue & profit trend"
        subtitle={`Net revenue and contribution profit per ${hourly ? 'hour' : 'day'}`}>
        {series.length === 0 ? <EmptyNote>No sales in this period.</EmptyNote> : (
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} width={48}
                  tickFormatter={(v) => inr(v, { compact: true })} />
                <Tooltip formatter={(v: number, name: string) => [inr(v), name === 'net_revenue' ? 'Net revenue' : 'Profit']}
                  labelFormatter={(l) => String(l)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="net_revenue" stroke="#2563EB" strokeWidth={2} fill="url(#ovRev)" />
                <Line type="monotone" dataKey="net_profit" stroke="#179B73" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-2 flex gap-4 text-xs text-status-neutral">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2563EB]" />Net revenue</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#179B73]" />Profit (costed orders)</span>
        </div>
      </SectionCard>

      <SectionCard className="lg:col-span-2" title="Where the money goes" subtitle="Tracked costs for this period">
        {!cb ? <SectionError show /> : (
          <div className="space-y-3">
            {cb.items.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink">{c.label}</span>
                  <span className="font-semibold text-ink">{inr(c.value)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-ink/70" style={{ width: `${Math.max(2, ((c.value ?? 0) / maxCost) * 100)}%` }} />
                </div>
                {c.note && <div className="mt-0.5 text-[11px] text-status-neutral">{c.note}</div>}
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t pt-2 text-sm">
              <span className="font-semibold text-ink">Total tracked cost</span>
              <span className="font-bold text-ink">{inr(cb.total_tracked)}</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-status-neutral" title="Stock bought from vendors and received in this period. Shown separately: it becomes product cost only when sold.">Vendor purchases (stock bought)</span>
              <span className="font-semibold text-ink">{inr(cb.vendor_purchases)}</span>
            </div>
            {cb.untracked.map((u) => (
              <div key={u.key} className="flex items-baseline justify-between rounded-md border border-dashed px-2.5 py-1.5 text-sm">
                <span className="text-status-neutral">{u.label}</span>
                <span className="text-[11px] font-medium text-status-neutral">Not tracked yet</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
