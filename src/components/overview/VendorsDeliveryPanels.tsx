import React from 'react';
import { Bike, CircleAlert, Clock, PackageCheck, Store, ThumbsDown, ThumbsUp, Timer, Truck, Wallet } from 'lucide-react';
import type { OverviewData } from '../../types/overview.types';
import { inr, minutes, num, ratio } from '../../utils/overviewFormat';
import { EmptyNote, KpiTile, NotTracked, Pill, Ring, SectionCard, SectionError, TONES } from './parts';

export const VendorsPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const rows = data.vendors;
  return (
    <SectionCard className="mb-5" icon={<Store className="h-6 w-6" />} tone="blue" title="Your vendors"
      subtitle="Who you bought stock from, how much was refused, and how much profit their stock made.">
      {data.section_errors.vendors ? <SectionError show /> : rows.length === 0 ? <EmptyNote>No vendor delivery was received in this period.</EmptyNote> : (
        <>
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows.map((v) => {
              const badRej = (v.rejection_rate ?? 0) >= 0.08;
              return (
                <li key={v.vendor_id} className="rounded-xl border border-[#EEF0F5] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-[#1B2437]">{v.name}</div>
                      <div className="text-xs text-[#667085]">{v.supply_orders} supply order{v.supply_orders === 1 ? '' : 's'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-[#1B2437]">{inr(v.purchases, { compact: true })}</div>
                      <div className="text-xs text-[#667085]">you bought</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2.5" style={{ background: badRej ? TONES.red.bg : TONES.green.bg }}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: badRej ? TONES.red.fg : TONES.green.fg }}>
                        {badRej ? <ThumbsDown className="h-3.5 w-3.5" /> : <ThumbsUp className="h-3.5 w-3.5" />} Goods refused
                      </div>
                      <div className="mt-1 text-base font-extrabold text-[#1B2437]">{inr(v.rejected_value)} <span className="text-xs font-medium text-[#667085]">({ratio(v.rejection_rate, 0)})</span></div>
                    </div>
                    <div className="rounded-lg bg-[#F6F8FC] p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475467]"><Wallet className="h-3.5 w-3.5" /> Profit from their stock</div>
                      <div className="mt-1 text-base font-extrabold text-[#1B2437]">
                        {v.margin_generated == null ? '—' : inr(v.margin_generated)} {v.margin_pct != null && <span className="text-xs font-medium text-[#667085]">({ratio(v.margin_pct, 0)})</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {v.best_sku && <Pill tone="green">Best: {v.best_sku.name} · {ratio(v.best_sku.margin, 0)}</Pill>}
                    {v.worst_sku && <Pill tone="red">Weakest: {v.worst_sku.name} · {ratio(v.worst_sku.margin, 0)}</Pill>}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4"><NotTracked>Profit is counted on sales we can trace back to a vendor’s batch, for products that have a cost price. “Goods refused” is the value of items sent back when the delivery arrived.</NotTracked></div>
        </>
      )}
    </SectionCard>
  );
};

export const DeliveryPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const d = data.delivery;
  const onTime = d?.on_time_rate ?? null;
  const onTimeTone = onTime == null ? 'slate' : onTime >= 0.9 ? 'green' : onTime >= 0.7 ? 'amber' : 'red';
  return (
    <SectionCard className="mb-5" icon={<Bike className="h-6 w-6" />} tone="teal" title="Delivery & riders"
      subtitle="How many orders reached customers, how fast, and what it cost.">
      {!d ? <SectionError show /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#EEF0F5] p-5 text-center">
            <Ring value={onTime ?? 0} tone={onTimeTone} label={onTime == null ? '—' : ratio(onTime, 0)} />
            <div>
              <div className="flex items-center justify-center gap-1.5 text-base font-bold text-[#1B2437]"><Clock className="h-4 w-4 text-[#0EA5A5]" /> On-time deliveries</div>
              <p className="mt-1 text-sm text-[#667085]">{d.on_time_sample > 0 ? `${num(Math.round((d.on_time_rate ?? 0) * d.on_time_sample))} of ${num(d.on_time_sample)} arrived before the promised time.` : 'No delivery had a promised time yet.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
            <KpiTile icon={<PackageCheck className="h-4 w-4" />} tone="green" label="Delivered orders" value={num(d.delivered.value)}
              help="Orders that reached the customer." pct={d.delivered.change_pct} />
            <KpiTile icon={<Timer className="h-4 w-4" />} tone="blue" label="Average delivery time" value={minutes(d.avg_minutes)}
              help="From the moment of ordering to the doorstep."
              pct={d.avg_minutes != null && d.avg_minutes_previous ? ((d.avg_minutes - d.avg_minutes_previous) / d.avg_minutes_previous) * 100 : null} inverse />
            <KpiTile icon={<Truck className="h-4 w-4" />} tone="violet" label="Delivery cost per order" value={d.avg_cost_per_order == null ? '—' : inr(d.avg_cost_per_order)}
              help={`Riders ${inr(d.rider_cost, { compact: true })} · Shiprocket ${inr(d.shiprocket_cost, { compact: true })}.`} />
            <KpiTile icon={<CircleAlert className="h-4 w-4" />} tone="red" label="Failed or cancelled" value={num(d.failed.value)}
              help="Deliveries a rider cancelled or the partner could not finish." pct={d.failed.change_pct} inverse />
          </div>
        </div>
      )}
    </SectionCard>
  );
};
