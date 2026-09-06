import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Tabs } from '../components/common/Tabs';
import { LocationPicker } from '../components/domain/LocationPicker';
import { ShopProductsTab } from '../components/products/ShopProductsTab';
import { queryKeys } from '../services/queryKeys';
import {
  shopManagementService,
  Shop,
  ShopStaff,
  ShopUpdateInput,
  ShopStaffCreateInput,
} from '../services/shopManagementService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';
const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v));

type StoreTab = 'overview' | 'service-area' | 'hours' | 'staff' | 'products' | 'financials' | 'transactions';

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const VALID_ROLES: ShopStaff['role'][] = ['SHOP_ADMIN', 'SHOP_MANAGER', 'SHOP_STAFF', 'SHOP_VIEWER'];

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<StoreTab>('overview');

  const shopId = id ?? '';

  const { data: shop, isLoading, error } = useQuery({
    queryKey: queryKeys.shops.detail(shopId),
    queryFn: () => shopManagementService.getShop(shopId),
    enabled: !!shopId,
  });

  const invalidateShop = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops.detail(shopId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops.list() });
  };

  const updateMutation = useMutation({
    mutationFn: (input: ShopUpdateInput) => shopManagementService.updateShop(shopId, input),
    onSuccess: invalidateShop,
  });

  if (isLoading) {
    return <p className="text-xs text-status-neutral p-4">Loading store…</p>;
  }

  if (error || !shop) {
    return (
      <div>
        <Link to="/shops" className="inline-flex items-center gap-1.5 text-xs text-brand-berry font-bold mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shops
        </Link>
        <p className="text-xs text-status-danger">{error ? (error as Error).message : 'Store not found.'}</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/shops" className="inline-flex items-center gap-1.5 text-xs text-brand-berry font-bold mb-3 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Shops
      </Link>

      <PageHeader
        title={shop.name}
        subtitle={`${shop.branch_code} · ${shop.city}, ${shop.state}`}
        badge={
          <div className="flex gap-2">
            <Badge variant={shop.is_active ? 'success' : 'neutral'}>{shop.is_active ? 'Active' : 'Inactive'}</Badge>
            <Badge variant={shop.is_verified ? 'info' : 'warning'}>{shop.is_verified ? 'Verified' : 'Unverified'}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
          <p className="text-[10px] font-bold text-status-neutral uppercase">Total Orders</p>
          <p className="font-mono-num font-bold text-ink">{shop.total_orders}</p>
        </div>
        <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
          <p className="text-[10px] font-bold text-status-neutral uppercase">Total Revenue</p>
          <p className="font-mono-num font-bold text-brand-berry">₹{num(shop.total_revenue).toFixed(2)}</p>
        </div>
        <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
          <p className="text-[10px] font-bold text-status-neutral uppercase">Commission</p>
          <p className="font-mono-num font-bold text-ink">{num(shop.commission_rate).toFixed(1)}%</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'service-area', label: 'Service Area' },
          { id: 'hours', label: 'Hours' },
          { id: 'staff', label: 'Staff' },
          { id: 'products', label: 'Products' },
          { id: 'financials', label: 'Financials' },
          { id: 'transactions', label: 'Transactions' },
        ]}
        activeTab={tab}
        onChange={(t) => setTab(t as StoreTab)}
      />

      {tab === 'overview' && <OverviewTab shop={shop} onSave={(input) => updateMutation.mutateAsync(input)} isSaving={updateMutation.isPending} saveError={updateMutation.error as Error | null} />}
      {tab === 'service-area' && <ServiceAreaTab shop={shop} onSave={(input) => updateMutation.mutateAsync(input)} isSaving={updateMutation.isPending} saveError={updateMutation.error as Error | null} />}
      {tab === 'hours' && <HoursTab shop={shop} onSave={(input) => updateMutation.mutateAsync(input)} isSaving={updateMutation.isPending} saveError={updateMutation.error as Error | null} />}
      {tab === 'staff' && <StaffTab shopId={shopId} />}
      {tab === 'products' && <ShopProductsTab shopId={shopId} shopName={shop.name} />}
      {tab === 'financials' && <FinancialsTab shopId={shopId} />}
      {tab === 'transactions' && <TransactionsTab shopId={shopId} />}
    </div>
  );
};

