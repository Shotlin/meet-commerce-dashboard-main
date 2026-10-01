import React, { useState } from 'react';
import { Flame, PackageSearch, Rocket, ShoppingBag, Trophy, Undo2, Wallet } from 'lucide-react';
import type { OverviewData, OverviewProductRow } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, MiniBar, NotTracked, Pill, SectionCard, SectionError, SoftTabs, rankBadge, type Tone } from './parts';

type TabKey = 'top_selling' | 'top_revenue' | 'top_profit' | 'trending' | 'slow_moving' | 'high_returns';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; help: string }[] = [
  { key: 'top_selling', label: 'Most sold', icon: <Trophy className="h-4 w-4" />, help: 'Products that sold the most pieces.' },
  { key: 'top_revenue', label: 'Most sales ₹', icon: <ShoppingBag className="h-4 w-4" />, help: 'Products that brought in the most money.' },
  { key: 'top_profit', label: 'Most profit', icon: <Wallet className="h-4 w-4" />, help: 'Products that leave you the most profit. Only products with a cost price can be counted.' },
  { key: 'trending', label: 'Growing', icon: <Rocket className="h-4 w-4" />, help: 'Products selling more than in the days before.' },
  { key: 'slow_moving', label: 'Not selling', icon: <PackageSearch className="h-4 w-4" />, help: 'Products sitting on the shelf. Fresh stock can spoil, so act early.' },
  { key: 'high_returns', label: 'Often refunded', icon: <Undo2 className="h-4 w-4" />, help: 'Products customers send back the most.' },
];

function marginPill(m: number | null) {
  if (m == null) return <Pill tone="slate">Cost not set</Pill>;
  const tone: Tone = m < 0.15 ? 'red' : m < 0.25 ? 'amber' : 'green';
  return <Pill tone={tone}>{m < 0.15 ? 'Low profit' : m < 0.25 ? 'OK profit' : 'Good profit'} · {ratio(m, 0)}</Pill>;
}

const Row: React.FC<{ rank: number; p: OverviewProductRow; tab: TabKey; max: number }> = ({ rank, p, tab, max }) => {
  const metric = tab === 'top_selling' ? p.units : tab === 'top_profit' ? p.profit ?? 0 : tab === 'high_returns' ? p.refund_rate ?? 0 : p.revenue;
  const barTone: Tone = tab === 'high_returns' ? 'red' : tab === 'top_profit' ? 'green' : tab === 'trending' ? 'teal' : 'blue';
  return (
    <li className="rounded-xl border border-[#EEF0F5] p-3.5">
      <div className="flex items-start gap-3">
        {rankBadge(rank)}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="truncate text-base font-bold text-[#1B2437]" title={p.name}>{p.name}</span>
            <span className="text-lg font-extrabold text-[#1B2437]">
              {tab === 'top_selling' ? `${num(p.units)} sold` : tab === 'top_profit' ? inr(p.profit) : tab === 'high_returns' ? ratio(p.refund_rate, 0) + ' refunded' : inr(p.revenue)}
            </span>
          </div>
          <div className="mt-2"><MiniBar value={metric} max={max} tone={barTone} /></div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#667085]">
            <span>{num(p.units)} sold</span>
            <span>{inr(p.revenue)} sales</span>
            {tab === 'high_returns' ? <Pill tone="red">{num(p.refunded_units)} sent back · {inr(p.refunded_value)}</Pill> : marginPill(p.margin)}
            {tab !== 'high_returns' && (p.growth == null ? <Pill tone="blue">New</Pill> : <ChangeChip pct={p.growth * 100} />)}
          </div>
        </div>
      </div>
    </li>
  );
};

export const ProductsPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const [tab, setTab] = useState<TabKey>('top_selling');
  const p = data.products;
  const cur = TABS.find((t) => t.key === tab)!;
  const rows = tab === 'slow_moving' ? [] : (p[tab] as OverviewProductRow[]);
  const key = (r: OverviewProductRow) => (tab === 'top_selling' ? r.units : tab === 'top_profit' ? r.profit ?? 0 : tab === 'high_returns' ? r.refund_rate ?? 0 : r.revenue);
  const max = Math.max(...rows.map(key), 1);
  const slowMax = Math.max(...p.slow_moving.map((s) => s.stock_value ?? 0), 1);

  return (
    <SectionCard className="mb-5" icon={<Flame className="h-6 w-6" />} tone="amber" title="Your products"
      subtitle="What sells, what earns, what is growing and what is stuck."
      action={<SoftTabs label="Product views" tabs={TABS} value={tab} onChange={setTab} />}>
      <p className="mb-3 rounded-xl bg-[#FFF8E8] px-3.5 py-2.5 text-sm text-[#7A4A00]"><b>{cur.label}:</b> {cur.help}</p>
      {data.section_errors.products ? <SectionError show /> : tab === 'slow_moving' ? (
        data.filters.store_wide_hidden ? <NotTracked>Stock is kept per store, not per area, so this list is hidden while an area is selected.</NotTracked>
          : p.slow_moving.length === 0 ? <EmptyNote>Nothing is stuck on the shelf. 👍</EmptyNote> : (
            <ul className="space-y-2.5">
              {p.slow_moving.map((s, i) => (
                <li key={s.product_id} className="rounded-xl border border-[#EEF0F5] p-3.5">
                  <div className="flex items-start gap-3">
                    {rankBadge(i + 1)}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate text-base font-bold text-[#1B2437]">{s.name}</span>
                        <span className="text-lg font-extrabold text-[#C93036]">{inr(s.stock_value, { compact: true })} stuck</span>
                      </div>
                      <div className="mt-2"><MiniBar value={s.stock_value ?? 0} max={slowMax} tone="red" /></div>
                      <div className="mt-2 text-sm text-[#667085]">{num(s.stock)} in stock · only {num(s.units_sold)} sold in this period</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
      ) : rows.length === 0 ? (
        <EmptyNote>{tab === 'top_profit' ? 'No sold product has a cost price yet, so profit cannot be worked out.' : tab === 'trending' ? 'No product is selling noticeably more than before.' : tab === 'high_returns' ? 'No product was refunded in this period. 👍' : 'No sales in this period.'}</EmptyNote>
      ) : (
        <ul className="space-y-2.5">{rows.map((r, i) => <Row key={r.product_id} rank={i + 1} p={r} tab={tab} max={max} />)}</ul>
      )}
    </SectionCard>
  );
};
