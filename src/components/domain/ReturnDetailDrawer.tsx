import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Ban } from 'lucide-react';
import { DetailDrawer } from '../layout/DetailDrawer';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { queryKeys } from '../../services/queryKeys';
import { returnRequestService, ReturnStatus } from '../../services/returnRequestService';

const STATUS_BADGE: Record<ReturnStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';

export const ReturnDetailDrawer: React.FC<{ returnId: string | null; onClose: () => void }> = ({ returnId, onClose }) => {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: request } = useQuery({
    queryKey: queryKeys.returns.detail(returnId ?? ''),
    queryFn: () => returnRequestService.getDetail(returnId!),
    enabled: !!returnId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
  };

  const approveMutation = useMutation({
    mutationFn: () => returnRequestService.approve(returnId!, adminNotes || undefined),
    onSuccess: () => { invalidate(); setActionError(null); setAdminNotes(''); },
    onError: (e) => setActionError((e as Error).message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => returnRequestService.reject(returnId!, adminNotes || undefined),
    onSuccess: () => { invalidate(); setActionError(null); setAdminNotes(''); },
    onError: (e) => setActionError((e as Error).message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => returnRequestService.cancel(returnId!, adminNotes || undefined),
    onSuccess: () => { invalidate(); setActionError(null); setAdminNotes(''); },
    onError: (e) => setActionError((e as Error).message),
  });

  const isPending = request?.status === 'PENDING';
  const anyActionLoading = approveMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  return (
    <DetailDrawer isOpen={!!returnId} onClose={onClose} title={request ? `Return — ${request.order_number}` : 'Return Request'} subtitle={request ? `${request.customer_name ?? request.customer_phone} · filed ${new Date(request.created_at).toLocaleString('en-IN')}` : undefined} width="md">
      {request && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[request.status]}>{request.status}</Badge>
            <Badge variant="brand" size="sm">{request.scope === 'FULL_ORDER' ? 'Full Order' : 'Specific Items'}</Badge>
            <Badge variant="neutral" size="sm">{request.refund_destination === 'WALLET' ? 'Wallet' : 'Razorpay'}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
              <p className="text-[10px] font-bold text-status-neutral uppercase">Requested Amount</p>
              <p className="font-mono-num font-bold text-ink">₹{Number(request.computed_amount).toFixed(2)}</p>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
              <p className="text-[10px] font-bold text-status-neutral uppercase">Resolved Amount</p>
              <p className="font-mono-num font-bold text-ink">{request.resolved_amount != null ? `₹${Number(request.resolved_amount).toFixed(2)}` : '—'}</p>
            </div>
          </div>

          {request.scope === 'ITEMS' && request.items && (
            <div>
              <p className="text-[11px] font-bold text-ink mb-1">Items</p>
              <div className="space-y-1">
                {request.items.map((item) => (
                  <div key={item.itemIndex} className="flex justify-between text-xs p-2 bg-rose-50/60 rounded-[10px] border border-border">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-mono-num font-bold">₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-ink mb-1">Reason</p>
            <p className="text-xs text-ink bg-rose-50/60 rounded-[10px] border border-border p-2.5">{request.reason}</p>
          </div>

          {request.admin_notes && (
            <div>
              <p className="text-[11px] font-bold text-ink mb-1">Admin Notes</p>
              <p className="text-xs text-ink bg-rose-50/60 rounded-[10px] border border-border p-2.5">{request.admin_notes}</p>
            </div>
          )}

          {isPending && (
            <div className="space-y-2 pt-2 border-t border-border">
              {actionError && (
                <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
                  {actionError}
                  {request.refund_destination === 'WALLET' && actionError.toLowerCase().includes('wallet') && (
                    <span className="block mt-1 font-bold">This customer's wallet cap would be exceeded — reject this request and ask them to choose Razorpay/original payment method instead, or file a new request with that destination.</span>
                  )}
                </p>
              )}
              <label className="block text-[11px] font-bold text-ink">Admin Notes (optional)</label>
              <textarea className={inputClass} rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Any context for this decision…" />
              <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending} disabled={anyActionLoading}>
                  Approve & Refund
                </Button>
                <Button variant="danger" size="sm" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => rejectMutation.mutate()} isLoading={rejectMutation.isPending} disabled={anyActionLoading}>
                  Reject
                </Button>
                <Button variant="outline" size="sm" icon={<Ban className="w-3.5 h-3.5" />} onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending} disabled={anyActionLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
};
