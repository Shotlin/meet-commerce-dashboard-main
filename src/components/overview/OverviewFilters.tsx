import React from 'react';
import { clsx } from 'clsx';
import { Lock, RefreshCw } from 'lucide-react';
import type { OverviewData, OverviewQuery, OverviewRangeKey } from '../../types/overview.types';

const RANGES: { key: OverviewRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'custom', label: 'Custom' },
];

const field = 'h-9 rounded-lg border bg-card px-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring';

interface Props {
  query: OverviewQuery;
  onChange: (q: OverviewQuery) => void;
  data: OverviewData | undefined;
  /** Top-bar shop switcher is active, so the in-page store filter is fixed. */
  scopeLocked: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export const OverviewFilters: React.FC<Props> = ({ query, onChange, data, scopeLocked, isFetching, onRefresh }) => {
  const shops = data?.options.shops ?? [];
  const pincodes = data?.options.pincodes ?? [];
  const locked = scopeLocked || data?.filters.shop_locked;
  const lockedName = shops.find((s) => s.id === data?.filters.shop_id)?.name;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Date range" className="inline-flex max-w-full overflow-x-auto rounded-lg border bg-card p-0.5">
          {RANGES.map((r) => (
            <button key={r.key} role="tab" aria-selected={query.range === r.key}
              onClick={() => onChange({ ...query, range: r.key })}
              className={clsx('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                query.range === r.key ? 'bg-ink text-white' : 'text-status-neutral hover:bg-muted')}>
              {r.label}
            </button>
          ))}
        </div>
        {query.range === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input type="date" aria-label="From date" className={field} value={query.from ?? ''}
              max={query.to || undefined} onChange={(e) => onChange({ ...query, from: e.target.value })} />
            <span className="text-xs text-status-neutral">to</span>
            <input type="date" aria-label="To date" className={field} value={query.to ?? ''}
              min={query.from || undefined} onChange={(e) => onChange({ ...query, to: e.target.value })} />
          </div>
        )}
        <button onClick={onRefresh} aria-label="Refresh"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-semibold text-ink hover:bg-muted">
          <RefreshCw className={clsx('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {locked ? (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-muted px-3 text-sm text-ink"
            title="Change the store from the switcher in the top bar">
            <Lock className="h-3.5 w-3.5 text-status-neutral" />
            {lockedName ?? 'Selected store'}
          </span>
        ) : (
          <select aria-label="Store" className={field} value={query.shopId ?? ''}
            onChange={(e) => onChange({ ...query, shopId: e.target.value || null, pincode: null })}
            title="Each store has its own warehouse, so this also filters warehouse figures">
            <option value="">All stores / warehouses</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select aria-label="Area" className={field} value={query.pincode ?? ''}
          onChange={(e) => onChange({ ...query, pincode: e.target.value || null })}>
          <option value="">All areas (pincodes)</option>
          {pincodes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {data && (
          <span className="text-xs text-status-neutral">
            {data.range.label} · compared with the previous {data.range.days} day{data.range.days > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
