import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProductPicker } from '../components/procurement/ProductPicker';
import { useCreateInHouseSupply } from '../hooks/useProcurement';
import { queryKeys } from '../services/queryKeys';
import { shopManagementService } from '../services/shopManagementService';
import { formatMoney } from '../utils/procurementStatus';
import type { AdminProduct } from '../types/product.types';
import type { QuantityUnit } from '../types/procurement.types';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 disabled:bg-muted/40';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const UNITS: QuantityUnit[] = ['KG', 'PC', 'PACK', 'LTR'];

let nextLineKey = 1;

interface PurchaseLine {
  key: string;
  product_id: string;
  item_name: string;
  category_name?: string | null;
  unit: QuantityUnit;
  quantity: number;
  unit_price: number;
}

function emptyLine(): PurchaseLine {
  return {
    key: `in-house-line-${nextLineKey++}`,
    product_id: '',
    item_name: '',
    category_name: null,
    unit: 'KG',
    quantity: 1,
    unit_price: 0,
  };
}

/** Master catalog units are lowercase and broader than procurement's four units. */
function mapMasterUnit(unit: string | null | undefined): QuantityUnit {
  switch ((unit ?? '').toLowerCase()) {
    case 'kg':
    case 'g':
      return 'KG';
    case 'l':
    case 'ml':
      return 'LTR';
    case 'piece':
    case 'pc':
    case 'dozen':
      return 'PC';
    case 'pack':
    case 'box':
      return 'PACK';
    default:
      return 'KG';
  }
}

