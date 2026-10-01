import React from 'react';
import type { OverviewData } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { EmptyNote, NotTracked, SectionCard, SectionError, TableScroll, td, th } from './parts';

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg border p-3">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-status-neutral">{label}</div>
    <div className="mt-1 text-xl font-bold text-ink">{value}</div>
    {hint && <div className="text-[11px] text-status-neutral">{hint}</div>}
  </div>
);

export const CustomersPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const c = data.customers;
  const newShare = c.active > 0 ? c.new / c.active : null;
  return (
    <SectionCard className="mb-5" title="Customer intelligence" subtitle="Who is buying, who is coming back, and who has gone quiet">
      {data.section_errors.customers ? <SectionError show /> : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Active customers" value={num(c.active)} />
            <Stat label="New" value={num(c.new)} hint={newShare != null ? `${ratio(newShare, 0)} of active` : undefined} />
            <Stat label="Returning" value={num(c.repeat)} hint="First order was earlier" />
            <Stat label="Repeat-purchase rate" value={ratio(c.repeat_purchase_rate)} hint="Have ordered 2+ times ever" />
            <Stat label="Orders per customer" value={c.avg_frequency == null ? '—' : c.avg_frequency.toFixed(1)} hint="In this period" />
            <Stat label="Avg lifetime value" value={inr(c.avg_lifetime_value)} />
          </div>
          {c.ltv_note && <div className="mt-2"><NotTracked>Lifetime value: {c.ltv_note}.</NotTracked></div>}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-ink">Top customers</h3>
              {c.top.length === 0 ? <EmptyNote>No customers in this period.</EmptyNote> : (
                <TableScroll>
                  <table className="w-full min-w-[360px]">
                    <thead><tr><th className={th}>Customer</th><th className={th}>Orders</th><th className={th}>Spent</th></tr></thead>
                    <tbody className="divide-y">
                      {c.top.map((t) => (
                        <tr key={t.customer_id}>
                          <td className={td}><div className="font-medium">{t.name || 'Unnamed'}</div><div className="text-[11px] text-status-neutral">{t.phone}</div></td>
                          <td className={td}>{num(t.orders)}</td>
                          <td className={`${td} font-semibold`}>{inr(t.spend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-ink">
                Lapsed regulars {c.lapsed.total > 0 && <span className="font-normal text-status-neutral">· {c.lapsed.total} customers · ≈ {inr(c.lapsed.monthly_value, { compact: true })}/month at their old pace</span>}
              </h3>
              {data.filters.store_wide_hidden ? <NotTracked>Lapsed customers are tracked per store, so they are hidden while an area is selected.</NotTracked> : c.lapsed.top.length === 0 ? <EmptyNote>No regular customers have gone quiet.</EmptyNote> : (
                <TableScroll>
                  <table className="w-full min-w-[360px]">
                    <thead><tr><th className={th}>Customer</th><th className={th}>Last order</th><th className={th}>Used to spend</th></tr></thead>
                    <tbody className="divide-y">
                      {c.lapsed.top.map((t) => (
                        <tr key={t.customer_id}>
                          <td className={td}><div className="font-medium">{t.name || 'Unnamed'}</div><div className="text-[11px] text-status-neutral">{t.phone} · {t.orders} orders</div></td>
                          <td className={td}>{new Date(t.last_order_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                          <td className={`${td} font-semibold`}>{inr(t.monthly_value)}/mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
};
