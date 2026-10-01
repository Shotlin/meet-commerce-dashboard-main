import React, { useState } from 'react';
import { clsx } from 'clsx';
import type { OverviewData, OverviewProductRow } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, NotTracked, SectionCard, SectionError, TableScroll, td, th } from './parts';

type TabKey = 'top_selling' | 'top_revenue' | 'top_profit' | 'trending' | 'slow_moving' | 'high_returns';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'top_selling', label: 'Top selling' },
  { key: 'top_revenue', label: 'Highest revenue' },
  { key: 'top_profit', label: 'Highest profit' },
  { key: 'trending', label: 'Trending' },
  { key: 'slow_moving', label: 'Slow moving' },
  { key: 'high_returns', label: 'Most refunded' },
];

const marginTone = (m: number | null) => (m == null ? 'text-status-neutral' : m < 0.15 ? 'text-[#D63B4D] font-semibold' : m >= 0.3 ? 'text-[#179B73] font-semibold' : 'text-ink');

const ProductTable: React.FC<{ rows: OverviewProductRow[]; tab: TabKey }> = ({ rows, tab }) => (
  <TableScroll>
    <table className="w-full min-w-[520px]">
      <thead><tr>
        <th className={th}>Product</th><th className={th}>Units</th><th className={th}>Revenue</th>
        <th className={th}>Profit</th><th className={th}>Margin</th>
        <th className={th}>{tab === 'high_returns' ? 'Refund rate' : 'Vs previous'}</th>
      </tr></thead>
      <tbody className="divide-y">
        {rows.map((p) => (
          <tr key={p.product_id}>
            <td className={clsx(td, 'max-w-[220px] truncate font-medium')} title={p.name}>{p.name}</td>
            <td className={td}>{num(p.units)}</td>
            <td className={td}>{inr(p.revenue)}</td>
            <td className={td}>{p.profit == null ? <span className="text-status-neutral" title="No cost price set">—</span> : inr(p.profit)}</td>
            <td className={clsx(td, marginTone(p.margin))}>{ratio(p.margin)}</td>
            <td className={td}>
              {tab === 'high_returns'
                ? <span className="font-semibold text-[#D63B4D]">{ratio(p.refund_rate)} <span className="font-normal text-status-neutral">({num(p.refunded_units)} units)</span></span>
                : p.growth == null ? <span className="text-status-neutral">new</span> : <ChangeChip pct={p.growth * 100} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableScroll>
);

export const ProductsPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const [tab, setTab] = useState<TabKey>('top_selling');
  const p = data.products;
  const slow = p.slow_moving;
  return (
    <SectionCard className="mb-5" title="Product intelligence" subtitle="What sells, what earns, what is growing and what is stuck"
      action={
        <div role="tablist" className="inline-flex max-w-full overflow-x-auto rounded-lg border bg-card p-0.5">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={clsx('whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold',
                tab === t.key ? 'bg-ink text-white' : 'text-status-neutral hover:bg-muted')}>{t.label}</button>
          ))}
        </div>
      }>
      {data.section_errors.products ? <SectionError show /> : tab === 'slow_moving' ? (
        data.filters.store_wide_hidden ? <NotTracked>Stock is held per store, not per delivery area, so slow-moving stock is hidden while an area is selected.</NotTracked> : slow.length === 0 ? <EmptyNote>No slow-moving stock found.</EmptyNote> : (
          <TableScroll>
            <table className="w-full min-w-[420px]">
              <thead><tr><th className={th}>Product</th><th className={th}>In stock</th><th className={th}>Sold</th><th className={th}>Cash tied up</th></tr></thead>
              <tbody className="divide-y">
                {slow.map((s) => (
                  <tr key={s.product_id}>
                    <td className={clsx(td, 'max-w-[220px] truncate font-medium')}>{s.name}</td>
                    <td className={td}>{num(s.stock)}</td><td className={td}>{num(s.units_sold)}</td>
                    <td className={clsx(td, 'font-semibold')}>{inr(s.stock_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )
      ) : p[tab].length === 0 ? (
        <EmptyNote>{tab === 'top_profit' ? 'No products with a cost price sold in this period.' : tab === 'trending' ? 'No product grew meaningfully versus the previous period.' : tab === 'high_returns' ? 'No refunds on products in this period.' : 'No sales in this period.'}</EmptyNote>
      ) : <ProductTable rows={p[tab] as OverviewProductRow[]} tab={tab} />}
    </SectionCard>
  );
};
