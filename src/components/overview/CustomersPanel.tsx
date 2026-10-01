import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Crown, Heart, Repeat, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr, num, ratio } from '../../utils/overviewFormat';
import { Avatar, EmptyNote, KpiTile, NotTracked, Pill, SectionCard, SectionError, TONES } from './parts';

export const CustomersPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const c = data.customers;
  const split = [
    { name: 'New customers', value: c.new, color: TONES.blue.solid },
    { name: 'Came back', value: c.repeat, color: TONES.green.solid },
  ].filter((x) => x.value > 0);
  return (
    <SectionCard className="mb-5" icon={<Users className="h-6 w-6" />} tone="violet" title="Your customers"
      subtitle="Who is buying, who comes back, and who has stopped.">
      {data.section_errors.customers ? <SectionError show /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#EEF0F5] p-4">
              <h3 className="text-sm font-bold text-[#1B2437]">New or coming back?</h3>
              {split.length === 0 ? <EmptyNote>No customers in this period.</EmptyNote> : (
                <>
                  <div className="relative mx-auto mt-2 h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={split} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                          {split.map((s) => <Cell key={s.name} fill={s.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#1B2437]">{num(c.active)}</span>
                      <span className="text-xs text-[#667085]">customers</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: TONES.blue.solid }} />First-time buyers</span><b>{num(c.new)}</b></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: TONES.green.solid }} />Bought before</span><b>{num(c.repeat)}</b></div>
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
              <KpiTile icon={<Repeat className="h-4 w-4" />} tone="green" label="Come back again" value={ratio(c.repeat_purchase_rate, 0)}
                help="Out of 100 customers, this many have ordered more than once." />
              <KpiTile icon={<UserCheck className="h-4 w-4" />} tone="blue" label="Orders per customer" value={c.avg_frequency == null ? '—' : c.avg_frequency.toFixed(1)}
                help="How many times a customer ordered in this period, on average." />
              <KpiTile icon={<Wallet className="h-4 w-4" />} tone="violet" label="Lifetime spend" value={inr(c.avg_lifetime_value)}
                help="About how much one customer has spent with you in total." placeholder={c.avg_lifetime_value == null ? 'Needs 20+ customers' : undefined} />
              <KpiTile icon={<UserPlus className="h-4 w-4" />} tone="teal" label="Brand-new customers" value={num(c.new)}
                help="People who placed their very first order in this period." />
            </div>
          </div>
          {c.ltv_note && <div className="mt-3"><NotTracked>Lifetime spend: {c.ltv_note}.</NotTracked></div>}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-[#1B2437]"><Crown className="h-4 w-4 text-[#F59E0B]" /> Best customers</h3>
              {c.top.length === 0 ? <EmptyNote>No customers in this period.</EmptyNote> : (
                <ul className="space-y-2">
                  {c.top.map((t) => (
                    <li key={t.customer_id} className="flex items-center gap-3 rounded-xl border border-[#EEF0F5] p-3">
                      <Avatar name={t.name} tone="amber" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-[#1B2437]">{t.name || 'Unnamed customer'}</div>
                        <div className="text-xs text-[#667085]">{t.phone} · {t.orders} order{t.orders === 1 ? '' : 's'}</div>
                      </div>
                      <div className="text-base font-extrabold text-[#1B2437]">{inr(t.spend)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-[#1B2437]"><Heart className="h-4 w-4 text-[#E5484D]" /> Win these customers back</h3>
              <p className="mb-2 text-sm text-[#667085]">They used to order often but have gone quiet for 1–6 months.</p>
              {data.filters.store_wide_hidden ? <NotTracked>This is tracked per store, so it is hidden while an area is selected.</NotTracked>
                : c.lapsed.top.length === 0 ? <EmptyNote>Nobody regular has gone quiet. 👍</EmptyNote> : (
                  <>
                    <div className="mb-2"><Pill tone="amber">{c.lapsed.total} customers · about {inr(c.lapsed.monthly_value, { compact: true })} a month</Pill></div>
                    <ul className="space-y-2">
                      {c.lapsed.top.map((t) => (
                        <li key={t.customer_id} className="flex items-center gap-3 rounded-xl border border-[#FBE3AE] bg-[#FFFBF0] p-3">
                          <Avatar name={t.name} tone="amber" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-[#1B2437]">{t.name || 'Unnamed customer'}</div>
                            <div className="text-xs text-[#667085]">{t.phone} · last order {new Date(t.last_order_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                          </div>
                          <div className="text-right"><div className="text-sm font-extrabold text-[#B26A00]">{inr(t.monthly_value)}</div><div className="text-[11px] text-[#667085]">per month before</div></div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
};
