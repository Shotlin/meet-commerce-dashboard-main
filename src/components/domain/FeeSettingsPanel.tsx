import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Pencil, Store, Calculator, RefreshCw } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { queryKeys } from '../../services/queryKeys';
import {
  feeSettingsService, FeeSettings, FeeSettingsInput, FeePreview,
} from '../../services/feeSettingsService';

type FieldType = 'boolean' | 'number' | 'text' | 'select';
interface FieldDef {
  key: keyof FeeSettings;
  label: string;
  type: FieldType;
  unit?: string;
  options?: { value: string; label: string }[];
  nullable?: boolean;
}
interface SectionDef { title: string; fields: FieldDef[] }

const FEE_TYPE_OPTIONS = [{ value: 'FLAT', label: 'Flat (₹)' }, { value: 'PERCENT', label: 'Percent (%)' }];

const SECTIONS: SectionDef[] = [
  {
    title: 'Delivery',
    fields: [
      { key: 'delivery_fee_enabled', label: 'Delivery Fee Enabled', type: 'boolean' },
      { key: 'min_delivery_fee', label: 'Min Delivery Fee', type: 'number', unit: '₹' },
      { key: 'base_distance_km', label: 'Included Base Distance', type: 'number', unit: 'km' },
      { key: 'per_km_fee', label: 'Per-KM Fee (beyond base)', type: 'number', unit: '₹' },
      { key: 'max_delivery_distance_km', label: 'Max Delivery Distance', type: 'number', unit: 'km', nullable: true },
      { key: 'free_delivery_enabled', label: 'Free Delivery Enabled', type: 'boolean' },
      { key: 'free_delivery_above', label: 'Free Delivery Above', type: 'number', unit: '₹', nullable: true },
    ],
  },
  {
    title: 'Handling Fee',
    fields: [
      { key: 'handling_fee_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'handling_fee_type', label: 'Fee Type', type: 'select', options: FEE_TYPE_OPTIONS },
      { key: 'handling_fee_value', label: 'Value', type: 'number' },
      { key: 'handling_fee_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'handling_fee_description', label: 'Description', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Platform Fee',
    fields: [
      { key: 'platform_fee_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'platform_fee_type', label: 'Fee Type', type: 'select', options: FEE_TYPE_OPTIONS },
      { key: 'platform_fee_value', label: 'Value', type: 'number' },
      { key: 'platform_fee_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'platform_fee_description', label: 'Description', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Small Cart Fee',
    fields: [
      { key: 'small_cart_fee_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'small_cart_threshold', label: 'Threshold', type: 'number', unit: '₹' },
      { key: 'small_cart_fee', label: 'Fee', type: 'number', unit: '₹' },
      { key: 'small_cart_fee_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'small_cart_fee_description', label: 'Description', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Surge Fee',
    fields: [
      { key: 'surge_fee_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'surge_fee_value', label: 'Value', type: 'number', unit: '₹' },
      { key: 'surge_fee_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'surge_fee_description', label: 'Description', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Packaging Fee',
    fields: [
      { key: 'packaging_fee_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'packaging_fee_value', label: 'Value', type: 'number', unit: '₹' },
      { key: 'packaging_fee_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'packaging_fee_description', label: 'Description', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Delivery Time & Quick Delivery',
    fields: [
      { key: 'delivery_eta_minutes', label: 'Standard ETA', type: 'number', unit: 'min' },
      { key: 'quick_delivery_surcharge_enabled', label: 'Quick Delivery Enabled', type: 'boolean' },
      { key: 'quick_delivery_surcharge_amount', label: 'Quick Delivery Surcharge', type: 'number', unit: '₹' },
      { key: 'quick_delivery_surcharge_label', label: 'Customer-Facing Label', type: 'text' },
      { key: 'quick_delivery_eta_minutes', label: 'Quick Delivery ETA', type: 'number', unit: 'min' },
    ],
  },
  {
    title: 'GST',
    fields: [
      { key: 'gst_enabled', label: 'Enabled', type: 'boolean' },
      { key: 'gst_rate', label: 'Rate', type: 'number', unit: '%' },
      { key: 'gst_label', label: 'Customer-Facing Label', type: 'text' },
    ],
  },
];

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const FeeSettingsForm: React.FC<{ value: FeeSettingsInput; onChange: (next: FeeSettingsInput) => void }> = ({ value, onChange }) => {
  const setField = (key: keyof FeeSettings, v: unknown) => onChange({ ...value, [key]: v });
  const raw = value as Record<string, unknown>;

  return (
    <div className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h4 className="text-xs font-bold text-brand-berry uppercase tracking-wider mb-2">{section.title}</h4>
          <div className="grid grid-cols-2 gap-3">
            {section.fields.map((f) => {
              const v = raw[f.key];
              if (f.type === 'boolean') {
                return (
                  <div key={f.key} className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" id={f.key} checked={!!v} onChange={(e) => setField(f.key, e.target.checked)} />
                    <label htmlFor={f.key} className="text-xs font-bold text-ink">{f.label}</label>
                  </div>
                );
              }
              if (f.type === 'select') {
                return (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <select className={inputClass} value={(v as string) ?? ''} onChange={(e) => setField(f.key, e.target.value)}>
                      {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                );
              }
              if (f.type === 'number') {
                return (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}{f.unit ? ` (${f.unit})` : ''}</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={v == null ? '' : (v as number)}
                      onChange={(e) => setField(f.key, e.target.value === '' ? (f.nullable ? null : 0) : Number(e.target.value))}
                    />
                  </div>
                );
              }
              return (
                <div key={f.key}>
                  <label className={labelClass}>{f.label}</label>
                  <input
                    className={inputClass}
                    value={(v as string) ?? ''}
                    onChange={(e) => setField(f.key, e.target.value === '' && f.nullable ? null : e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const summaryRow = (label: string, value: React.ReactNode) => (
  <div className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[12px] border border-border">
    <span className="font-bold text-ink">{label}</span>
    <span className="font-mono-num font-bold text-brand-berry">{value}</span>
  </div>
);

export const FeeSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [globalFormOpen, setGlobalFormOpen] = useState(false);
  const [globalForm, setGlobalForm] = useState<FeeSettingsInput>({});
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [shopFormOpen, setShopFormOpen] = useState(false);
  const [shopForm, setShopForm] = useState<FeeSettingsInput>({});
  const [previewInput, setPreviewInput] = useState({ subtotal: '500', distanceKm: '3' });
  const [previewResult, setPreviewResult] = useState<FeePreview | null>(null);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: queryKeys.feeSettings.global(),
    queryFn: feeSettingsService.getGlobal,
  });

  const { data: shops = [] } = useQuery({
    queryKey: queryKeys.shopsBasic.list(),
    queryFn: feeSettingsService.listShopsBasic,
  });

  const { data: shopSettings, isFetching: shopSettingsLoading } = useQuery({
    queryKey: queryKeys.feeSettings.shopOverride(selectedShopId),
    queryFn: () => feeSettingsService.getForShop(selectedShopId),
    enabled: !!selectedShopId,
  });

  const updateGlobalMutation = useMutation({
    mutationFn: (input: FeeSettingsInput) => feeSettingsService.updateGlobal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeSettings.global() });
      setGlobalFormOpen(false);
    },
  });

  const updateShopMutation = useMutation({
    mutationFn: ({ shopId, input }: { shopId: string; input: FeeSettingsInput }) => feeSettingsService.updateShop(shopId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeSettings.shopOverride(selectedShopId) });
      setShopFormOpen(false);
    },
  });

  const previewMutation = useMutation({
    mutationFn: (input: { subtotal: number; distanceKm?: number; shopId?: string }) => feeSettingsService.preview(input),
    onSuccess: (data) => setPreviewResult(data),
  });

  const openGlobalEdit = () => {
    if (!settings) return;
    setGlobalForm(settings);
    setGlobalFormOpen(true);
  };

  const openShopEdit = () => {
    if (!shopSettings) return;
    setShopForm(shopSettings);
    setShopFormOpen(true);
  };

  const runPreview = () => {
    const subtotal = Number(previewInput.subtotal) || 0;
    const distanceKm = previewInput.distanceKm === '' ? undefined : Number(previewInput.distanceKm);
    previewMutation.mutate({ subtotal, distanceKm, shopId: selectedShopId || undefined });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-xs text-status-neutral">Loading fee settings…</div>;
  }
  if (error || !settings) {
    return <p className="text-xs text-status-danger p-3">Failed to load fee settings: {(error as Error)?.message}</p>;
  }

  return (
    <div className="space-y-4">
      <Card
        title="Live Platform Fee & Delivery Parameters"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="success" icon={<DollarSign className="w-3 h-3" />}>Synced</Badge>
            <Button variant="primary" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={openGlobalEdit}>Edit</Button>
          </div>
        }
      >
        <div className="space-y-2 text-xs">
          {summaryRow('Min Delivery Fee', `₹${settings.min_delivery_fee.toFixed(2)}`)}
          {summaryRow(`Per-KM Fee (beyond ${settings.base_distance_km.toFixed(1)}km)`, `₹${settings.per_km_fee.toFixed(2)}`)}
          {summaryRow('Free Delivery Threshold', settings.free_delivery_enabled ? `₹${(settings.free_delivery_above ?? 0).toFixed(2)}+` : 'Disabled')}
          {summaryRow('Handling Fee', settings.handling_fee_enabled ? `₹${settings.handling_fee_value.toFixed(2)}` : 'Disabled')}
          {summaryRow('Platform Fee', settings.platform_fee_enabled ? `₹${settings.platform_fee_value.toFixed(2)}` : 'Disabled')}
          {summaryRow('GST', settings.gst_enabled ? `${settings.gst_rate.toFixed(1)}%` : 'Disabled')}
        </div>
      </Card>

      <Card
        title="Per-Shop Fee Overrides"
        action={<Badge variant="brand" icon={<Store className="w-3 h-3" />}>{shops.length} Shops</Badge>}
      >
        <div className="flex items-center gap-3 mb-3">
          <select className={inputClass + ' max-w-xs'} value={selectedShopId} onChange={(e) => setSelectedShopId(e.target.value)}>
            <option value="">Select a shop…</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedShopId && (
            <Button variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={openShopEdit} disabled={!shopSettings}>
              Edit Override
            </Button>
          )}
        </div>
        {selectedShopId && (
          shopSettingsLoading ? (
            <p className="text-xs text-status-neutral">Loading…</p>
          ) : shopSettings ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {summaryRow('Min Delivery Fee', `₹${shopSettings.min_delivery_fee.toFixed(2)}`)}
              {summaryRow('Per-KM Fee', `₹${shopSettings.per_km_fee.toFixed(2)}`)}
              {summaryRow('Free Delivery', shopSettings.free_delivery_enabled ? `₹${(shopSettings.free_delivery_above ?? 0).toFixed(2)}+` : 'Disabled')}
              {summaryRow('Source', shopSettings.scope ?? '—')}
            </div>
          ) : null
        )}
      </Card>

      <Card
        title="Preview Fee Breakdown"
        action={<Badge variant="info" icon={<Calculator className="w-3 h-3" />}>Calculator</Badge>}
      >
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className={labelClass}>Cart Subtotal (₹)</label>
            <input className={inputClass} type="number" value={previewInput.subtotal} onChange={(e) => setPreviewInput({ ...previewInput, subtotal: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Distance (km)</label>
            <input className={inputClass} type="number" value={previewInput.distanceKm} onChange={(e) => setPreviewInput({ ...previewInput, distanceKm: e.target.value })} />
          </div>
          <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={runPreview} isLoading={previewMutation.isPending}>
            Calculate
          </Button>
        </div>
        {previewMutation.error && <p className="text-xs text-status-danger mb-2">{(previewMutation.error as Error).message}</p>}
        {previewResult && (
          <div className="space-y-1.5 text-xs">
            {previewResult.fees.map((fee) => (
              <div key={fee.code} className="flex justify-between items-center px-2.5 py-1.5">
                <span className="text-ink">{fee.label}{fee.waived && <span className="text-status-success ml-1.5">(waived)</span>}</span>
                <span className={`font-mono-num ${fee.waived ? 'line-through text-status-neutral' : 'font-bold text-ink'}`}>₹{fee.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center p-2.5 bg-rose-100/60 rounded-[12px] border border-brand-raspberry/20 mt-2">
              <span className="font-bold text-ink">Total Payable</span>
              <span className="font-mono-num font-bold text-brand-berry text-sm">₹{previewResult.totalPayable.toFixed(2)}</span>
            </div>
            {previewResult.freeDelivery.enabled && !previewResult.freeDelivery.unlocked && previewResult.freeDelivery.amountToUnlock > 0 && (
              <p className="text-[11px] text-status-neutral pt-1">Add ₹{previewResult.freeDelivery.amountToUnlock.toFixed(2)} more for free delivery.</p>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={globalFormOpen}
        onClose={() => setGlobalFormOpen(false)}
        title="Edit Global Fee Settings"
        subtitle="Applies platform-wide unless a shop has its own override"
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setGlobalFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => updateGlobalMutation.mutate(globalForm)} isLoading={updateGlobalMutation.isPending}>Save Changes</Button>
          </>
        }
      >
        {updateGlobalMutation.error && (
          <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
            {(updateGlobalMutation.error as Error).message}
          </p>
        )}
        <FeeSettingsForm value={globalForm} onChange={setGlobalForm} />
      </Modal>

      <Modal
        isOpen={shopFormOpen}
        onClose={() => setShopFormOpen(false)}
        title="Edit Shop Fee Override"
        subtitle={shops.find((s) => s.id === selectedShopId)?.name}
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShopFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => selectedShopId && updateShopMutation.mutate({ shopId: selectedShopId, input: shopForm })}
              isLoading={updateShopMutation.isPending}
            >
              Save Override
            </Button>
          </>
        }
      >
        {updateShopMutation.error && (
          <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
            {(updateShopMutation.error as Error).message}
          </p>
        )}
        <FeeSettingsForm value={shopForm} onChange={setShopForm} />
      </Modal>
    </div>
  );
};
