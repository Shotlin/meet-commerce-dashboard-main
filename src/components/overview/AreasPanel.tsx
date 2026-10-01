import React from 'react';
import { clsx } from 'clsx';
import type { OverviewData } from '../../types/overview.types';
import { inr, num } from '../../utils/overviewFormat';
import { ChangeChip, EmptyNote, SectionCard, SectionError, TableScroll, td, th } from './parts';

export const AreasPanel: React.FC<{ data: OverviewData }> = ({ data }) => {
  const rows = data.areas;
  const totalOrders = rows.reduce((s, a) => s + a.orders, 0);
  const avgCost = totalOrders > 0 ? rows.reduce((s, a) => s + a.delivery_cost, 0) / totalOrders : 0;
  return (
    <SectionCard className="mb-5" title="Area intelligence" subtitle="Performance by delivery pincode, with the delivery cost it takes to serve each">
      {data.section_errors.areas ? <SectionError show /> : rows.length === 0 ? <EmptyNote>No orders in this period.</EmptyNote> : (
        <TableScroll>
          <table className="w-full min-w-[760px]">
            <thead><tr>
              <th className={th}>Pincode</th><th className={th}>Net revenue</th><th className={th}>Orders</th>
              <th className={th}>AOV</th><th className={th}>Delivery cost / order</th><th className={th}>Vs previous</th>
              <th className={th}>Popular products</th>
            </tr></thead>
            <tbody className="divide-y">
              {rows.map((a) => {
                const heavy = avgCost > 0 && a.orders >= 5 && a.delivery_cost_per_order >= avgCost * 1.25;
                return (
                  <tr key={a.pincode}>
                    <td className={clsx(td, 'font-semibold')}>{a.pincode}</td>
                    <td className={td}>{inr(a.net_revenue)}</td>
                    <td className={td}>{num(a.orders)}</td>
                    <td className={td}>{inr(a.aov)}</td>
                    <td className={clsx(td, heavy && 'font-semibold text-[#D63B4D]')}>
                      {inr(a.delivery_cost_per_order)}{heavy && <span className="ml-1 text-[11px] font-medium">high</span>}
                    </td>
                    <td className={td}><ChangeChip pct={a.revenue_change_pct} /></td>
                    <td className={clsx(td, 'max-w-[260px]')}>
                      <div className="flex flex-wrap gap-1">
                        {a.top_products.map((p) => (
                          <span key={p.product_id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink">{p.name}</span>
                        ))}
                        {a.top_products.length === 0 && <span className="text-status-neutral">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </SectionCard>
  );
};
