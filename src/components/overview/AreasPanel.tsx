import React from 'react';
import { MapPin, ShoppingBag, Truck, Users } from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr, num } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, MiniBar, Pill, SectionCard, SectionError, TONES } from './parts';

export const AreasPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const rows = data.areas;
  const totalOrders = rows.reduce((s, a) => s + a.orders, 0);
  const avgCost = totalOrders > 0 ? rows.reduce((s, a) => s + a.delivery_cost, 0) / totalOrders : 0;
  const max = Math.max(...rows.map((a) => a.net_revenue), 1);
  return (
    <SectionCard className="mb-5" icon={<MapPin className="h-6 w-6" />} tone="teal" title="Your areas"
      subtitle="Which pincodes buy the most, and how costly each one is to deliver to.">
      {data.section_errors.areas ? <SectionError show /> : rows.length === 0 ? <EmptyNote>No orders in this period.</EmptyNote> : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((a, i) => {
            const costly = avgCost > 0 && a.orders >= 5 && a.delivery_cost_per_order >= avgCost * 1.25;
            return (
              <li key={a.pincode} className="rounded-xl border border-[#EEF0F5] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1F5F5] text-sm font-bold text-[#0B7C80]">{i + 1}</span>
                    <div>
                      <div className="text-base font-bold text-[#1B2437]">Pincode {a.pincode}</div>
                      <ChangeChip pct={a.revenue_change_pct} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#1B2437]">{inr(a.net_revenue, { compact: true })}</div>
                    <div className="text-xs text-[#667085]">sales kept</div>
                  </div>
                </div>
                <div className="mt-3"><MiniBar value={a.net_revenue} max={max} tone="teal" /></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[#F6F8FC] p-2"><ShoppingBag className="mx-auto h-4 w-4 text-[#2F6BFF]" /><div className="mt-1 text-sm font-bold text-[#1B2437]">{num(a.orders)}</div><div className="text-[11px] text-[#667085]">orders</div></div>
                  <div className="rounded-lg bg-[#F6F8FC] p-2"><Users className="mx-auto h-4 w-4 text-[#7C5CFC]" /><div className="mt-1 text-sm font-bold text-[#1B2437]">{inr(a.aov)}</div><div className="text-[11px] text-[#667085]">per order</div></div>
                  <div className="rounded-lg p-2" style={{ background: costly ? TONES.red.bg : '#F6F8FC' }}>
                    <Truck className="mx-auto h-4 w-4" style={{ color: costly ? TONES.red.fg : TONES.teal.fg }} />
                    <div className="mt-1 text-sm font-bold" style={{ color: costly ? TONES.red.fg : '#1B2437' }}>{inr(a.delivery_cost_per_order)}</div>
                    <div className="text-[11px] text-[#667085]">delivery / order</div>
                  </div>
                </div>
                {costly && <div className="mt-2.5"><Pill tone="red">Costly to deliver here</Pill></div>}
                {a.top_products.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">Customers here love</div>
                    <div className="flex flex-wrap gap-1.5">
                      {a.top_products.map((p) => <span key={p.product_id} className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-xs font-medium text-[#2457D6]">{p.name}</span>)}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};
