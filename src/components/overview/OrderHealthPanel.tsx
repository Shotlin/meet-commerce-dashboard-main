import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Ban, CheckCircle2, ChefHat, ClipboardCheck, PackageCheck, RotateCcw, Truck, Undo2, ChevronRight, Activity,
} from 'lucide-react';
import type { OrderHealthCounts, OverviewData } from '../../types/overview.types';
import { num, ratio } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, IconChip, SectionCard, SectionError, TONES, surface, type Tone } from './parts';

interface Step { key: keyof OrderHealthCounts; label: string; help: string; icon: React.ReactNode; tone: Tone; inverse?: boolean }

const JOURNEY: Step[] = [
  { key: 'placed', label: 'Order placed', help: 'Waiting to be accepted', icon: <ClipboardCheck className="h-5 w-5" />, tone: 'blue' },
  { key: 'preparing', label: 'Being prepared', help: 'Cutting and cleaning', icon: <ChefHat className="h-5 w-5" />, tone: 'amber' },
  { key: 'packed', label: 'Packed', help: 'Ready for the rider', icon: <PackageCheck className="h-5 w-5" />, tone: 'violet' },
  { key: 'out_for_delivery', label: 'On the way', help: 'Rider is delivering', icon: <Truck className="h-5 w-5" />, tone: 'teal' },
  { key: 'delivered', label: 'Delivered', help: 'Reached the customer', icon: <CheckCircle2 className="h-5 w-5" />, tone: 'green' },
];
const PROBLEMS: Step[] = [
  { key: 'cancelled', label: 'Cancelled', help: 'Order did not happen', icon: <Ban className="h-5 w-5" />, tone: 'red', inverse: true },
  { key: 'refunded', label: 'Refunded', help: 'Money was returned', icon: <Undo2 className="h-5 w-5" />, tone: 'red', inverse: true },
  { key: 'return_requested', label: 'Return asked', help: 'Customer wants a refund', icon: <RotateCcw className="h-5 w-5" />, tone: 'amber', inverse: true },
];

export const OrderHealthPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const h = data.order_health;
  const daily = (h?.daily ?? []).map((d) => ({ ...d, label: d.day.slice(5).split('-').reverse().join('/') }));
  const total = h?.current.total ?? 0;
  const deliveredShare = total > 0 && h ? h.current.delivered / total : null;

  const Tile: React.FC<{ s: Step }> = ({ s }) => (
    <div className={`${surface} p-3.5`}>
      <div className="flex items-center gap-2.5">
        <IconChip icon={s.icon} tone={s.tone} size="sm" />
        <span className="text-sm font-semibold text-[#344054]">{s.label}</span>
      </div>
      <div className="mt-2.5 text-3xl font-extrabold text-[#1B2437]">{num(h?.current[s.key])}</div>
      <div className="mt-1 text-xs text-[#667085]">{s.help}</div>
      <div className="mt-2"><ChangeChip pct={h?.changes[s.key]} inverse={s.inverse} /></div>
    </div>
  );

  return (
    <SectionCard className="mb-5" icon={<Activity className="h-6 w-6" />} tone="teal" title="Order health"
      subtitle="Where every order placed in this period stands right now.">
      {!h ? <SectionError show /> : total === 0 ? <EmptyNote>No orders in this period.</EmptyNote> : (
        <>
          {deliveredShare != null && (
            <div className="mb-5 rounded-xl bg-[#F6F8FC] p-4">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-[#344054]">Orders delivered successfully</span>
                <span className="text-xl font-extrabold" style={{ color: deliveredShare >= 0.8 ? TONES.green.fg : deliveredShare >= 0.6 ? TONES.amber.fg : TONES.red.fg }}>
                  {ratio(deliveredShare, 0)}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full" style={{ width: `${deliveredShare * 100}%`, background: deliveredShare >= 0.8 ? TONES.green.solid : deliveredShare >= 0.6 ? TONES.amber.solid : TONES.red.solid }} />
              </div>
              <div className="mt-1.5 text-xs text-[#667085]">{num(h.current.delivered)} of {num(total)} orders reached the customer.</div>
            </div>
          )}

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#98A2B3]">The journey of an order</h3>
          <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {JOURNEY.map((s, i) => (
              <div key={s.key} className="relative">
                <Tile s={s} />
                {i < JOURNEY.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-[#C2C8D4] xl:block" />}
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-[#98A2B3]">When things go wrong</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{PROBLEMS.map((s) => <Tile key={s.key} s={s} />)}</div>

          {daily.length > 1 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#1B2437]">Orders each day</h3>
              <p className="mb-2 text-sm text-[#667085]">The green part is good. Red and orange are orders that were cancelled or refunded.</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} minTickGap={14} />
                    <YAxis tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} cursor={{ fill: '#F6F8FC' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#12A66B" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#E5484D" />
                    <Bar dataKey="refunded" name="Refunded" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
};
