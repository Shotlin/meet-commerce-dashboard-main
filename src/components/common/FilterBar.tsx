import React from 'react';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  onExport?: () => void;
  onRefresh?: () => void;
  placeholder?: string;
  extraActions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions = [],
  onExport,
  onRefresh,
  placeholder = 'Search by ID, name, keyword...',
  extraActions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-[12px] shadow-xs mb-4">
      {/* Left Search and Filter Chips */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-rose-50/50 border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry focus:bg-white text-ink transition-all placeholder:text-status-neutral/60 font-medium"
          />
        </div>

        {onStatusChange && statusOptions.length > 0 && (
          <div className="flex items-center gap-1 bg-rose-50 border border-border px-2 py-1 rounded-[12px]">
            <Filter className="w-3.5 h-3.5 text-brand-berry shrink-0" />
            <select
              value={statusFilter || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer pr-1"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} title="Refresh data">
            <RefreshCw className="w-4 h-4 text-status-neutral hover:text-brand-berry" />
          </Button>
        )}
        {extraActions}
        {onExport && (
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={onExport}>
            Export CSV
          </Button>
        )}
      </div>
    </div>
  );
};
