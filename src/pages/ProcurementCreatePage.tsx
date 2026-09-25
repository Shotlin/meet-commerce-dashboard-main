import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { Stepper } from '../components/common/Stepper';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCreateProcurementRequest, useEligibleVendorPreview, usePublishProcurementRequest } from '../hooks/useProcurement';
import { useAdminCategories } from '../hooks/useCategoriesAdmin';
import { shopManagementService } from '../services/shopManagementService';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import type { ProcurementMode, QuantityUnit, RequestItemInput } from '../types/procurement.types';

const STEPS = [
  { id: 'store', title: 'Store & Mode', description: 'Destination store and procurement mode' },
  { id: 'items', title: 'Items', description: 'Products, quantities and specs' },
  { id: 'terms', title: 'Terms & Schedule', description: 'Commercial terms and deadlines' },
  { id: 'review', title: 'Review & Publish', description: 'Vendor preview and confirmation' },
];

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

interface DraftState {
  shop_id: string;
  mode: ProcurementMode;
  title: string;
  required_delivery_at: string;
  response_deadline: string;
  notes: string;
  quality_instructions: string;
  items: RequestItemInput[];
}

const EMPTY_ITEM: RequestItemInput = {
  category_id: '',
  item_name: '',
  requested_quantity: 1,
  unit: 'KG',
  fixed_unit_price: undefined,
};

