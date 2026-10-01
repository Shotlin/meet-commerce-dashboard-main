import React from 'react';
import { clsx } from 'clsx';
import type { OverviewData } from '../../types/overview.types';
import { inr, minutes, num, ratio } from '../../utils/overviewFormat';
import { EmptyNote, KpiTile, NotTracked, SectionCard, SectionError, TableScroll, td, th } from './parts';

export const VendorsPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const rows = data.vendors;
  return (
    <SectionCard className="mb-5" title="Vendor intelligence"
      subtitle="Stock bought in the period, rejections at receiving, and margin earned on what each vendor supplied">
      {data.section_errors.vendors ? <SectionError show /> : rows.length === 0 ? <EmptyNote>No vendor deliveries were received in this period.</EmptyNote> : (
        <>
          <TableScroll>
            <table className="w-full min-w-[820px]">
              <thead><tr>
                <th className={th}>Vendor</th><th className={th}>Purchases</th><th className={th}>Rejected</th>
                <th className={th}>Sales from stock</th><th className={th}>Margin generated</th>
                <th className={th}>Best SKU</th><th className={th}>Worst SKU</th>
              </tr></thead>
              <tbody className="divide-y">
                {rows.map((v) => (
                  <tr key={v.vendor_id}>
                    <td className={clsx(td, 'font-medium')}>{v.name}<div className="text-[11px] font-normal text-status-neutral">{v.supply_orders} supply order{v.supply_orders === 1 ? '' : 's'}</div></td>
                    <td className={td}>{inr(v.purchases)}</td>
                    <td className={clsx(td, (v.rejection_rate ?? 0) >= 0.08 && 'font-semibold text-[#D63B4D]')}>
                      {inr(v.rejected_value)} <span className="text-[11px] font-normal text-status-neutral">{ratio(v.rejection_rate)}</span>
                    </td>
                    <td className={td}>{inr(v.revenue_generated)}</td>
                    <td className={td}>{v.margin_generated == null ? <span className="text-status-neutral">—</span> : <>{inr(v.margin_generated)} <span className="text-[11px] text-status-neutral">{ratio(v.margin_pct)}</span></>}</td>
                    <td className={td}>{v.best_sku ? <>{v.best_sku.name} <span className="text-[11px] text-[#179B73]">{ratio(v.best_sku.margin, 0)}</span></> : '—'}</td>
                    <td className={td}>{v.worst_sku ? <>{v.worst_sku.name} <span className="text-[11px] text-[#D63B4D]">{ratio(v.worst_sku.margin, 0)}</span></> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <div className="mt-3">
            <NotTracked>Margin is calculated on sales that can be traced to a vendor's batch and where the product has a cost price. Rejections are the value of goods refused when the delivery was received.</NotTracked>
          </div>
        </>
      )}
    </SectionCard>
  );
};

export const DeliveryPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const d = data.delivery;
  return (
    <SectionCard className="mb-5" title="Delivery & rider metrics" subtitle="Completed deliveries, what they cost, and how fast they were">
      {!d ? <SectionError show /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiTile label="Deliveries completed" value={num(d.delivered.value)} pct={d.delivered.change_pct} />
          <KpiTile label="Delivery cost / order" value={d.avg_cost_per_order == null ? '—' : inr(d.avg_cost_per_order)}
            hint={`Riders ${inr(d.rider_cost, { compact: true })} · Shiprocket ${inr(d.shiprocket_cost, { compact: true })}`} />
          <KpiTile label="Avg delivery time" value={minutes(d.avg_minutes)}
            pct={d.avg_minutes != null && d.avg_minutes_previous ? ((d.avg_minutes - d.avg_minutes_previous) / d.avg_minutes_previous) * 100 : null} inverse hint="Order to doorstep" />
          <KpiTile label="On-time rate" value={ratio(d.on_time_rate, 0)} placeholder={d.on_time_sample === 0 ? 'No timed deliveries' : undefined}
            hint={d.on_time_sample ? `of ${num(d.on_time_sample)} timed` : undefined} tone={d.on_time_rate != null && d.on_time_rate < 0.8 ? 'bad' : 'default'} />
          <KpiTile label="Failed / cancelled" value={num(d.failed.value)} pct={d.failed.change_pct} inverse hint="Rider cancellations & partner failures" />
        </div>
      )}
    </SectionCard>
  );
};
