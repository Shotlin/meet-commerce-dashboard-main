import React from 'react';
import { CalendarDays, Lock, MapPin, RefreshCw, Store } from 'lucide-react';
import { clsx } from 'clsx';
import type { OverviewData, OverviewQuery, OverviewRangeKey } from '../../types/overview.types';
import { SoftTabs, surface } from './parts';

const RANGES: { key: OverviewRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'custom', label: 'Pick dates' },
];

const field =
  'h-10 rounded-xl border border-[#E1E5EC] bg-white px-3 text-sm text-[#1B2437] shadow-sm outline-none transition focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10';

interface Props {
  query: OverviewQuery;
  onChange: (q: OverviewQuery) => void;
  data: OverviewData | undefined;
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
    <div className={clsx(surface, 'mb-5 p-3 sm:p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
          <CalendarDays className="h-4 w-4 text-[#2F6BFF]" /> Time
        </div>
        <SoftTabs label="Date range" value={query.range} tabs={RANGES}
          onChange={(k) => onChange({ ...query, range: k })} />
        {query.range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" aria-label="From date" className={field} value={query.from ?? ''}
              max={query.to || undefined} onChange={(e) => onChange({ ...query, from: e.target.value })} />
            <span className="text-sm text-[#667085]">to</span>
            <input type="date" aria-label="To date" className={field} value={query.to ?? ''}
              min={query.from || undefined} onChange={(e) => onChange({ ...query, to: e.target.value })} />
          </div>
        )}
        <button onClick={onRefresh} aria-label="Refresh numbers"
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-[#E1E5EC] bg-white px-4 text-sm font-semibold text-[#344054] shadow-sm transition hover:bg-[#F6F8FC]">
          <RefreshCw className={clsx('h-4 w-4 text-[#2F6BFF]', isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#EEF0F5] pt-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
          <Store className="h-4 w-4 text-[#7C5CFC]" /> Where
        </div>
        {locked ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F1F3F9] px-3.5 text-sm font-medium text-[#1B2437]"
            title="Change the store from the switcher at the top of the page">
            <Lock className="h-3.5 w-3.5 text-[#667085]" />{lockedName ?? 'Selected store'}
          </span>
        ) : (
          <select aria-label="Store" className={field} value={query.shopId ?? ''}
            onChange={(e) => onChange({ ...query, shopId: e.target.value || null, pincode: null })}>
            <option value="">All stores</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#0EA5A5]" />
          <select aria-label="Area" className={field} value={query.pincode ?? ''}
            onChange={(e) => onChange({ ...query, pincode: e.target.value || null })}>
            <option value="">All areas</option>
            {pincodes.map((p) => <option key={p} value={p}>Pincode {p}</option>)}
          </select>
        </div>
        {data && (
          <span className="text-sm text-[#667085]">
            Showing <b className="text-[#344054]">{data.range.label.toLowerCase()}</b> · every “more / less” compares with the {data.range.days} day{data.range.days > 1 ? 's' : ''} before
          </span>
        )}
      </div>
    </div>
  );
};