// ─── Overview ────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  shop: Shop;
  onSave: (input: ShopUpdateInput) => Promise<Shop>;
  isSaving: boolean;
  saveError: Error | null;
}> = ({ shop, onSave, isSaving, saveError }) => {
  const [form, setForm] = useState({
    name: shop.name,
    description: shop.description ?? '',
    phone: shop.phone ?? '',
    email: shop.email ?? '',
    address_line1: shop.address_line1,
    address_line2: shop.address_line2 ?? '',
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    lat: num(shop.lat),
    lng: num(shop.lng),
    gst_number: shop.gst_number ?? '',
    pan_number: shop.pan_number ?? '',
  });

  useEffect(() => {
    setForm({
      name: shop.name,
      description: shop.description ?? '',
      phone: shop.phone ?? '',
      email: shop.email ?? '',
      address_line1: shop.address_line1,
      address_line2: shop.address_line2 ?? '',
      city: shop.city,
      state: shop.state,
      pincode: shop.pincode,
      lat: num(shop.lat),
      lng: num(shop.lng),
      gst_number: shop.gst_number ?? '',
      pan_number: shop.pan_number ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id, shop.updated_at]);

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 space-y-4">
      {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">{saveError.message}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Store Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Description</label>
          <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Address Line 1</label>
          <input className={inputClass} value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Address Line 2</label>
          <input className={inputClass} value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Pincode</label>
          <input className={inputClass} value={form.pincode} maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
        </div>
        <div>
          <label className={labelClass}>GST Number</label>
          <input className={inputClass} value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>PAN Number</label>
          <input className={inputClass} value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Precise Location — drag the pin or click the map to update</label>
          <LocationPicker lat={form.lat} lng={form.lng} radiusKm={num(shop.delivery_radius_km)} onChange={(lat, lng) => setForm({ ...form, lat, lng })} />
          <p className="text-[10px] text-status-neutral mt-1 font-mono-num">{form.lat.toFixed(6)}, {form.lng.toFixed(6)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" isLoading={isSaving} onClick={() => onSave(form)}>Save Changes</Button>
      </div>
    </div>
  );
};

// ─── Service Area ────────────────────────────────────────────────────────

const ServiceAreaTab: React.FC<{
  shop: Shop;
  onSave: (input: ShopUpdateInput) => Promise<Shop>;
  isSaving: boolean;
  saveError: Error | null;
}> = ({ shop, onSave, isSaving, saveError }) => {
  const [radius, setRadius] = useState(num(shop.delivery_radius_km));
  const [pincodeOnly, setPincodeOnly] = useState(shop.pincode_only);
  const [pincodesText, setPincodesText] = useState((shop.serviceable_pincodes ?? []).join(', '));

  useEffect(() => {
    setRadius(num(shop.delivery_radius_km));
    setPincodeOnly(shop.pincode_only);
    setPincodesText((shop.serviceable_pincodes ?? []).join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id, shop.updated_at]);

  const handleSave = () => {
    const serviceable_pincodes = pincodesText.split(',').map((p) => p.trim()).filter(Boolean);
    onSave({ delivery_radius_km: radius, pincode_only: pincodeOnly, serviceable_pincodes });
  };

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 space-y-4">
      {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">{saveError.message}</p>}
      <p className="text-xs text-status-neutral">
        A customer's address is matched to this store either by pincode (the list below) or by straight-line distance from the
        pin (the radius circle). Editing either updates every affected customer's store allocation automatically.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Delivery Radius (km)</label>
          <input type="number" min={0.5} max={100} step={0.5} className={inputClass} value={radius} onChange={(e) => setRadius(Number(e.target.value))} disabled={pincodeOnly} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-xs font-bold text-ink">
            <input type="checkbox" checked={pincodeOnly} onChange={(e) => setPincodeOnly(e.target.checked)} />
            Only match by pincode list (ignore radius)
          </label>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Serviceable Pincodes (comma-separated)</label>
          <input className={inputClass} value={pincodesText} placeholder="e.g. 700001, 700016, 700019" onChange={(e) => setPincodesText(e.target.value)} />
        </div>
        <div className="col-span-2">
          <LocationPicker lat={num(shop.lat)} lng={num(shop.lng)} radiusKm={pincodeOnly ? undefined : radius} onChange={() => {}} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" isLoading={isSaving} onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

// ─── Hours ───────────────────────────────────────────────────────────────

const HoursTab: React.FC<{
  shop: Shop;
  onSave: (input: ShopUpdateInput) => Promise<Shop>;
  isSaving: boolean;
  saveError: Error | null;
}> = ({ shop, onSave, isSaving, saveError }) => {
  const seed = () =>
    DAYS.reduce((acc, { key }) => {
      const existing = shop.operating_hours?.[key];
      acc[key] = existing ?? { open: '09:00', close: '21:00', closed: false };
      return acc;
    }, {} as Record<string, { open: string; close: string; closed?: boolean }>);

  const [hours, setHours] = useState(seed);

  useEffect(() => {
    setHours(seed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id, shop.updated_at]);

  const update = (day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 space-y-3">
      {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">{saveError.message}</p>}
      {DAYS.map(({ key, label }) => {
        const day = hours[key];
        return (
          <div key={key} className="flex items-center gap-3 p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
            <span className="w-24 text-xs font-bold text-ink shrink-0">{label}</span>
            <label className="flex items-center gap-1.5 text-[11px] text-status-neutral shrink-0">
              <input type="checkbox" checked={!day.closed} onChange={(e) => update(key, { closed: !e.target.checked })} />
              Open
            </label>
            <input type="time" className={inputClass} value={day.open} disabled={day.closed} onChange={(e) => update(key, { open: e.target.value })} />
            <span className="text-xs text-status-neutral">to</span>
            <input type="time" className={inputClass} value={day.close} disabled={day.closed} onChange={(e) => update(key, { close: e.target.value })} />
          </div>
        );
      })}
      <div className="flex justify-end pt-2">
        <Button variant="primary" isLoading={isSaving} onClick={() => onSave({ operating_hours: hours })}>Save Changes</Button>
      </div>
    </div>
  );
};

// ─── Staff ───────────────────────────────────────────────────────────────

const StaffTab: React.FC<{ shopId: string }> = ({ shopId }) => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShopStaff | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ShopStaff | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [staffForm, setStaffForm] = useState({ email: '', name: '', phone: '', role: 'SHOP_STAFF' as ShopStaff['role'], is_active: true });

  const { data: staff = [], isLoading, error } = useQuery({
    queryKey: queryKeys.shops.staff(shopId),
    queryFn: () => shopManagementService.getStaff(shopId),
    enabled: !!shopId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.shops.staff(shopId) });

  const createMutation = useMutation({
    mutationFn: (input: ShopStaffCreateInput) => shopManagementService.createStaff(shopId, input),
    onSuccess: (created) => {
      invalidate();
      setFormOpen(false);
      if (created.temp_password) setTempPassword(created.temp_password);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ staffId, is_active }: { staffId: string; is_active: boolean }) =>
      shopManagementService.updateStaff(shopId, staffId, { is_active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => shopManagementService.deleteStaff(shopId, staffId),
    onSuccess: () => { invalidate(); setPendingDelete(null); },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (staffId: string) => shopManagementService.resetStaffPassword(shopId, staffId),
    onSuccess: (result) => setTempPassword(result.temp_password),
  });

  const openCreate = () => {
    setEditing(null);
    setStaffForm({ email: '', name: '', phone: '', role: 'SHOP_STAFF', is_active: true });
    setFormOpen(true);
  };

  const canSave = staffForm.email.trim() && staffForm.name.trim();

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-status-danger p-2">{(error as Error).message}</p>}
      <div className="flex justify-end">
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Staff</Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-status-neutral">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="text-xs text-status-neutral">No staff assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
              <div>
                <p className="font-bold text-ink">{s.user_name ?? 'Unknown'}</p>
                <p className="text-[11px] text-status-neutral">{s.user_email ?? s.user_phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">{s.role}</Badge>
                <button
                  className="text-[10px] text-status-neutral underline"
                  onClick={() => updateMutation.mutate({ staffId: s.id, is_active: !s.is_active })}
                >
                  {s.is_active ? 'Active' : 'Inactive'}
                </button>
                <Button variant="ghost" size="sm" onClick={() => resetPasswordMutation.mutate(s.id)}>Reset PW</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} className="text-status-danger" onClick={() => setPendingDelete(s)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Staff Member"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={createMutation.isPending}
              disabled={!canSave}
              onClick={() =>
                createMutation.mutate({
                  email: staffForm.email.trim(),
                  name: staffForm.name.trim(),
                  phone: staffForm.phone.trim() || undefined,
                  role: staffForm.role,
                  is_active: staffForm.is_active,
                  generate_temp_password: true,
                })
              }
            >
              Add Staff
            </Button>
          </>
        }
      >
        {createMutation.error && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(createMutation.error as Error).message}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Full Name</label>
            <input className={inputClass} value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input className={inputClass} value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Role</label>
            <select className={inputClass} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as ShopStaff['role'] })}>
              {VALID_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Remove Staff Member"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-ink">Remove <span className="font-bold">{pendingDelete?.user_name ?? 'this staff member'}</span> from this store?</p>
        {deleteMutation.error && <p className="text-xs text-status-danger mt-2">{(deleteMutation.error as Error).message}</p>}
      </Modal>

      <Modal
        isOpen={!!tempPassword}
        onClose={() => setTempPassword(null)}
        title="Temporary Password"
        subtitle="Shown once — copy and share it with the staff member securely."
        maxWidth="sm"
        footer={<Button variant="primary" onClick={() => setTempPassword(null)}>Done</Button>}
      >
        <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-[10px] border border-border">
          <span className="font-mono-num font-bold text-ink text-sm">{tempPassword}</span>
          <Button variant="ghost" size="sm" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => tempPassword && navigator.clipboard.writeText(tempPassword)}>Copy</Button>
        </div>
      </Modal>
    </div>
  );
};

// ─── Financials / Transactions (read-only, unchanged from prior drawer) ───

const FinancialsTab: React.FC<{ shopId: string }> = ({ shopId }) => {
  const { data: financials = [], isLoading } = useQuery({
    queryKey: queryKeys.shops.financials(shopId),
    queryFn: () => shopManagementService.getFinancials(shopId),
  });
  if (isLoading) return <p className="text-xs text-status-neutral">Loading…</p>;
  if (financials.length === 0) return <p className="text-xs text-status-neutral">No financial periods recorded yet.</p>;
  return (
    <div className="space-y-2">
      {financials.map((f) => (
        <div key={f.id} className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
          <div className="flex justify-between items-center">
            <p className="font-bold text-ink">{f.period_type} · {new Date(f.period_start).toLocaleDateString('en-IN')} – {new Date(f.period_end).toLocaleDateString('en-IN')}</p>
            <Badge variant={f.payout_status === 'PAID' ? 'success' : 'warning'} size="sm">{f.payout_status}</Badge>
          </div>
          <div className="flex justify-between mt-1.5 font-mono-num">
            <span className="text-status-neutral">Gross ₹{num(f.gross_revenue).toFixed(2)}</span>
            <span className="font-bold text-brand-berry">Payout ₹{num(f.payout_amount).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransactionsTab: React.FC<{ shopId: string }> = ({ shopId }) => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: queryKeys.shops.transactions(shopId),
    queryFn: () => shopManagementService.getTransactions(shopId),
  });
  if (isLoading) return <p className="text-xs text-status-neutral">Loading…</p>;
  if (transactions.length === 0) return <p className="text-xs text-status-neutral">No transactions yet.</p>;
  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div key={t.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
          <div>
            <p className="font-bold text-ink">{t.type.replace(/_/g, ' ')}</p>
            <p className="text-[11px] text-status-neutral">{new Date(t.created_at).toLocaleString('en-IN')}</p>
          </div>
          <span className={`font-mono-num font-bold ${t.direction === 'CREDIT' ? 'text-status-success' : 'text-status-danger'}`}>
            {t.direction === 'CREDIT' ? '+' : '-'}₹{num(t.amount).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};
