import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PermissionDenied } from '../components/states/PermissionDenied';
import { useAuth } from '../context/AuthContext';
import { useShopScope } from '../context/ShopScopeContext';
import { useOverview } from '../hooks/useOverview';
import { isRouteAllowed } from '../utils/permissions';
import type { OverviewQuery } from '../types/overview.types';
import { OverviewFilters } from '../components/overview/OverviewFilters';
import { HeroAnswers } from '../components/overview/HeroAnswers';
import { InsightsPanel } from '../components/overview/InsightsPanel';
import { FinancialKpis, TrendAndCosts } from '../components/overview/FinancialPanel';
import { OrderHealthPanel } from '../components/overview/OrderHealthPanel';
import { ProductsPanel } from '../components/overview/ProductsPanel';
import { AreasPanel } from '../components/overview/AreasPanel';
import { CustomersPanel } from '../components/overview/CustomersPanel';
import { DeliveryPanel, VendorsPanel } from '../components/overview/VendorsDeliveryPanels';
import { isoDate } from '../utils/overviewFormat';

const Skeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading overview">
    <div className="h-28 animate-pulse rounded-2xl bg-[#E4E9F5]" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#ECEFF7]" />)}
    </div>
    <div className="h-64 animate-pulse rounded-2xl bg-[#ECEFF7]" />
  </div>
);

export const BusinessOverviewPage: React.FC = () => {
  const { role, setRole } = useAuth();
  const { activeShopId } = useShopScope();
  const allowed = isRouteAllowed('/overview', role);

  const [query, setQuery] = useState<OverviewQuery>({ range: '7d', shopId: null, pincode: null });

  // A custom range is only sent once both dates are filled in and ordered.
  const customReady = query.range !== 'custom' || Boolean(query.from && query.to && query.from <= query.to);
  const effective: OverviewQuery = { ...query, shopId: activeShopId ?? query.shopId };
  const { data, isLoading, isError, error, refetch, isFetching } = useOverview(effective);

  if (!allowed) {
    return <PermissionDenied requiredRole="HQ Admin or Finance Lead" onSwitchRole={() => setRole('HQ Admin')} />;
  }

  const onChange = (q: OverviewQuery) => {
    // Picking "Custom" pre-fills the last 7 days so the page never shows an empty state.
    if (q.range === 'custom' && !q.from && !q.to) {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 6);
      setQuery({ ...q, from: isoDate(from), to: isoDate(to) });
      return;
    }
    setQuery(q);
  };

  return (
    <div className="-m-3 min-h-full bg-[#F4F6FB] p-3 sm:-m-6 sm:p-6">
      <PageHeader
        title="Business Overview"
        subtitle="One simple page that shows how your business is doing — sales, profit, problems and growth."
      />
      <OverviewFilters query={query} onChange={onChange} data={data} scopeLocked={Boolean(activeShopId)}
        isFetching={isFetching} onRefresh={() => refetch()} />

      {!customReady && (
        <div className="mb-4 rounded-xl bg-[#EAF1FF] px-4 py-3 text-sm text-[#2457D6]">Pick a start date and an end date to see your numbers.</div>
      )}

      {isLoading && !data ? <Skeleton /> : isError && !data ? (
        <div className="rounded-2xl border border-[#F8D2D4] bg-white p-8 text-center shadow-sm">
          <p className="text-base font-bold text-[#1B2437]">We could not load your numbers</p>
          <p className="mt-1 text-sm text-[#667085]">{error instanceof Error ? error.message : 'Please try again.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-[#2F6BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2457D6]">Try again</button>
        </div>
      ) : data ? (
        <div className={isFetching ? 'opacity-80 transition-opacity' : 'transition-opacity'}>
          <HeroAnswers data={data} />
          <InsightsPanel insights={data.insights} />
          <FinancialKpis data={data} />
          <TrendAndCosts data={data} />
          <OrderHealthPanel data={data} />
          <ProductsPanel data={data} />
          <AreasPanel data={data} />
          <CustomersPanel data={data} />
          <VendorsPanel data={data} />
          <DeliveryPanel data={data} />
          <p className="pb-4 text-center text-xs text-[#98A2B3]">
            Updated at {new Date(data.generated_at).toLocaleTimeString('en-IN')} · refreshes by itself every minute · days follow India time
          </p>
        </div>
      ) : null}
    </div>
  );
};
