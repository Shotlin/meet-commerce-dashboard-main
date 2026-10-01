import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Droplets, PiggyBank, ShoppingBag, Sprout } from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr } from '../../utils/overviewFormat';
import { ChangeChip, IconChip, Pill, TONES, surface, type Tone } from './parts';

const Big: React.FC<{
  icon: React.ReactNode; tone: Tone; question: string; value: string; valueTone?: Tone; sentence: string; chip?: React.ReactNode;
}> = ({ icon, tone, question, value, valueTone, sentence, chip }) => (
  <div className={`${surface} relative overflow-hidden p-5`}>
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: TONES[tone].solid }} />
    <div className="flex items-center gap-3">
      <IconChip icon={icon} tone={tone} size="lg" />
      <div className="text-sm font-semibold leading-snug text-[#475467]">{question}</div>
    </div>
    <div className="mt-4 text-4xl font-extrabold tracking-tight" style={{ color: valueTone ? TONES[valueTone].fg : '#1B2437' }}>{value}</div>
    <p className="mt-2 text-sm leading-snug text-[#667085]">{sentence}</p>
    {chip && <div className="mt-3">{chip}</div>}
  </div>
);

export const HeroAnswers: React.FC<{ data: OverviewData }> = ({ data }) => {
  const { kpis, insights } = data;
  const profit = kpis?.net_profit.value ?? null;
  const hasProfit = profit != null;
  const lost = hasProfit && profit < 0;
  const orders = kpis?.orders.value ?? 0;
  const topGrowth = insights.items.find((i) => i.kind === 'opportunity');
  const leaks = insights.totals.leakage_count;

  const summary = (
    <>
      In <b>{data.range.label.toLowerCase()}</b> customers placed <b>{orders} order{orders === 1 ? '' : 's'}</b> and you kept{' '}
      <b>{inr(kpis?.net_revenue.value, { compact: true })}</b> in sales.{' '}
      {hasProfit
        ? lost
          ? <>After costs you <b className="text-[#FFD7D9]">lost {inr(Math.abs(profit), { compact: true })}</b>.</>
          : <>After costs you <b className="text-[#C9F5DE]">earned {inr(profit, { compact: true })}</b>.</>
        : <>Add cost prices to your products to see profit.</>}{' '}
      {leaks > 0
        ? <>We found <b>{leaks} problem{leaks === 1 ? '' : 's'}</b> that may be costing about <b>{inr(insights.totals.leakage_inr, { compact: true })}</b>.</>
        : <>We found no money leaks. Great job!</>}
    </>
  );

  return (
    <div className="mb-5 space-y-4">
      <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_10px_30px_-12px_rgba(47,107,255,0.55)] sm:p-6"
        style={{ background: 'linear-gradient(135deg,#2F6BFF 0%,#5B3FD0 100%)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/75">Quick summary</div>
          <p className="mt-1.5 text-base leading-relaxed sm:text-lg">{summary}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/80">
          <span><b className="text-white">K</b> = thousand (₹18K = ₹18,000)</span>
          <span><b className="text-white">L</b> = lakh (₹1L = ₹1,00,000)</span>
          <span><b className="text-white">Cr</b> = crore (₹1Cr = ₹1,00,00,000)</span>
          <span><b className="text-[#C9F5DE]">Green</b> = good · <b className="text-[#FFD7D9]">Red</b> = needs attention</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Big icon={<ShoppingBag className="h-6 w-6" />} tone="blue" question="How much did we sell?"
          value={inr(kpis?.net_revenue.value, { compact: true })}
          sentence={`From ${orders} order${orders === 1 ? '' : 's'}. Before discounts and refunds it was ${inr(kpis?.gross_revenue.value, { compact: true })}.`}
          chip={<ChangeChip pct={kpis?.net_revenue.change_pct} />} />
        <Big icon={<PiggyBank className="h-6 w-6" />} tone={!hasProfit ? 'slate' : lost ? 'red' : 'green'}
          question="How much did we really earn?"
          value={hasProfit ? inr(profit, { compact: true }) : 'Not known yet'}
          valueTone={!hasProfit ? 'slate' : lost ? 'red' : 'green'}
          sentence={hasProfit
            ? `Out of every ₹100 of sales you ${lost ? 'lose' : 'keep'} about ₹${Math.abs((kpis?.net_margin.value ?? 0) * 100).toFixed(0)}. Counted on ${Math.round((kpis?.cost_coverage ?? 0) * 100)}% of orders.`
            : 'We need the buying price (cost price) of your products to work out profit.'}
          chip={hasProfit ? <ChangeChip pct={kpis?.net_profit.change_pct} /> : <Pill tone="amber">Set cost prices</Pill>} />
        <Big icon={<Droplets className="h-6 w-6" />} tone="red" question="Where are we losing money?"
          value={inr(insights.totals.leakage_inr, { compact: true })} valueTone={insights.totals.leakage_inr > 0 ? 'red' : undefined}
          sentence={leaks > 0 ? `${leaks} money leak${leaks === 1 ? '' : 's'} found. This is an estimate for this period.` : 'No leaks found. Nothing needs fixing.'}
          chip={leaks > 0 ? <Pill tone="red">{leaks} to fix</Pill> : <Pill tone="green">All good</Pill>} />
        <Big icon={<Sprout className="h-6 w-6" />} tone="green" question="What is growing?"
          value={inr(insights.totals.opportunity_inr, { compact: true })} valueTone={insights.totals.opportunity_inr > 0 ? 'green' : undefined}
          sentence={topGrowth ? topGrowth.title : 'Nothing is growing fast yet.'}
          chip={insights.totals.opportunity_count > 0 ? <Pill tone="green">{insights.totals.opportunity_count} chance{insights.totals.opportunity_count === 1 ? '' : 's'}</Pill> : undefined} />
      </div>

      <div className={`${surface} p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <IconChip icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
          <div>
            <h2 className="text-lg font-bold leading-tight text-[#1B2437]">Fix these first</h2>
            <p className="text-sm text-[#667085]">The biggest money problems right now, biggest first.</p>
          </div>
        </div>
        {insights.investigate_today.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#E4F6EC] px-4 py-3 text-sm font-medium text-[#0B8A57]">Nothing needs attention for this period. 🎉</p>
        ) : (
          <ol className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {insights.investigate_today.map((i, n) => (
              <li key={i.id} className="flex gap-3 rounded-xl border border-[#F8D2D4] bg-[#FFF8F8] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E5484D] text-sm font-bold text-white">{n + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-snug text-[#1B2437]">{i.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill tone="red">Could cost {inr(i.impact_inr, { compact: true })}</Pill>
                    {i.link && (
                      <Link to={i.link} className="inline-flex items-center gap-1 text-sm font-semibold text-[#2457D6] hover:underline">
                        Look into it <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
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
