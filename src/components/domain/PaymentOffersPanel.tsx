import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import {
  paymentOfferService,
  PaymentOffer,
  PaymentOfferInput,
  CashbackCreditTrigger,
} from '../../services/paymentOfferService';

const CREDIT_TRIGGERS: CashbackCreditTrigger[] = ['PAYMENT_SUCCESS', 'ORDER_CONFIRMED', 'ORDER_DELIVERED'];

const emptyForm: PaymentOfferInput = {
  title: '',
  description: '',
  provider: '',
  cashbackAmount: 0,
  cashbackPercent: null,
  minOrderAmount: 0,
  maxCashback: null,
  lockThreshold: null,
  isActive: true,
  validFrom: null,
  validUntil: null,
  cashbackCreditTrigger: 'PAYMENT_SUCCESS',
  usageLimitPerUser: null,
};

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

export const PaymentOffersPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentOffer | null>(null);
  const [form, setForm] = useState<PaymentOfferInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<PaymentOffer | null>(null);

  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: queryKeys.paymentOffers.list(),
    queryFn: paymentOfferService.getOffers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentOffers.all });

  const createMutation = useMutation({
    mutationFn: (input: PaymentOfferInput) => paymentOfferService.createOffer(input),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PaymentOfferInput> }) =>
      paymentOfferService.updateOffer(id, input),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentOfferService.deleteOffer(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (offer: PaymentOffer) => {
    setEditing(offer);
    setForm({
      title: offer.title,
      description: offer.description,
      provider: offer.provider,
      cashbackAmount: offer.cashbackAmount,
      cashbackPercent: offer.cashbackPercent,
      minOrderAmount: offer.minOrderAmount,
      maxCashback: offer.maxCashback,
      lockThreshold: offer.lockThreshold,
      isActive: offer.isActive,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      cashbackCreditTrigger: offer.cashbackCreditTrigger,
      usageLimitPerUser: offer.usageLimitPerUser,
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<PaymentOffer>[] = [
    { header: 'Offer', cell: (row) => (
      <div>
        <p className="font-bold text-ink">{row.title}</p>
        <p className="text-[11px] text-status-neutral">{row.provider}</p>
      </div>
    ) },
    { header: 'Cashback', cell: (row) => (
      <span className="font-mono-num font-bold text-brand-berry">
        {row.cashbackPercent != null ? `${row.cashbackPercent}%` : `₹${row.cashbackAmount.toFixed(2)}`}
        {row.maxCashback != null && <span className="text-[10px] text-status-neutral"> (max ₹{row.maxCashback.toFixed(2)})</span>}
      </span>
    ) },
    { header: 'Min Order', cell: (row) => <span className="font-mono-num">₹{row.minOrderAmount.toFixed(2)}</span> },
    { header: 'Status', cell: (row) => (
      <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
    ) },
    { header: 'Valid Until', cell: (row) => (
      <span className="text-[11px] text-status-neutral">
        {row.validUntil ? new Date(row.validUntil).toLocaleDateString('en-IN') : 'No expiry'}
      </span>
    ) },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(row)} icon={<Trash2 className="w-3.5 h-3.5" />} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card
      title="Payment Offers"
      action={
        <div className="flex items-center gap-2">
          <Badge variant="brand" icon={<Tag className="w-3 h-3" />}>{offers.length} Active Rules</Badge>
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Offer</Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load payment offers: {(error as Error).message}</p>
      ) : (
        <Table
          columns={columns}
          data={offers}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyText="No payment offers configured yet."
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Payment Offer' : 'New Payment Offer'}
        subtitle="Bank/wallet cashback rule shown at checkout"
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSaving} disabled={!form.title || !form.provider}>
              {editing ? 'Save Changes' : 'Create Offer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {saveError && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(saveError as Error).message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Provider</label>
              <input className={inputClass} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. HDFC, ICICI, Razorpay" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cashback Amount (₹)</label>
              <input type="number" className={inputClass} value={form.cashbackAmount} onChange={(e) => setForm({ ...form, cashbackAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Cashback Percent (%)</label>
              <input type="number" className={inputClass} value={form.cashbackPercent ?? ''} onChange={(e) => setForm({ ...form, cashbackPercent: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Min Order Amount (₹)</label>
              <input type="number" className={inputClass} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Max Cashback Cap (₹)</label>
              <input type="number" className={inputClass} value={form.maxCashback ?? ''} onChange={(e) => setForm({ ...form, maxCashback: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Lock Threshold (₹)</label>
              <input type="number" className={inputClass} value={form.lockThreshold ?? ''} onChange={(e) => setForm({ ...form, lockThreshold: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Usage Limit / User</label>
              <input type="number" className={inputClass} value={form.usageLimitPerUser ?? ''} onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Valid From</label>
              <input type="date" className={inputClass} value={form.validFrom ? form.validFrom.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, validFrom: e.target.value || null })} />
            </div>
            <div>
              <label className={labelClass}>Valid Until</label>
              <input type="date" className={inputClass} value={form.validUntil ? form.validUntil.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })} />
            </div>
            <div>
              <label className={labelClass}>Cashback Credited On</label>
              <select className={inputClass} value={form.cashbackCreditTrigger} onChange={(e) => setForm({ ...form, cashbackCreditTrigger: e.target.value as CashbackCreditTrigger })}>
                {CREDIT_TRIGGERS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="offer-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="offer-active" className="text-xs font-bold text-ink">Active</label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Payment Offer"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Delete <span className="font-bold">{pendingDelete?.title}</span>? This cannot be undone.
        </p>
        {deleteMutation.error && (
          <p className="text-xs text-status-danger mt-2">{(deleteMutation.error as Error).message}</p>
        )}
      </Modal>
    </Card>
  );
};
