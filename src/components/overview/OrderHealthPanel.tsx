import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OrderHealthCounts, OverviewData } from '../../types/overview.types';
import { num } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, SectionCard, SectionError } from './parts';

const TILES: { key: keyof OrderHealthCounts; label: string; color: string; inverse?: boolean }[] = [
  { key: 'delivered', label: 'Delivered', color: '#179B73' },
  { key: 'placed', label: 'Placed / Confirmed', color: '#2769D7' },
  { key: 'preparing', label: 'Preparing', color: '#D98900' },
  { key: 'packed', label: 'Packed', color: '#6D3FC2' },
  { key: 'out_for_delivery', label: 'Out for delivery', color: '#2769D7' },
  { key: 'cancelled', label: 'Cancelled', color: '#D63B4D', inverse: true },
  { key: 'refunded', label: 'Refunded', color: '#D63B4D', inverse: true },
  { key: 'return_requested', label: 'Return requested', color: '#D98900', inverse: true },
];

export const OrderHealthPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const h = data.order_health;
  const daily = (h?.daily ?? []).map((d) => ({ ...d, label: d.day.slice(5).split('-').reverse().join('/') }));
  return (
    <SectionCard className="mb-5" title="Order health" subtitle="Every order placed in the period, by where it stands now">
      {!h ? <SectionError show /> : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {TILES.map((t) => (
              <div key={t.key} className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-status-neutral">
                  <i className="h-2 w-2 rounded-full" style={{ background: t.color }} />{t.label}
                </div>
                <div className="mt-1 text-xl font-bold text-ink">{num(h.current[t.key])}</div>
                <ChangeChip pct={h.changes[t.key]} inverse={t.inverse} className="mt-1" />
              </div>
            ))}
          </div>
          {daily.length > 1 && (
            <div className="mt-4 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} minTickGap={14} />
                  <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#179B73" />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#D63B4D" />
                  <Bar dataKey="refunded" name="Refunded" stackId="a" fill="#D98900" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {h.current.total === 0 && <EmptyNote>No orders in this period.</EmptyNote>}
        </>
      )}
    </SectionCard>
  );
};
