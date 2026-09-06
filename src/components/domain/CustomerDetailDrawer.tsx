import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Bell, Ban, CheckCircle2, MapPin, Clock, Package } from 'lucide-react';
import { DetailDrawer } from '../layout/DetailDrawer';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Tabs } from '../common/Tabs';
import { queryKeys } from '../../services/queryKeys';
import { customerService } from '../../services/customerService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

type DrawerTab = 'orders' | 'addresses' | 'activity';

export const CustomerDetailDrawer: React.FC<{ customerId: string | null; onClose: () => void }> = ({ customerId, onClose }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DrawerTab>('orders');
  const [walletModal, setWalletModal] = useState<'credit' | 'debit' | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');

  const { data: customer } = useQuery({
    queryKey: queryKeys.customers.detail(customerId ?? ''),
    queryFn: () => customerService.getDetail(customerId!),
    enabled: !!customerId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: queryKeys.customers.orders(customerId ?? ''),
    queryFn: () => customerService.getOrders(customerId!),
    enabled: !!customerId && tab === 'orders',
  });

  const { data: addresses = [] } = useQuery({
    queryKey: queryKeys.customers.addresses(customerId ?? ''),
    queryFn: () => customerService.getAddresses(customerId!),
    enabled: !!customerId && tab === 'addresses',
  });

  const { data: timeline = [] } = useQuery({
    queryKey: queryKeys.customers.timeline(customerId ?? ''),
    queryFn: () => customerService.getTimeline(customerId!),
    enabled: !!customerId && tab === 'activity',
  });

  const invalidateDetail = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId ?? '') });
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });

  const walletMutation = useMutation({
    mutationFn: () => walletModal === 'credit'
      ? customerService.creditWallet(customerId!, Number(walletAmount), walletDesc || undefined)
      : customerService.debitWallet(customerId!, Number(walletAmount), walletDesc || undefined),
    onSuccess: () => { invalidateDetail(); invalidateList(); setWalletModal(null); setWalletAmount(''); setWalletDesc(''); },
  });

  const notifyMutation = useMutation({
    mutationFn: () => customerService.sendNotification(customerId!, notifyTitle, notifyBody),
    onSuccess: () => { setNotifyOpen(false); setNotifyTitle(''); setNotifyBody(''); },
  });

  const blockMutation = useMutation({
    mutationFn: () => customerService.toggleBlock(customerId!, !customer?.is_blocked),
    onSuccess: () => { invalidateDetail(); invalidateList(); },
  });

  return (
    <>
      <DetailDrawer isOpen={!!customerId} onClose={onClose} title={customer?.name ?? 'Customer'} subtitle={customer?.phone} width="xl">
        {customer && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
                <p className="text-[10px] font-bold text-status-neutral uppercase">Wallet</p>
                <p className="font-mono-num font-bold text-brand-berry">₹{customer.wallet_balance.toFixed(2)}</p>
              </div>
              <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
                <p className="text-[10px] font-bold text-status-neutral uppercase">Lifetime Spend</p>
                <p className="font-mono-num font-bold text-ink">₹{customer.total_spent.toFixed(2)}</p>
              </div>
              <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
                <p className="text-[10px] font-bold text-status-neutral uppercase">Orders</p>
                <p className="font-mono-num font-bold text-ink">{customer.order_count} ({customer.completed_orders} done)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={<Wallet className="w-3.5 h-3.5" />} onClick={() => setWalletModal('credit')}>Credit Wallet</Button>
              <Button variant="outline" size="sm" icon={<Wallet className="w-3.5 h-3.5" />} onClick={() => setWalletModal('debit')}>Debit Wallet</Button>
              <Button variant="outline" size="sm" icon={<Bell className="w-3.5 h-3.5" />} onClick={() => setNotifyOpen(true)}>Notify</Button>
              <Button
                variant={customer.is_blocked ? 'primary' : 'danger'}
                size="sm"
                icon={customer.is_blocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                isLoading={blockMutation.isPending}
                onClick={() => blockMutation.mutate()}
              >
                {customer.is_blocked ? 'Unblock' : 'Block'}
              </Button>
              {customer.is_blocked && <Badge variant="danger">Blocked</Badge>}
            </div>

            <Tabs
              tabs={[{ id: 'orders', label: 'Orders' }, { id: 'addresses', label: 'Addresses' }, { id: 'activity', label: 'Activity' }]}
              activeTab={tab}
              onChange={(id) => setTab(id as DrawerTab)}
            />

            {tab === 'orders' && (
              <div className="space-y-2">
                {orders.length === 0 ? <p className="text-xs text-status-neutral">No orders yet.</p> : orders.map((o) => (
                  <div key={o.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                    <div>
                      <p className="font-mono-num font-bold text-ink">{o.order_number}</p>
                      <p className="text-[11px] text-status-neutral">{new Date(o.created_at).toLocaleDateString('en-IN')} · {o.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-num font-bold text-brand-berry">₹{Number(o.total_payable).toFixed(2)}</p>
                      <Badge variant="info" size="sm">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'addresses' && (
              <div className="space-y-2">
                {addresses.length === 0 ? <p className="text-xs text-status-neutral">No saved addresses.</p> : addresses.map((a) => (
                  <div key={a.id} className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-ink"><MapPin className="w-3 h-3 text-brand-berry" /> {a.label} {a.is_default && <Badge variant="brand" size="sm">Default</Badge>}</div>
                    <p className="text-[11px] text-status-neutral mt-0.5">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city}, {a.state} {a.pincode}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-2">
                {timeline.length === 0 ? <p className="text-xs text-status-neutral">No activity recorded.</p> : timeline.map((e, i) => (
                  <div key={i} className="flex gap-2 p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                    <Clock className="w-3.5 h-3.5 text-brand-berry shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-ink">{e.eventType.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-status-neutral">{new Date(e.eventAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <Modal isOpen={!!walletModal} onClose={() => setWalletModal(null)} title={walletModal === 'credit' ? 'Credit Wallet' : 'Debit Wallet'} maxWidth="sm"
        footer={<>
          <Button variant="outline" onClick={() => setWalletModal(null)}>Cancel</Button>
          <Button variant="primary" isLoading={walletMutation.isPending} disabled={!walletAmount} onClick={() => walletMutation.mutate()}>Confirm</Button>
        </>}
      >
        {walletMutation.error && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(walletMutation.error as Error).message}</p>}
        <div className="space-y-3">
          <div><label className={labelClass}>Amount (₹)</label><input type="number" className={inputClass} value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} /></div>
          <div><label className={labelClass}>Description</label><input className={inputClass} value={walletDesc} onChange={(e) => setWalletDesc(e.target.value)} placeholder={walletModal === 'credit' ? 'Admin credit' : 'Amount deducted by company'} /></div>
        </div>
      </Modal>

      <Modal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)} title="Send Notification" maxWidth="sm"
        footer={<>
          <Button variant="outline" onClick={() => setNotifyOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={notifyMutation.isPending} disabled={!notifyTitle || !notifyBody} onClick={() => notifyMutation.mutate()}>Send</Button>
        </>}
      >
        {notifyMutation.error && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(notifyMutation.error as Error).message}</p>}
        <div className="space-y-3">
          <div><label className={labelClass}>Title</label><input className={inputClass} value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} /></div>
          <div><label className={labelClass}>Message</label><textarea className={inputClass} rows={3} value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} /></div>
        </div>
      </Modal>
    </>
  );
};
