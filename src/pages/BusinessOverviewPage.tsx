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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/50" />)}
    </div>
    <div className="h-56 animate-pulse rounded-xl border bg-muted/50" />
    <div className="h-72 animate-pulse rounded-xl border bg-muted/50" />
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
    <div>
      <PageHeader
        title="Business Overview"
        subtitle="Sales, profit, leaks and growth across every store — what to look at today."
      />
      <OverviewFilters query={query} onChange={onChange} data={data} scopeLocked={Boolean(activeShopId)}
        isFetching={isFetching} onRefresh={() => refetch()} />

      {!customReady && (
        <div className="mb-4 rounded-lg border border-dashed px-3 py-2 text-xs text-status-neutral">Pick a start and end date to load a custom range.</div>
      )}

      {isLoading && !data ? <Skeleton /> : isError && !data ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-semibold text-ink">Could not load the overview</p>
          <p className="mt-1 text-xs text-status-neutral">{error instanceof Error ? error.message : 'Please try again.'}</p>
          <button onClick={() => refetch()} className="mt-3 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white">Try again</button>
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
          <p className="pb-4 text-center text-[11px] text-status-neutral">
            Updated {new Date(data.generated_at).toLocaleTimeString('en-IN')} · refreshes every minute · day boundaries use India time
          </p>
        </div>
      ) : null}
    </div>
  );
};
