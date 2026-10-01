import React from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, Droplets, Sprout, AlertTriangle } from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr, ratio } from '../../utils/overviewFormat';
import { ChangeChip } from './parts';

/**
 * The five questions a manager opens this page to answer, answered in one row:
 * sold / earned / losing / growing / investigate.
 */
export const HeroAnswers: React.FC<{ data: OverviewData }> = ({ data }) => {
  const { kpis, insights } = data;
  const topGrowth = insights.items.find((i) => i.kind === 'opportunity');
  const hasProfit = kpis?.net_profit.value != null;
  const profitNegative = (kpis?.net_profit.value ?? 0) < 0;

  const cards = [
    {
      q: 'How much did we sell?',
      icon: <TrendingUp className="h-4 w-4" />,
      value: inr(kpis?.net_revenue.value, { compact: true }),
      sub: `${kpis?.orders.value ?? 0} orders · gross ${inr(kpis?.gross_revenue.value, { compact: true })}`,
      chip: <ChangeChip pct={kpis?.net_revenue.change_pct} />,
      tone: 'text-ink',
    },
    {
      q: 'How much did we actually earn?',
      icon: <Wallet className="h-4 w-4" />,
      value: hasProfit ? inr(kpis?.net_profit.value, { compact: true }) : 'Not enough cost data',
      sub: hasProfit
        ? `${ratio(kpis?.net_margin.value)} margin on ${Math.round((kpis?.cost_coverage ?? 0) * 100)}% of orders`
        : 'Set cost prices to unlock profit',
      chip: hasProfit ? <ChangeChip pct={kpis?.net_profit.change_pct} /> : null,
      tone: !hasProfit ? 'text-status-neutral text-lg sm:text-xl' : profitNegative ? 'text-[#D63B4D]' : 'text-[#179B73]',
    },
    {
      q: 'Where are we losing money?',
      icon: <Droplets className="h-4 w-4" />,
      value: inr(insights.totals.leakage_inr, { compact: true }),
      sub: `${insights.totals.leakage_count} leak${insights.totals.leakage_count === 1 ? '' : 's'} found (estimated)`,
      chip: null,
      tone: insights.totals.leakage_inr > 0 ? 'text-[#D63B4D]' : 'text-ink',
    },
    {
      q: 'What is growing?',
      icon: <Sprout className="h-4 w-4" />,
      value: inr(insights.totals.opportunity_inr, { compact: true }),
      sub: topGrowth ? topGrowth.title : 'Nothing standing out yet',
      chip: null,
      tone: insights.totals.opportunity_inr > 0 ? 'text-[#179B73]' : 'text-ink',
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.q} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-status-neutral">
            {c.icon}{c.q}
          </div>
          <div className={clsx('mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl', c.tone)}>{c.value}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {c.chip}
            <span className="line-clamp-2 text-xs text-status-neutral">{c.sub}</span>
          </div>
        </div>
      ))}
      <div className="rounded-xl border bg-card p-4 shadow-sm sm:col-span-2 xl:col-span-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-status-neutral">
          <AlertTriangle className="h-4 w-4" /> What should we investigate today?
        </div>
        {insights.investigate_today.length === 0 ? (
          <p className="mt-2 text-sm text-status-neutral">No leaks found for this period. Nothing needs attention.</p>
        ) : (
          <ol className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {insights.investigate_today.map((i, n) => (
              <li key={i.id} className="flex gap-2.5 rounded-lg border bg-muted/30 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{n + 1}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">{i.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#D63B4D]">≈ {inr(i.impact_inr, { compact: true })}</span>
                    {i.link && <Link to={i.link} className="text-[#2769D7] hover:underline">Open</Link>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
