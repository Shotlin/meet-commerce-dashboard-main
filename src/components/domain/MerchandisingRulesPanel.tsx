import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Gift, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import {
  merchandisingService, CartMilestone, CartMilestoneInput, FirstTimeOffer, FirstTimeOfferInput,
  MilestoneRewardType, OfferRewardType, ApplicableUserType, CashbackCreditTrigger, PaymentMethodScope,
} from '../../services/merchandisingService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const emptyMilestone: CartMilestoneInput = {
  name: '', minCartAmount: 500, rewardType: 'CASHBACK', rewardValue: 20, applicableUserType: 'ALL',
  stackableWithCoupon: true, priority: 0, cashbackCreditTrigger: 'ORDER_DELIVERED',
};

const emptyOffer: FirstTimeOfferInput = {
  name: '', minOrderAmount: 0, rewardType: 'PERCENTAGE_DISCOUNT', rewardValue: 15, autoApply: true,
  paymentMethodScope: 'ALL', cashbackCreditTrigger: 'ORDER_DELIVERED', grantsFreeDelivery: false,
};

const CartMilestonesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CartMilestone | null>(null);
  const [form, setForm] = useState<CartMilestoneInput>(emptyMilestone);
  const [pendingDelete, setPendingDelete] = useState<CartMilestone | null>(null);

  const { data: milestones = [], isLoading, error } = useQuery({
    queryKey: queryKeys.merchandising.cartMilestones(),
    queryFn: merchandisingService.getMilestones,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.merchandising.cartMilestones() });
  const createMutation = useMutation({ mutationFn: (i: CartMilestoneInput) => merchandisingService.createMilestone(i), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CartMilestoneInput> }) => merchandisingService.updateMilestone(id, input), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => merchandisingService.deleteMilestone(id), onSuccess: () => { invalidate(); setPendingDelete(null); } });

  const openCreate = () => { setEditing(null); setForm(emptyMilestone); setFormOpen(true); };
  const openEdit = (m: CartMilestone) => {
    setEditing(m);
    setForm({
      name: m.name, minCartAmount: m.minCartAmount, rewardType: m.rewardType, rewardValue: m.rewardValue ?? undefined,
      maxDiscount: m.maxDiscount ?? undefined, messageBefore: m.messageBefore ?? undefined, messageAfter: m.messageAfter ?? undefined,
      isActive: m.isActive, applicableUserType: m.applicableUserType, stackableWithCoupon: m.stackableWithCoupon,
      priority: m.priority, cashbackCreditTrigger: m.cashbackCreditTrigger, usageLimitPerUser: m.usageLimitPerUser,
    });
    setFormOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<CartMilestone>[] = [
    { header: 'Milestone', cell: (row) => <span className="font-bold text-ink">{row.name}</span> },
    { header: 'Threshold', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.minCartAmount.toFixed(0)}+</span> },
    { header: 'Reward', cell: (row) => (
      <span>{row.rewardType === 'CASHBACK' ? `₹${row.rewardValue} cashback` : row.rewardType === 'FLAT_DISCOUNT' ? `₹${row.rewardValue} off` : 'Coupon unlock'}</span>
    ) },
    { header: 'Stacks w/ Coupon', cell: (row) => <Badge variant={row.stackableWithCoupon ? 'success' : 'neutral'} size="sm">{row.stackableWithCoupon ? 'Yes' : 'No'}</Badge> },
    { header: 'Status', cell: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card title="Cart Milestones (Spend More, Save More)" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<Gift className="w-3 h-3" />}>{milestones.length} Rules</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Milestone</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={milestones} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No cart milestones configured yet." />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Milestone' : 'New Milestone'} maxWidth="lg"
        footer={<>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} disabled={!form.name || !form.minCartAmount}
            onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}>
            {editing ? 'Save Changes' : 'Create Milestone'}
          </Button>
        </>}
      >
        {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(saveError as Error).message}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={labelClass}>Min Cart Amount (₹)</label><input type="number" className={inputClass} value={form.minCartAmount} onChange={(e) => setForm({ ...form, minCartAmount: Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Priority</label><input type="number" className={inputClass} value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
          <div>
            <label className={labelClass}>Reward Type</label>
            <select className={inputClass} value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value as MilestoneRewardType })}>
              <option value="CASHBACK">Cashback</option>
              <option value="FLAT_DISCOUNT">Flat Discount</option>
              <option value="COUPON_UNLOCK">Coupon Unlock</option>
            </select>
          </div>
          <div><label className={labelClass}>Reward Value (₹)</label><input type="number" className={inputClass} value={form.rewardValue ?? ''} onChange={(e) => setForm({ ...form, rewardValue: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Message Before</label><input className={inputClass} value={form.messageBefore ?? ''} onChange={(e) => setForm({ ...form, messageBefore: e.target.value })} placeholder="Add ₹X more to unlock..." /></div>
          <div><label className={labelClass}>Message After</label><input className={inputClass} value={form.messageAfter ?? ''} onChange={(e) => setForm({ ...form, messageAfter: e.target.value })} placeholder="Reward unlocked!" /></div>
          <div>
            <label className={labelClass}>Applicable To</label>
            <select className={inputClass} value={form.applicableUserType} onChange={(e) => setForm({ ...form, applicableUserType: e.target.value as ApplicableUserType })}>
              <option value="ALL">All Customers</option>
              <option value="FIRST_TIME">First-Time Only</option>
              <option value="SEGMENT">Segment</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Cashback Credited On</label>
            <select className={inputClass} value={form.cashbackCreditTrigger} onChange={(e) => setForm({ ...form, cashbackCreditTrigger: e.target.value as CashbackCreditTrigger })}>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="ORDER_CONFIRMED">Order Confirmed</option>
              <option value="ORDER_DELIVERED">Order Delivered</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="ms-stack" checked={form.stackableWithCoupon ?? false} onChange={(e) => setForm({ ...form, stackableWithCoupon: e.target.checked })} /><label htmlFor="ms-stack" className="text-xs font-bold text-ink">Stackable with coupon</label></div>
          {editing && <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="ms-active" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="ms-active" className="text-xs font-bold text-ink">Active</label></div>}
        </div>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete Milestone" maxWidth="sm"
        footer={<><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Delete</Button></>}>
        <p className="text-sm text-ink">Delete <span className="font-bold">{pendingDelete?.name}</span>? This cannot be undone.</p>
      </Modal>
    </Card>
  );
};

const FirstTimeOffersSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FirstTimeOffer | null>(null);
  const [form, setForm] = useState<FirstTimeOfferInput>(emptyOffer);
  const [pendingDelete, setPendingDelete] = useState<FirstTimeOffer | null>(null);

  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: queryKeys.merchandising.firstTimeOffers(),
    queryFn: merchandisingService.getFirstTimeOffers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.merchandising.firstTimeOffers() });
  const createMutation = useMutation({ mutationFn: (i: FirstTimeOfferInput) => merchandisingService.createFirstTimeOffer(i), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<FirstTimeOfferInput> }) => merchandisingService.updateFirstTimeOffer(id, input), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => merchandisingService.deleteFirstTimeOffer(id), onSuccess: () => { invalidate(); setPendingDelete(null); } });

  const openCreate = () => { setEditing(null); setForm(emptyOffer); setFormOpen(true); };
  const openEdit = (o: FirstTimeOffer) => {
    setEditing(o);
    setForm({
      name: o.name, minOrderAmount: o.minOrderAmount, rewardType: o.rewardType, rewardValue: o.rewardValue ?? undefined,
      maxDiscount: o.maxDiscount ?? undefined, isActive: o.isActive, autoApply: o.autoApply,
      paymentMethodScope: o.paymentMethodScope, cashbackCreditTrigger: o.cashbackCreditTrigger, grantsFreeDelivery: o.grantsFreeDelivery,
    });
    setFormOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<FirstTimeOffer>[] = [
    { header: 'Offer', cell: (row) => <span className="font-bold text-ink">{row.name}</span> },
    { header: 'Reward', cell: (row) => (
      <span>{row.rewardType === 'PERCENTAGE_DISCOUNT' ? `${row.rewardValue}% off` : row.rewardType === 'FLAT_DISCOUNT' ? `₹${row.rewardValue} off` : row.rewardType === 'FREE_DELIVERY' ? 'Free delivery' : row.rewardType === 'WALLET_CASHBACK' ? `₹${row.rewardValue} cashback` : 'Coupon unlock'}</span>
    ) },
    { header: 'Min Order', cell: (row) => <span className="font-mono-num">₹{row.minOrderAmount.toFixed(0)}</span> },
    { header: 'Auto-Apply', cell: (row) => <Badge variant={row.autoApply ? 'success' : 'neutral'} size="sm">{row.autoApply ? 'Yes' : 'No'}</Badge> },
    { header: 'Status', cell: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card title="First-Time Customer Offers" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<Sparkles className="w-3 h-3" />}>{offers.length} Offers</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Offer</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={offers} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No first-time offers configured yet." />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Offer' : 'New First-Time Offer'} maxWidth="lg"
        footer={<>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} disabled={!form.name}
            onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}>
            {editing ? 'Save Changes' : 'Create Offer'}
          </Button>
        </>}
      >
        {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(saveError as Error).message}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <label className={labelClass}>Reward Type</label>
            <select className={inputClass} value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value as OfferRewardType })}>
              <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
              <option value="FLAT_DISCOUNT">Flat Discount</option>
              <option value="FREE_DELIVERY">Free Delivery</option>
              <option value="WALLET_CASHBACK">Wallet Cashback</option>
              <option value="COUPON_UNLOCK">Coupon Unlock</option>
            </select>
          </div>
          <div><label className={labelClass}>Reward Value</label><input type="number" className={inputClass} value={form.rewardValue ?? ''} onChange={(e) => setForm({ ...form, rewardValue: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Min Order Amount (₹)</label><input type="number" className={inputClass} value={form.minOrderAmount ?? 0} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} /></div>
          <div><label className={labelClass}>Max Discount Cap (₹)</label><input type="number" className={inputClass} value={form.maxDiscount ?? ''} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          <div>
            <label className={labelClass}>Payment Method Scope</label>
            <select className={inputClass} value={form.paymentMethodScope} onChange={(e) => setForm({ ...form, paymentMethodScope: e.target.value as PaymentMethodScope })}>
              <option value="ALL">All Methods</option>
              <option value="ONLINE_ONLY">Online Only</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Cashback Credited On</label>
            <select className={inputClass} value={form.cashbackCreditTrigger} onChange={(e) => setForm({ ...form, cashbackCreditTrigger: e.target.value as CashbackCreditTrigger })}>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="ORDER_CONFIRMED">Order Confirmed</option>
              <option value="ORDER_DELIVERED">Order Delivered</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="fto-auto" checked={form.autoApply ?? true} onChange={(e) => setForm({ ...form, autoApply: e.target.checked })} /><label htmlFor="fto-auto" className="text-xs font-bold text-ink">Auto-apply at checkout</label></div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="fto-fd" checked={form.grantsFreeDelivery ?? false} onChange={(e) => setForm({ ...form, grantsFreeDelivery: e.target.checked })} /><label htmlFor="fto-fd" className="text-xs font-bold text-ink">Also grants free delivery</label></div>
          {editing && <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="fto-active" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="fto-active" className="text-xs font-bold text-ink">Active</label></div>}
        </div>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete Offer" maxWidth="sm"
        footer={<><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Delete</Button></>}>
        <p className="text-sm text-ink">Delete <span className="font-bold">{pendingDelete?.name}</span>? This cannot be undone.</p>
      </Modal>
    </Card>
  );
};

export const MerchandisingRulesPanel: React.FC = () => (
  <div className="space-y-4">
    <CartMilestonesSection />
    <FirstTimeOffersSection />
  </div>
);