export default function ProcurementCreatePage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  const [draft, setDraft] = useState<DraftState>({
    shop_id: '',
    mode: 'RFQ',
    title: '',
    required_delivery_at: '',
    response_deadline: '',
    notes: '',
    quality_instructions: '',
    items: [{ ...EMPTY_ITEM }],
  });

  const shopsQuery = useQuery({ queryKey: queryKeys.shops.list(), queryFn: shopManagementService.getShops });
  const categoriesQuery = useAdminCategories();

  const createMutation = useCreateProcurementRequest();
  const publishMutation = usePublishProcurementRequest();
  const previewMutation = useEligibleVendorPreview();

  const offerTotal = useMemo(() => {
    if (draft.mode !== 'FIXED_OFFER') return null;
    return draft.items.reduce(
      (sum, item) => sum + (item.fixed_unit_price ?? 0) * (item.requested_quantity || 0),
      0
    );
  }, [draft.mode, draft.items]);

  const selectedItemCategories = draft.items.map((item) => item.category_id).filter(Boolean);

  const canLeaveStore = Boolean(draft.shop_id) && Boolean(draft.title.trim());
  const canLeaveItems = draft.items.every((item) => item.category_id && item.item_name && item.requested_quantity > 0);
  const canLeaveTerms =
    Boolean(draft.required_delivery_at) &&
    Boolean(draft.response_deadline) &&
    (draft.mode === 'RFQ' || draft.items.every((item) => (item.fixed_unit_price ?? 0) >= 0));

  const stepValidity = [canLeaveStore, canLeaveItems, canLeaveTerms, true];

  function updateDraft(patch: Partial<DraftState>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateItem(index: number, patch: Partial<RequestItemInput>) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function handlePreview() {
    if (!draft.shop_id) return;
    await previewMutation.mutateAsync({
      shop_id: draft.shop_id,
      items: selectedItemCategories.map((category_id) => ({ category_id })),
    });
  }

  async function handleCreate(publish: boolean) {
    const created = await createMutation.mutateAsync({
      shop_id: draft.shop_id,
      mode: draft.mode,
      title: draft.title.trim(),
      required_delivery_at: new Date(draft.required_delivery_at).toISOString(),
      response_deadline: new Date(draft.response_deadline).toISOString(),
      notes: draft.notes || undefined,
      quality_instructions: draft.quality_instructions || undefined,
      items: draft.items,
    });
    if (publish && created?.id) {
      await publishMutation.mutateAsync(created.id);
    }
    navigate(`/procurement/${created.id}`);
  }

  return (
    <div>
      <PageHeader
        title="Create Requirement"
        subtitle="Publish a stock requirement to eligible vendors"
        actions={
          <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/procurement')}>
            Back to Procurement
          </Button>
        }
      />

      <Stepper steps={STEPS} currentStepIndex={stepIndex} onStepClick={(idx) => setStepIndex(idx)} />

      {stepIndex === 0 && (
        <Card title="Store & procurement mode" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="store">Store *</label>
              <select
                id="store"
                className={inputClass}
                value={draft.shop_id}
                onChange={(e) => updateDraft({ shop_id: e.target.value })}
              >
                <option value="">Select store…</option>
                {(shopsQuery.data ?? []).map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} — {shop.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="title">Requirement title *</label>
              <input
                id="title"
                className={inputClass}
                placeholder="e.g. Weekly fresh meat restock"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Procurement mode *</label>
              <div className="flex gap-3">
                {(['RFQ', 'FIXED_OFFER'] as ProcurementMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateDraft({ mode })}
                    className={`flex-1 rounded-[12px] border p-3 text-left transition-colors ${
                      draft.mode === mode ? 'border-brand-raspberry bg-brand-raspberry/5' : 'border-border bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-ink">
                      {mode === 'RFQ' ? 'RFQ — vendor quotations' : 'Fixed Offer — first accept wins'}
                    </div>
                    <div className="text-[11px] text-muted mt-1">
                      {mode === 'RFQ'
                        ? 'Vendors submit item-level quotes; you compare and award manually.'
                        : 'You set the exact offer; the first eligible vendor to accept wins.'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {stepIndex === 1 && (
        <Card
          title="Items"
          subtitle="What does the store need?"
          padding="md"
          action={
            <Button size="sm" variant="secondary" onClick={() => updateDraft({ items: [...draft.items, { ...EMPTY_ITEM }] })}>
              Add Item
            </Button>
          }
        >
          <div className="space-y-4">
            {draft.items.map((item, index) => (
              <div key={index} className="rounded-[12px] border border-border p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-ink">Item {index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => updateDraft({ items: draft.items.filter((_, i) => i !== index) })}
                    disabled={draft.items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass} htmlFor={`item-name-${index}`}>Item name *</label>
                    <input
                      id={`item-name-${index}`}
                      className={inputClass}
                      placeholder="e.g. Chicken"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, { item_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`item-category-${index}`}>Category *</label>
                    <select
                      id={`item-category-${index}`}
                      className={inputClass}
                      value={item.category_id}
                      onChange={(e) => updateItem(index, { category_id: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {(categoriesQuery.data ?? []).map((category: { id: string; name: string }) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`item-qty-${index}`}>Quantity *</label>
                    <input
                      id={`item-qty-${index}`}
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={item.requested_quantity}
                      onChange={(e) => updateItem(index, { requested_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`item-unit-${index}`}>Unit</label>
                    <select
                      id={`item-unit-${index}`}
                      className={inputClass}
                      value={item.unit}
                      onChange={(e) => updateItem(index, { unit: e.target.value as QuantityUnit })}
                    >
                      {(['KG', 'PC', 'PACK', 'LTR'] as QuantityUnit[]).map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  {draft.mode === 'FIXED_OFFER' && (
                    <div className="col-span-2">
                      <label className={labelClass} htmlFor={`item-price-${index}`}>Fixed unit price (₹) *</label>
                      <input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        value={item.fixed_unit_price ?? ''}
                        onChange={(e) => updateItem(index, { fixed_unit_price: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stepIndex === 2 && (
        <Card title="Terms & schedule" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="required-by">Required delivery *</label>
              <input
                id="required-by"
                type="datetime-local"
                className={inputClass}
                value={draft.required_delivery_at}
                onChange={(e) => updateDraft({ required_delivery_at: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="response-deadline">
                {draft.mode === 'FIXED_OFFER' ? 'Offer expiry *' : 'Quote deadline *'}
              </label>
              <input
                id="response-deadline"
                type="datetime-local"
                className={inputClass}
                value={draft.response_deadline}
                onChange={(e) => updateDraft({ response_deadline: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="quality">Quality / cut / cleaning instructions</label>
              <textarea
                id="quality"
                className={inputClass}
                rows={3}
                placeholder="e.g. Skinless curry cut, cleaned, ice-packed"
                value={draft.quality_instructions}
                onChange={(e) => updateDraft({ quality_instructions: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="notes">Notes to vendors</label>
              <textarea
                id="notes"
                className={inputClass}
                rows={2}
                value={draft.notes}
                onChange={(e) => updateDraft({ notes: e.target.value })}
              />
            </div>
            {draft.mode === 'FIXED_OFFER' && (
              <div className="md:col-span-2 rounded-[12px] bg-brand-raspberry/5 border border-brand-raspberry/20 p-3">
                <span className="text-xs font-bold text-ink">Total offer value: </span>
                <span className="text-xs text-ink">₹{(offerTotal ?? 0).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {stepIndex === 3 && (
        <Card title="Review & publish" padding="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[11px] font-bold text-muted uppercase">Store</div>
                <div className="text-ink font-semibold">{shopsQuery.data?.find((s) => s.id === draft.shop_id)?.name ?? '—'}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted uppercase">Mode</div>
                <div className="text-ink font-semibold">{draft.mode === 'RFQ' ? 'RFQ' : 'Fixed Offer'}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted uppercase">Items</div>
                <div className="text-ink font-semibold">{draft.items.length}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted uppercase">Offer total</div>
                <div className="text-ink font-semibold">
                  {draft.mode === 'FIXED_OFFER' ? `₹${(offerTotal ?? 0).toLocaleString('en-IN')}` : 'Vendor quoted'}
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink">Eligible vendor preview</span>
                <Button size="sm" variant="secondary" isLoading={previewMutation.isPending} onClick={handlePreview}>
                  Refresh preview
                </Button>
              </div>
              {previewMutation.data ? (
                <div className="flex items-center gap-2">
                  <Badge variant="success">{previewMutation.data.eligible_count} eligible</Badge>
                  <Badge variant="neutral">{previewMutation.data.rejected.length} excluded</Badge>
                  {previewMutation.data.eligible_count === 0 && (
                    <span className="text-[11px] text-danger font-semibold">
                      No eligible vendors — check targeting before publishing.
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted">
                  Run the preview to see how many vendors match this store's area and categories.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                isLoading={createMutation.isPending}
                onClick={() => handleCreate(false)}
                disabled={!stepValidity.every(Boolean)}
              >
                Save as Draft
              </Button>
              <Button
                isLoading={createMutation.isPending || publishMutation.isPending}
                onClick={() => handleCreate(true)}
                disabled={!stepValidity.every(Boolean) || (previewMutation.data?.eligible_count === 0)}
              >
                Create & Publish
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="ghost" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0}>
          Previous
        </Button>
        <Button
          onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={stepIndex === STEPS.length - 1 || !stepValidity[stepIndex]}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
