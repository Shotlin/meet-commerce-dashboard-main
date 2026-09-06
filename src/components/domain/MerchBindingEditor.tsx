import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { catalogPickerService, ProductOption } from '../../services/catalogPickerService';
import { MerchBinding } from '../../services/sectionService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const money = (v: number | string | null | undefined) => (v == null ? '' : `₹${Number(v).toFixed(0)}`);

export const MerchBindingEditor: React.FC<{
  binding: MerchBinding;
  onChange: (next: MerchBinding) => void;
}> = ({ binding, onChange }) => {
  const [productQuery, setProductQuery] = useState('');
  const [boundProducts, setBoundProducts] = useState<Record<string, ProductOption>>({});

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-picker', 'categories'],
    queryFn: catalogPickerService.listCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['catalog-picker', 'products', productQuery],
    queryFn: () => catalogPickerService.searchProducts(productQuery, 20),
  });

  // Resolve names for already-bound product ids not present in the current
  // search results (e.g. right after opening the editor).
  useEffect(() => {
    const missing = (binding.product_ids ?? []).filter((id) => !boundProducts[id]);
    if (missing.length === 0) return;
    catalogPickerService.getProductsByIds(missing).then((rows) => {
      setBoundProducts((prev) => {
        const next = { ...prev };
        rows.forEach((p) => { next[p.id] = p; });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding.product_ids]);

  const categoryIds = binding.category_ids ?? [];
  const productIds = binding.product_ids ?? [];
  const tags = binding.tags ?? [];

  const toggleCategory = (id: string) => {
    const next = categoryIds.includes(id) ? categoryIds.filter((c) => c !== id) : [...categoryIds, id];
    onChange({ ...binding, category_ids: next });
  };

  const toggleProduct = (product: ProductOption) => {
    setBoundProducts((prev) => ({ ...prev, [product.id]: product }));
    const next = productIds.includes(product.id) ? productIds.filter((p) => p !== product.id) : [...productIds, product.id];
    onChange({ ...binding, product_ids: next });
  };

  return (
    <div className="space-y-4 p-3 bg-rose-50/60 border border-border rounded-[12px]">
      <p className="text-[11px] font-bold text-ink uppercase tracking-wide">Merch Binding — which products/categories this section pulls from</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Source</label>
          <select className={inputClass} value={binding.source ?? 'category'} onChange={(e) => onChange({ ...binding, source: e.target.value as MerchBinding['source'] })}>
            <option value="category">Category</option>
            <option value="tag">Tag</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Limit</label>
          <input type="number" min={1} max={50} className={inputClass} value={binding.limit ?? ''} onChange={(e) => onChange({ ...binding, limit: e.target.value === '' ? 0 : Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Categories ({categoryIds.length} selected)</label>
        <div className="max-h-32 overflow-y-auto border border-border rounded-[10px] bg-white p-2 space-y-1">
          {categories.length === 0 ? (
            <p className="text-[11px] text-status-neutral p-1">Loading categories…</p>
          ) : categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-xs px-1 py-0.5 hover:bg-rose-50 rounded cursor-pointer">
              <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
              <span className="text-ink">{c.name}</span>
              <span className="text-[10px] text-status-neutral ml-auto">{c.product_count} items</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Products ({productIds.length} selected)</label>
        {productIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {productIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 text-[11px] bg-white border border-border rounded-full px-2 py-1">
                {boundProducts[id]?.name ?? id.slice(0, 8)}
                <button type="button" onClick={() => toggleProduct(boundProducts[id] ?? { id, name: id, thumbnail_url: null, price: 0, sale_price: null })} className="text-status-danger">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-status-neutral" />
          <input className={`${inputClass} pl-8`} placeholder="Search products by name…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
        </div>
        <div className="max-h-32 overflow-y-auto border border-border rounded-[10px] bg-white p-2 mt-1.5 space-y-1">
          {searching ? (
            <p className="text-[11px] text-status-neutral p-1">Searching…</p>
          ) : searchResults.length === 0 ? (
            <p className="text-[11px] text-status-neutral p-1">No products found.</p>
          ) : searchResults.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-xs px-1 py-0.5 hover:bg-rose-50 rounded cursor-pointer">
              <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p)} />
              <span className="text-ink truncate flex-1">{p.name}</span>
              <span className="text-[10px] text-status-neutral font-mono-num">{money(p.sale_price ?? p.price)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          className={inputClass}
          value={tags.join(', ')}
          onChange={(e) => onChange({ ...binding, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
        />
      </div>
    </div>
  );
};