export default function InHousePurchaseCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateInHouseSupply();

  const shopsQuery = useQuery({
    queryKey: queryKeys.shops.list(),
    queryFn: shopManagementService.getShops,
  });
  const shops = shopsQuery.data ?? [];

  const [shopId, setShopId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([emptyLine()]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (line.product_id ? line.quantity * line.unit_price : 0), 0),
    [lines]
  );

  const validLines = lines.filter((line) => line.product_id);

  function updateLine(key: string, patch: Partial<PurchaseLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function handleProductSelect(key: string, product: AdminProduct) {
    updateLine(key, {
      product_id: product.id,
      item_name: product.name,
      category_name: product.category_name,
      unit: mapMasterUnit(product.unit),
      // Cost is the right default for a purchase, never the retail price.
      unit_price: Number(product.cost_price ?? 0),
    });
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
  }

  async function handleSubmit() {
    if (!shopId) {
      toast.error('Select the store receiving this purchase');
      return;
    }
    if (validLines.length === 0) {
      toast.error('Add at least one catalog product');
      return;
    }
    if (validLines.some((line) => !(line.quantity > 0))) {
      toast.error('Every line needs a quantity greater than zero');
      return;
    }
    if (validLines.some((line) => line.unit_price < 0 || Number.isNaN(line.unit_price))) {
      toast.error('Unit cost cannot be negative');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        shop_id: shopId,
        in_house_supplier_name: supplierName.trim() || undefined,
        items: validLines.map((line) => ({
          product_id: line.product_id,
          item_name: line.item_name || undefined,
          quantity: line.quantity,
          unit: line.unit,
          unit_price: line.unit_price,
        })),
      });
      navigate(`/procurement/supplies/${created.id}`);
    } catch {
      // The mutation hook already surfaces the backend message as a toast.
    }
  }

  return (
    <div>
      <PageHeader
        title="Record In-house Purchase"
        subtitle="No vendor quote or award — record what the store bought, attach a quality video, then receive stock."
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/procurement/supplies?source=IN_HOUSE')}
          >
            Back to Supply Orders
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="space-y-4 min-w-0">
          <Card title="Purchase details" padding="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="in-house-shop">Store *</label>
                <select
                  id="in-house-shop"
                  className={inputClass}
                  value={shopId}
                  onChange={(event) => setShopId(event.target.value)}
                  disabled={shopsQuery.isLoading}
                >
                  <option value="">{shopsQuery.isLoading ? 'Loading stores…' : 'Select store…'}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} · {shop.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="in-house-supplier">Supplier / source (optional)</label>
                <input
                  id="in-house-supplier"
                  className={inputClass}
                  placeholder="e.g. Local market, own farm"
                  maxLength={200}
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-status-neutral">
              This creates a supply order with no vendor. Vendor lists, ratings and performance stay untouched.
            </p>
          </Card>

          <Card
            title="Items"
            subtitle="Pick exact catalog SKUs so receipt can move stock into inventory."
            padding="md"
            action={
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                Add line
              </Button>
            }
          >
            <div className="space-y-3">
              {lines.map((line, index) => {
                const lineTotal = line.product_id ? line.quantity * line.unit_price : 0;
                return (
                  <div key={line.key} className="rounded-[12px] border border-border p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-status-neutral">
                        Line {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-status-danger disabled:opacity-40"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length === 1}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-4">
                        <label className={labelClass} htmlFor={`in-house-product-${line.key}`}>Product (SKU) *</label>
                        <ProductPicker
                          id={`in-house-product-${line.key}`}
                          value={
                            line.product_id
                              ? { id: line.product_id, name: line.item_name, categoryName: line.category_name }
                              : null
                          }
                          onSelect={(product) => handleProductSelect(line.key, product)}
                          onClear={() =>
                            updateLine(line.key, {
                              product_id: '',
                              item_name: '',
                              category_name: null,
                              unit_price: 0,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass} htmlFor={`in-house-qty-${line.key}`}>Quantity *</label>
                        <input
                          id={`in-house-qty-${line.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          className={inputClass}
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.key, { quantity: Number(event.target.value) })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass} htmlFor={`in-house-unit-${line.key}`}>Unit</label>
                        <select
                          id={`in-house-unit-${line.key}`}
                          className={inputClass}
                          value={line.unit}
                          onChange={(event) =>
                            updateLine(line.key, { unit: event.target.value as QuantityUnit })
                          }
                        >
                          {UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass} htmlFor={`in-house-cost-${line.key}`}>Unit cost (₹) *</label>
                        <input
                          id={`in-house-cost-${line.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          className={inputClass}
                          value={line.unit_price}
                          onChange={(event) =>
                            updateLine(line.key, { unit_price: Number(event.target.value) })
                          }
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col justify-end">
                        <span className={labelClass}>Line total</span>
                        <span className="text-xs font-bold text-ink pb-2">{formatMoney(lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Summary" padding="md">
            <div className="space-y-2 text-xs">
              <Row label="Store" value={shops.find((shop) => shop.id === shopId)?.name ?? 'Not selected'} />
              <Row label="Supplier" value={supplierName.trim() || 'In-house'} />
              <Row label="Lines" value={String(validLines.length)} />
              <div className="border-t border-border my-2" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-status-neutral">Purchase total</span>
                <span className="text-lg font-black text-ink">{formatMoney(total)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              isLoading={createMutation.isPending}
              onClick={handleSubmit}
              disabled={!shopId || validLines.length === 0}
            >
              Record purchase
            </Button>
          </Card>

          <Card title="What happens next" padding="md">
            <ol className="space-y-2 text-[11px] leading-5 text-ink-2">
              <li><strong className="text-ink">1. Recorded.</strong> The order opens with an In-house badge.</li>
              <li><strong className="text-ink">2. Attach video.</strong> Upload a video or paste a direct video link.</li>
              <li><strong className="text-ink">3. Mark arrived.</strong> Then confirm receipt — video is required.</li>
            </ol>
            <p className="mt-3 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
              Confirming receipt is blocked until a quality video exists. Accepted stock then moves into inventory and the store's sellable stock.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-bold text-status-neutral uppercase">{label}</dt>
      <dd className="text-xs text-ink text-right">{value}</dd>
    </div>
  );
}
