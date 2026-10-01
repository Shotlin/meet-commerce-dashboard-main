import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import type { InsightKind, OverviewInsight, OverviewInsights } from '../../types/overview.types';
import { inr } from '../../utils/overviewFormat';
import { EmptyNote, SectionCard } from './parts';

const SEV: Record<string, string> = {
  high: 'bg-[#FDECEE] text-[#D63B4D] border-[#F8B6BE]',
  medium: 'bg-[#FFF7E6] text-[#D98900] border-[#FFDF99]',
  low: 'bg-[#F2F4F7] text-[#667085] border-[#D0D5DD]',
  info: 'bg-[#EBF2FC] text-[#2769D7] border-[#ADC8F7]',
};
const CATEGORY: Record<string, string> = {
  product: 'Product', area: 'Area', vendor: 'Vendor', discount: 'Discounts',
  customer: 'Customers', inventory: 'Stock', data: 'Data',
};

const TABS: { key: InsightKind; label: string }[] = [
  { key: 'leakage', label: 'Money leaking' },
  { key: 'opportunity', label: 'Opportunities' },
  { key: 'data', label: 'Data gaps' },
];

const Row: React.FC<{ i: OverviewInsight }> = ({ i }) => (
  <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', SEV[i.severity])}>{i.severity}</span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-status-neutral">{CATEGORY[i.category]}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{i.title}</div>
      <p className="mt-0.5 text-xs leading-relaxed text-status-neutral">{i.detail}</p>
    </div>
    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
      {i.impact_inr != null && (
        <div className={clsx('text-base font-extrabold', i.kind === 'leakage' ? 'text-[#D63B4D]' : 'text-[#179B73]')}
          title="Estimated ₹ impact over the selected period">
          {i.kind === 'leakage' ? '−' : '+'}{inr(i.impact_inr, { compact: true })}
        </div>
      )}
      {i.link && <Link to={i.link} className="text-xs font-semibold text-[#2769D7] hover:underline">Investigate →</Link>}
    </div>
  </li>
);

export const InsightsPanel: React.FC<{ insights: OverviewInsights }> = ({ insights }) => {
  const [tab, setTab] = useState<InsightKind>('leakage');
  const items = insights.items.filter((i) => i.kind === tab);
  const counts: Record<InsightKind, number> = {
    leakage: insights.totals.leakage_count,
    opportunity: insights.totals.opportunity_count,
    data: insights.items.filter((i) => i.kind === 'data').length,
  };
  return (
    <SectionCard className="mb-5" title="Profit Leakage & Opportunity"
      subtitle="Found automatically from your orders, refunds, deliveries and vendor data. ₹ figures are estimates for the selected period."
      action={
        <div role="tablist" className="inline-flex overflow-x-auto rounded-lg border bg-card p-0.5">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={clsx('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold',
                tab === t.key ? 'bg-ink text-white' : 'text-status-neutral hover:bg-muted')}>
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>
      }>
      {items.length === 0 ? (
        <EmptyNote>{tab === 'leakage' ? 'No leaks detected for this period.' : tab === 'opportunity' ? 'No standout growth yet for this period.' : 'No data gaps.'}</EmptyNote>
      ) : (
        <ul className="divide-y">{items.map((i) => <Row key={i.id} i={i} />)}</ul>
      )}
    </SectionCard>
  );
};
