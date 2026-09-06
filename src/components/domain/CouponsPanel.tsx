import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag, BarChart3 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import { couponService, Coupon, CouponInput, DiscountType, CouponTargetType, CashbackCreditTrigger } from '../../services/couponService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const emptyForm: CouponInput = {
  code: '', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0, perUserLimit: 1,
  targetType: 'ALL', cashbackCreditTrigger: 'ORDER_DELIVERED',
};

const formatDiscount = (c: Coupon) => {
  switch (c.discountType) {
    case 'PERCENTAGE': return `${c.discountValue}% off`;
    case 'FLAT': return `₹${c.discountValue} off`;
    case 'CASHBACK': return `₹${c.discountValue} cashback`;
    case 'FREE_DELIVERY': return 'Free delivery';
  }
};

export const CouponsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);
  const [analyticsTarget, setAnalyticsTarget] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: queryKeys.coupons.list(),
    queryFn: couponService.getCoupons,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.coupons.analytics(analyticsTarget?.id ?? ''),
    queryFn: () => couponService.getAnalytics(analyticsTarget!.id),
    enabled: !!analyticsTarget,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
  const createMutation = useMutation({ mutationFn: (i: CouponInput) => couponService.createCoupon(i), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) => couponService.updateCoupon(id, input), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => couponService.deleteCoupon(id), onSuccess: () => { invalidate(); setPendingDelete(null); } });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description ?? undefined, discountType: c.discountType, discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount ?? undefined, usageLimit: c.usageLimit ?? undefined,
      perUserLimit: c.perUserLimit, validFrom: c.validFrom ?? undefined, validUntil: c.validUntil ?? undefined,
      targetType: c.targetType, cashbackCreditTrigger: c.cashbackCreditTrigger, grantsFreeDelivery: c.grantsFreeDelivery, isActive: c.isActive,
    });
    setFormOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<Coupon>[] = [
    { header: 'Code', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">{row.code}</span> },
    { header: 'Discount', cell: (row) => <span>{formatDiscount(row)}</span> },
    { header: 'Min Order', cell: (row) => <span className="font-mono-num">₹{row.minOrderAmount.toFixed(0)}</span> },
    { header: 'Target', cell: (row) => <Badge variant="info" size="sm">{row.targetType}</Badge> },
    { header: 'Usage', cell: (row) => <span className="font-mono-num">{row.usedCount}{row.usageLimit ? ` / ${row.usageLimit}` : ''}</span> },
    { header: 'Status', cell: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<BarChart3 className="w-3.5 h-3.5" />} onClick={() => setAnalyticsTarget(row)}>Stats</Button>
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card title="Coupons" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<Tag className="w-3 h-3" />}>{coupons.length} Coupons</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Coupon</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={coupons} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No coupons configured yet." />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Coupon' : 'New Coupon'} maxWidth="lg"
        footer={<>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} disabled={!form.code || !form.discountValue}
            onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}>
            {editing ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </>}
      >
        {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(saveError as Error).message}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Coupon Code</label>
            <input className={inputClass + ' font-mono-num'} value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className={labelClass}>Discount Type</label>
            <select className={inputClass} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat ₹</option>
              <option value="CASHBACK">Cashback</option>
              <option value="FREE_DELIVERY">Free Delivery</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Description</label>
            <input className={inputClass} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div><label className={labelClass}>Discount Value</label><input type="number" className={inputClass} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Max Discount Cap (₹)</label><input type="number" className={inputClass} value={form.maxDiscount ?? ''} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Min Order Amount (₹)</label><input type="number" className={inputClass} value={form.minOrderAmount ?? 0} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Total Usage Limit</label><input type="number" className={inputClass} value={form.usageLimit ?? ''} onChange={(e) => setForm({ ...form, usageLimit: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Per-User Limit</label><input type="number" className={inputClass} value={form.perUserLimit ?? 1} onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })} /></div>
          <div>
            <label className={labelClass}>Target Audience</label>
            <select className={inputClass} value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as CouponTargetType })}>
              <option value="ALL">All Customers</option>
              <option value="FIRST_TIME">First-Time Customers</option>
              <option value="SEGMENT">Customer Segment</option>
              <option value="INDIVIDUAL">Individual (targeted)</option>
            </select>
          </div>
          <div><label className={labelClass}>Valid From</label><input type="date" className={inputClass} value={form.validFrom ? form.validFrom.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, validFrom: e.target.value || undefined })} /></div>
          <div><label className={labelClass}>Valid Until</label><input type="date" className={inputClass} value={form.validUntil ? form.validUntil.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, validUntil: e.target.value || undefined })} /></div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="cp-fd" checked={form.grantsFreeDelivery ?? false} onChange={(e) => setForm({ ...form, grantsFreeDelivery: e.target.checked })} /><label htmlFor="cp-fd" className="text-xs font-bold text-ink">Also grants free delivery</label></div>
          {editing && <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="cp-active" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="cp-active" className="text-xs font-bold text-ink">Active</label></div>}
        </div>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete Coupon" maxWidth="sm"
        footer={<><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Delete</Button></>}>
        <p className="text-sm text-ink">Delete <span className="font-mono-num font-bold">{pendingDelete?.code}</span>? This cannot be undone.</p>
      </Modal>

      <Modal isOpen={!!analyticsTarget} onClose={() => setAnalyticsTarget(null)} title={`Analytics: ${analyticsTarget?.code}`} maxWidth="md">
        {analyticsLoading ? <p className="text-xs text-status-neutral">Loading…</p> : analytics && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-rose-50/60 rounded-[12px] border border-border"><p className="text-[10px] font-bold text-status-neutral uppercase">Total Redemptions</p><p className="font-mono-num font-bold text-ink mt-0.5">{analytics.totalRedemptions}</p></div>
            <div className="p-3 bg-rose-50/60 rounded-[12px] border border-border"><p className="text-[10px] font-bold text-status-neutral uppercase">Revenue Generated</p><p className="font-mono-num font-bold text-brand-berry mt-0.5">₹{analytics.revenueGenerated.toFixed(2)}</p></div>
            <div className="p-3 bg-rose-50/60 rounded-[12px] border border-border"><p className="text-[10px] font-bold text-status-neutral uppercase">Avg Order Value</p><p className="font-mono-num font-bold text-ink mt-0.5">₹{analytics.avgOrderValue.toFixed(2)}</p></div>
            <div className="p-3 bg-rose-50/60 rounded-[12px] border border-border"><p className="text-[10px] font-bold text-status-neutral uppercase">Avg Discount</p><p className="font-mono-num font-bold text-ink mt-0.5">₹{analytics.avgDiscount.toFixed(2)}</p></div>
          </div>
        )}
      </Modal>
    </Card>
  );
};
