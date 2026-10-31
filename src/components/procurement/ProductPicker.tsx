import { useState } from 'react';
import { Search } from 'lucide-react';

import { useAdminProducts } from '../../hooks/useProductsAdmin';
import { useDebounce } from '../../hooks/useDebounce';
import type { AdminProduct } from '../../types/product.types';

interface ProductPickerProps {
  id?: string;
  value?: { id: string; name: string; categoryName?: string | null } | null;
  placeholder?: string;
  disabled?: boolean;
  onSelect: (product: AdminProduct) => void;
  onClear: () => void;
}

/**
 * Search-and-select one exact catalog SKU. Mirrors the picker on the vendor
 * requirement form so an in-house purchase line is tied to the same product
 * identity the rest of procurement uses.
 */
export function ProductPicker({
  id,
  value,
  placeholder = 'Search catalog…',
  disabled = false,
  onSelect,
  onClear,
}: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useAdminProducts({
    search: debouncedSearch || undefined,
    limit: 20,
  });
  const products = data?.products ?? [];

  if (value?.id) {
    return (
      <div className="flex items-center justify-between rounded-[10px] border border-border bg-muted/30 px-3 py-2 text-xs">
        <span className="truncate font-semibold text-ink">{value.name}</span>
        <button
          type="button"
          className="ml-2 shrink-0 text-[11px] font-semibold text-status-info disabled:opacity-50"
          onClick={onClear}
          disabled={disabled}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-status-neutral" />
        <input
          id={id}
          className="w-full border-0 p-0 text-xs focus:outline-none focus:ring-0 disabled:bg-transparent"
          placeholder={placeholder}
          value={search}
          disabled={disabled}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-border bg-white shadow-lg">
          {isLoading ? (
            <div className="p-2 text-[11px] text-status-neutral">Searching…</div>
          ) : products.length === 0 ? (
            <div className="p-2 text-[11px] text-status-neutral">
              {search ? 'No products found' : 'Type to search the catalog…'}
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/40"
                onClick={() => {
                  onSelect(product);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <span className="truncate font-medium text-ink">{product.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-status-neutral">
                  {product.sku ? `${product.sku} · ` : ''}
                  {product.category_name ?? '—'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
