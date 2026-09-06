import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Store, ChevronDown, Check, Search } from 'lucide-react';
import { useShopScope } from '../../context/ShopScopeContext';

export const ShopSwitcher: React.FC = () => {
  const { shops, isLoading, activeShopId, activeShop, setActiveShop } = useShopScope();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredShops = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...shops].sort((a, b) => a.name.localeCompare(b.name));
    if (!needle) return sorted;
    return sorted.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.branch_code.toLowerCase().includes(needle) ||
        s.city.toLowerCase().includes(needle)
    );
  }, [shops, query]);

  const triggerLabel = activeShop ? activeShop.name : 'All Shops';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-border rounded-[12px] text-xs font-bold text-ink transition-colors hover:bg-rose-100/60 cursor-pointer max-w-[220px]"
        title="Switch shop scope (X-Shop-Id)"
      >
        <Store className="w-3.5 h-3.5 text-brand-berry shrink-0" />
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="w-3 h-3 ml-0.5 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-[12px] shadow-overlay z-50 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="w-3.5 h-3.5 text-status-neutral shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops…"
              autoFocus
              className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-status-neutral/60"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            <button
              onClick={() => {
                setActiveShop(null);
                setQuery('');
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-xs font-bold transition-colors hover:bg-rose-50 ${
                activeShopId === null ? 'bg-rose-100 text-brand-berry' : 'text-ink'
              }`}
            >
              <Check className={`w-3.5 h-3.5 shrink-0 ${activeShopId === null ? 'opacity-100' : 'opacity-0'}`} />
              All Shops (HQ-wide)
            </button>

            <div className="my-1 h-px bg-border" />

            {isLoading ? (
              <p className="px-2.5 py-2 text-[11px] text-status-neutral">Loading shops…</p>
            ) : filteredShops.length === 0 ? (
              <p className="px-2.5 py-2 text-[11px] text-status-neutral">No shops found</p>
            ) : (
              filteredShops.map((shop) => {
                const selected = activeShopId === shop.id;
                return (
                  <button
                    key={shop.id}
                    onClick={() => {
                      setActiveShop(shop);
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 rounded-[10px] px-2.5 py-2 text-left text-xs transition-colors hover:bg-rose-50 ${
                      selected ? 'bg-rose-100' : ''
                    }`}
                  >
                    <Check className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100 text-brand-berry' : 'opacity-0'}`} />
                    <span className="flex flex-col min-w-0">
                      <span className={`truncate font-bold ${selected ? 'text-brand-berry' : 'text-ink'}`}>{shop.name}</span>
                      <span className="truncate text-[10px] text-status-neutral">
                        {shop.branch_code} · {shop.city}
                        {!shop.is_active && ' · Inactive'}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
