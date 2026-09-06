import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { queryKeys } from '../../services/queryKeys';
import { returnRequestService, OrderLookup, ReturnScope, RefundDestination } from '../../services/returnRequestService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

export const CreateReturnModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [orderQuery, setOrderQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderLookup | null>(null);
  const [scope, setScope] = useState<ReturnScope>('FULL_ORDER');
  const [selectedItemIndexes, setSelectedItemIndexes] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState<RefundDestination>('WALLET');

  const reset = () => {
    setOrderQuery('');
    setSelectedOrder(null);
    setScope('FULL_ORDER');
    setSelectedItemIndexes([]);
    setReason('');
    setDestination('WALLET');
  };

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: queryKeys.returns.orderSearch(orderQuery),
    queryFn: () => returnRequestService.searchOrders(orderQuery, 10),
    enabled: !selectedOrder && orderQuery.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: () => returnRequestService.create({
      orderId: selectedOrder!.id,
      scope,
      itemIndexes: scope === 'ITEMS' ? selectedItemIndexes : undefined,
      reason,
      refundDestination: destination,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
      reset();
      onClose();
    },
  });

  const toggleItem = (idx: number) => {
    setSelectedItemIndexes((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  // Client-side estimate only — the server always recomputes and stores the
  // authoritative amount from the real order at creation time.
  const estimatedAmount = selectedOrder
    ? scope === 'FULL_ORDER'
      ? Number(selectedOrder.total_payable)
      : selectedItemIndexes.reduce((sum, idx) => sum + (selectedOrder.items[idx]?.total ?? 0), 0)
    : 0;

  const canSubmit = !!selectedOrder && reason.trim().length >= 3 && (scope === 'FULL_ORDER' || selectedItemIndexes.length > 0);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Return / Refund Request"
      subtitle={selectedOrder ? `Order ${selectedOrder.order_number}` : 'Search for the order this return is against'}
      maxWidth="lg"
      footer={
        selectedOrder ? (
          <>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
            <Button variant="primary" onClick={() => createMutation.mutate()} isLoading={createMutation.isPending} disabled={!canSubmit}>
              File Return Request
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        )
      }
    >
      {!selectedOrder ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-status-neutral" />
            <input className={`${inputClass} pl-8`} placeholder="Search by order number, customer name, or phone…" value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {searching ? (
              <p className="text-xs text-status-neutral p-2">Searching…</p>
            ) : orderQuery.length < 2 ? (
              <p className="text-xs text-status-neutral p-2">Type at least 2 characters to search.</p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-status-neutral p-2">No orders found.</p>
            ) : searchResults.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className="w-full text-left p-2.5 border border-border rounded-[10px] hover:border-brand-raspberry hover:bg-rose-50/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{o.order_number}</span>
                  <Badge variant={o.status === 'DELIVERED' ? 'success' : 'neutral'} size="sm">{o.status}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-status-neutral">
                  <span>{o.customer_name ?? o.customer_phone}</span>
                  <span className="font-mono-num font-bold text-ink">₹{Number(o.total_payable).toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedOrder.status !== 'DELIVERED' && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              This order is "{selectedOrder.status}" — only DELIVERED orders can be returned. Submitting will fail server-side.
            </p>
          )}
          {createMutation.error && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(createMutation.error as Error).message}
            </p>
          )}

          <div>
            <label className={labelClass}>Scope</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="radio" checked={scope === 'FULL_ORDER'} onChange={() => setScope('FULL_ORDER')} /> Full order
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="radio" checked={scope === 'ITEMS'} onChange={() => setScope('ITEMS')} /> Specific items
              </label>
            </div>
          </div>

          {scope === 'ITEMS' && (
            <div className="space-y-1.5">
              <label className={labelClass}>Select Items ({selectedItemIndexes.length} selected)</label>
              {selectedOrder.items.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 text-xs p-2 border border-border rounded-[10px] cursor-pointer hover:bg-rose-50/50">
                  <input type="checkbox" checked={selectedItemIndexes.includes(idx)} onChange={() => toggleItem(idx)} />
                  <span className="flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-mono-num font-bold text-ink">₹{item.total.toFixed(2)}</span>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className={labelClass}>Reason</label>
            <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being returned?" />
          </div>

          <div>
            <label className={labelClass}>Refund Destination</label>
            <select className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value as RefundDestination)}>
              <option value="WALLET">Wallet Credit</option>
              <option value="RAZORPAY">Original Payment Method (Razorpay)</option>
            </select>
          </div>

          <div className="p-3 bg-rose-50/70 border border-border rounded-[12px] flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Estimated Refund Amount</span>
            <span className="font-mono-num font-bold text-brand-berry text-sm">₹{estimatedAmount.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-status-neutral -mt-2">The server always recomputes the exact amount from the real order when this request is filed — this is an estimate.</p>
        </div>
      )}
    </Modal>
  );
};
