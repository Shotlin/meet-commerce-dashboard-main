import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Tag, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import {
  abandonedCartService, AbandonedCart, ReminderInput, IssueCouponInput,
} from '../../services/abandonedCartService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const statCard = (label: string, value: string, tone: 'ink' | 'success' | 'berry' = 'ink') => (
  <div className="p-3 bg-rose-50/60 rounded-[12px] border border-border">
    <p className="text-[10px] font-bold text-status-neutral uppercase">{label}</p>
    <p className={`font-mono-num font-bold mt-0.5 ${tone === 'success' ? 'text-status-success' : tone === 'berry' ? 'text-brand-berry' : 'text-ink'}`}>
      {value}
    </p>
  </div>
);

const emptyReminder: ReminderInput = { title: 'Still thinking it over?', body: 'Your cart is waiting — complete your order before items sell out.' };
const emptyCoupon: IssueCouponInput = { code: '', discountType: 'PERCENTAGE', discountValue: 10, perUserLimit: 1 };

export const AbandonedCartsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [reminderTarget, setReminderTarget] = useState<AbandonedCart | null>(null);
  const [reminderForm, setReminderForm] = useState<ReminderInput>(emptyReminder);
  const [couponTarget, setCouponTarget] = useState<AbandonedCart | null>(null);
  const [couponForm, setCouponForm] = useState<IssueCouponInput>(emptyCoupon);

  const { data: summary } = useQuery({
    queryKey: queryKeys.abandonedCarts.summary(),
    queryFn: abandonedCartService.getSummary,
  });

  const { data: carts = [], isLoading, error } = useQuery({
    queryKey: queryKeys.abandonedCarts.list({ status: 'OPEN' }),
    queryFn: () => abandonedCartService.getCarts('OPEN'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.abandonedCarts.all });
  };

  const reminderMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReminderInput }) => abandonedCartService.sendReminder(id, input),
    onSuccess: () => { invalidate(); setReminderTarget(null); },
  });

  const couponMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: IssueCouponInput }) => abandonedCartService.issueCoupon(id, input),
    onSuccess: () => { invalidate(); setCouponTarget(null); },
  });

  const openReminder = (cart: AbandonedCart) => { setReminderTarget(cart); setReminderForm(emptyReminder); };
  const openCoupon = (cart: AbandonedCart) => {
    setCouponTarget(cart);
    setCouponForm({ ...emptyCoupon, code: `COMEBACK${cart.userPhone.slice(-4)}` });
  };

  const columns: Column<AbandonedCart>[] = [
    { header: 'Customer', cell: (row) => (
      <div>
        <p className="font-bold text-ink">{row.userName}</p>
        <p className="text-[11px] text-status-neutral">{row.userPhone}</p>
      </div>
    ) },
    { header: 'Cart Value', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.cartValue.toFixed(2)}</span> },
    { header: 'Items', cell: (row) => <span>{row.itemCount} ({row.totalQuantity} qty)</span> },
    { header: 'Priority', cell: (row) => <span className="font-mono-num">{row.priorityScore.toFixed(1)}</span> },
    { header: 'Abandoned At', cell: (row) => <span className="text-[11px] text-status-neutral">{new Date(row.abandonedAt).toLocaleString('en-IN')}</span> },
    { header: 'Reminders', cell: (row) => <Badge variant={row.reminderCount > 0 ? 'info' : 'neutral'} size="sm">{row.reminderCount} sent</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={() => openReminder(row)}>Remind</Button>
        <Button variant="ghost" size="sm" icon={<Tag className="w-3.5 h-3.5" />} onClick={() => openCoupon(row)}>Coupon</Button>
      </div>
    ) },
  ];

  return (
    <Card title="Abandoned Cart Recovery Engine" action={<Badge variant="brand" icon={<ShoppingCart className="w-3 h-3" />}>{summary?.openCount ?? 0} Open</Badge>}>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {statCard('Open Value', `₹${summary.openValue.toFixed(0)}`, 'berry')}
          {statCard('Avg Cart Value', `₹${summary.avgCartValue.toFixed(0)}`)}
          {statCard('Recovered Today', String(summary.recoveredToday), 'success')}
          {statCard('7-Day Recovery Rate', `${(summary.recoveryRate7d * 100).toFixed(1)}%`, 'success')}
        </div>
      )}

      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load abandoned carts: {(error as Error).message}</p>
      ) : (
        <Table columns={columns} data={carts} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No open abandoned carts right now." />
      )}

      <Modal
        isOpen={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        title="Send Recovery Reminder"
        subtitle={reminderTarget ? `To ${reminderTarget.userName} (${reminderTarget.userPhone})` : undefined}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setReminderTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              icon={<Send className="w-3.5 h-3.5" />}
              isLoading={reminderMutation.isPending}
              disabled={!reminderForm.title || !reminderForm.body}
              onClick={() => reminderTarget && reminderMutation.mutate({ id: reminderTarget.id, input: reminderForm })}
            >
              Send Reminder
            </Button>
          </>
        }
      >
        {reminderMutation.error && (
          <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
            {(reminderMutation.error as Error).message}
          </p>
        )}
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Notification Title</label>
            <input className={inputClass} value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea className={inputClass} rows={3} value={reminderForm.body} onChange={(e) => setReminderForm({ ...reminderForm, body: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!couponTarget}
        onClose={() => setCouponTarget(null)}
        title="Issue Recovery Coupon"
        subtitle={couponTarget ? `Targeted to ${couponTarget.userName} only` : undefined}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCouponTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              icon={<Tag className="w-3.5 h-3.5" />}
              isLoading={couponMutation.isPending}
              disabled={!couponForm.code || !couponForm.discountValue}
              onClick={() => couponTarget && couponMutation.mutate({ id: couponTarget.id, input: couponForm })}
            >
              Issue Coupon
            </Button>
          </>
        }
      >
        {couponMutation.error && (
          <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
            {(couponMutation.error as Error).message}
          </p>
        )}
        {couponMutation.isSuccess && couponMutation.data && (
          <p className="text-xs text-status-success bg-status-success/10 border border-status-success/30 rounded-[10px] p-2.5 mb-3">
            Coupon <span className="font-mono-num font-bold">{couponMutation.data.code}</span> issued.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Coupon Code</label>
            <input className={inputClass + ' font-mono-num'} value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className={labelClass}>Discount Type</label>
            <select className={inputClass} value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as IssueCouponInput['discountType'] })}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat ₹</option>
              <option value="FREE_DELIVERY">Free Delivery</option>
              <option value="CASHBACK">Cashback</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Discount Value</label>
            <input type="number" className={inputClass} value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelClass}>Min Order Amount (₹)</label>
            <input type="number" className={inputClass} value={couponForm.minOrderAmount ?? ''} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelClass}>Max Discount Cap (₹)</label>
            <input type="number" className={inputClass} value={couponForm.maxDiscount ?? ''} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </div>
      </Modal>
    </Card>
  );
};
