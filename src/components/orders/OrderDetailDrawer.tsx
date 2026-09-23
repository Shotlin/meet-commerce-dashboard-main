import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package, User, MapPin, FileText, Receipt, RotateCcw, XCircle, RefreshCw,
  ChevronDown, ChevronRight, CreditCard, AlertTriangle, CheckCircle2, Video,
} from 'lucide-react';
import {
  useOrderDetail, useOrderNotes, useAddOrderNote, useUpdateOrderStatus,
  useAssignRider, useRefundOrder, useCancelOrder, useResyncPayment, useRazorpayDetails,
} from '../../hooks/useOrders';
import { useCustomerDetail } from '../../hooks/useCustomers';
import { adminOrdersService } from '../../services/adminOrdersService';
import { deliveryService, AssignableRider } from '../../services/deliveryService';
import { OrderDetail } from '../../types/order.types';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ORDER_PLACED: ['CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

interface Props {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailDrawer({ orderId, onClose }: Props) {
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrderDetail(orderId);
  const { data: notes, isLoading: notesLoading } = useOrderNotes(orderId);
  const { data: customer, isLoading: customerLoading } = useCustomerDetail(order?.customerId ?? null);

  const addNote = useAddOrderNote();
  const updateStatus = useUpdateOrderStatus();
  const assignRider = useAssignRider();
  const refundOrder = useRefundOrder();
  const cancelOrder = useCancelOrder();
  const resyncPayment = useResyncPayment();

  const [noteDraft, setNoteDraft] = useState('');
  const [statusChoice, setStatusChoice] = useState('');
  const [confirmStatusDialog, setConfirmStatusDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundTo, setRefundTo] = useState<'wallet' | 'original' | 'none'>('wallet');
  const [confirmRefundDialog, setConfirmRefundDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRefundTo, setCancelRefundTo] = useState<'wallet' | 'original' | 'none'>('none');
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);
  const [showRazorpayDetails, setShowRazorpayDetails] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [riders, setRiders] = useState<AssignableRider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  const razorpayDetailsQuery = useRazorpayDetails(orderId, showRazorpayDetails);

  React.useEffect(() => {
    if (order?.riderId) setSelectedRiderId(order.riderId);
  }, [order?.riderId]);

  React.useEffect(() => {
    if (!orderId) return;
    deliveryService.getAssignableRiders().then(setRiders).catch(() => setRiders([]));
  }, [orderId]);

  const isPaid = order?.paymentStatus === 'PAID';
  const canRefund = order?.status === 'DELIVERED' && isPaid;
  const canCancel = order && !['DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const canReconcile = order?.payment?.razorpayOrderId && (order.paymentStatus === 'PENDING' || order.paymentNeedsReview);
  const hasGatewayPayment = !!order?.payment?.razorpayPaymentId;

  const download = async (kind: 'invoice' | 'slip', fn: () => Promise<Blob>, filename: string) => {
    setDownloading(kind);
    try {
      const blob = await fn();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to download ${kind}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleConfirmStatus = async () => {
    if (!order || !statusChoice) return;
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: statusChoice });
      toast.success(`Order updated to ${statusChoice.replace(/_/g, ' ')}`);
      setConfirmStatusDialog(false);
      setStatusChoice('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId || selectedRiderId === order.riderId) return;
    try {
      await assignRider.mutateAsync({ orderId: order.id, riderId: selectedRiderId });
      toast.success('Rider assigned');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign rider');
    }
  };

  const handleAddNote = async () => {
    if (!order || !noteDraft.trim()) return;
    try {
      await addNote.mutateAsync({ orderId: order.id, body: noteDraft.trim() });
      setNoteDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleRefund = async () => {
    if (!order || !refundReason.trim()) return;
    try {
      const result = await refundOrder.mutateAsync({ orderId: order.id, payload: { reason: refundReason.trim(), refundTo } });
      toast.success(`${fmtCurrency(result.refundAmount)} refunded via ${result.refundTo}`);
      setRefundDialog(false);
      setConfirmRefundDialog(false);
      setRefundReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refund failed');
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      const result = await cancelOrder.mutateAsync({
        orderId: order.id,
        payload: { reason: cancelReason.trim() || undefined, refundTo: isPaid ? cancelRefundTo : 'none' },
      });
      toast.success('Order cancelled');
      if (result.stockRestoreWarning) toast.warning(result.stockRestoreWarning);
      setCancelDialog(false);
      setConfirmCancelDialog(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const handleReconcile = async () => {
    if (!order) return;
    try {
      const result = await resyncPayment.mutateAsync(order.id);
      if (result.captured) {
        toast.success(result.needsManualReview ? 'Captured, but flagged for manual review — order already moved on' : 'Payment confirmed by Razorpay');
      } else {
        toast.info('Razorpay shows no captured payment for this order');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reconciliation failed');
    }
  };

  const openCustomer = (customerId: string) => {
    navigate(`/customers?customer=${customerId}`);
  };

  const openMap = (order: OrderDetail) => {
    const addr = (order.deliveryAddress || {}) as Record<string, any>;
    const lat = addr.lat ?? addr.latitude;
    const lng = addr.lng ?? addr.longitude;
    if (lat != null && lng != null) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  return (
    <Sheet open={!!orderId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle>{isLoading ? <Skeleton className="h-6 w-40" /> : `Order #${order?.orderNumber ?? ''}`}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-5 px-6 pb-6">
            {isLoading ? (
              <DrawerSkeleton />
            ) : !order ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Order not found</div>
            ) : (
              <>
                {/* A. HEADER */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.status} />
                  {order.paymentNeedsReview && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Needs Review
                    </Badge>
                  )}
                  {order.paymentRecoveredFromFailed && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                      <RefreshCw className="mr-1 h-3 w-3" /> Recovered
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Placed {fmtDateTime(order.createdAt)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled={downloading === 'slip'}
                    onClick={() => download('slip', () => adminOrdersService.downloadPackingSlip(order.id), `packing-slip-${order.orderNumber}.pdf`)}>
                    <FileText className="mr-1 h-3.5 w-3.5" /> Packing Slip
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled={downloading === 'invoice'}
                    onClick={() => download('invoice', () => adminOrdersService.downloadInvoice(order.id), `invoice-${order.orderNumber}.pdf`)}>
                    <Receipt className="mr-1 h-3.5 w-3.5" /> Invoice
                  </Button>
                  {canReconcile && (
                    <Button size="sm" variant="outline" className="h-8 text-xs" disabled={resyncPayment.isPending} onClick={handleReconcile}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" /> Re-check with Razorpay
                    </Button>
                  )}
                  {canRefund && (
                    <Button size="sm" variant="outline" className="h-8 text-xs text-blue-700 border-blue-300" onClick={() => setRefundDialog(true)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Process Refund
                    </Button>
                  )}
                  {canCancel && (
                    <Button size="sm" variant="outline" className="h-8 text-xs text-red-700 border-red-300" onClick={() => setCancelDialog(true)}>
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel Order
                    </Button>
                  )}
                </div>

                {STATUS_TRANSITIONS[order.status]?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={statusChoice}
                      onChange={(e) => { setStatusChoice(e.target.value); if (e.target.value) setConfirmStatusDialog(true); }}
                      className="rounded-md border border-input bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Update status…</option>
                      {STATUS_TRANSITIONS[order.status].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                )}

                {order.status === 'CANCELLED' && order.cancelledReason && (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Cancelled: {order.cancelledReason}
                  </div>
                )}

                <Separator />

                {/* B. RIDER */}
                <Section title="Rider" icon={<Package className="h-4 w-4" />}>
                  {order.riderId ? (
                    <div className="text-sm">
                      <p className="font-semibold">{order.riderName || 'Assigned'}</p>
                      {order.riderPhone && <p className="text-xs text-muted-foreground">{order.riderPhone}</p>}
                      {order.delivery?.status && <p className="text-xs text-muted-foreground">Status: {order.delivery.status}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No rider assigned</p>
                  )}
                  {order.status === 'PACKED' && (
                    <div className="mt-2 flex items-center gap-2">
                      <select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)} className="flex-1 rounded-md border border-input bg-white px-2 py-1.5 text-xs">
                        <option value="">Select a rider…</option>
                        {riders.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.is_online ? 'Online' : 'Offline'}</option>)}
                      </select>
                      <Button size="sm" className="h-8 text-xs" disabled={!selectedRiderId || selectedRiderId === order.riderId || assignRider.isPending} onClick={handleAssignRider}>
                        {order.riderId ? 'Reassign' : 'Assign'}
                      </Button>
                    </div>
                  )}
                </Section>

                <Separator />

                {/* C. STATUS TIMELINE */}
                <Section title="Status Timeline" icon={<CheckCircle2 className="h-4 w-4" />}>
                  {order.timeline.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No timeline events recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {order.timeline.map((t) => (
                        <div key={t.id} className="flex gap-3">
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-raspberry" />
                          <div>
                            <p className="text-sm font-semibold">{t.toStatus.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDateTime(t.changedAt)}{t.changedByName ? ` · by ${t.changedByName}` : ''}
                            </p>
                            {t.note && <p className="mt-0.5 text-xs italic text-muted-foreground">"{t.note}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Separator />

                {/* D. INTERNAL NOTES */}
                <Section title="Internal Notes" icon={<FileText className="h-4 w-4" />}>
                  {notesLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {(notes ?? []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
                      {(notes ?? []).map((n) => (
                        <div key={n.id} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                          <p className="text-xs">{n.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{n.authorName || 'Staff'} · {fmtDateTime(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-2">
                    <Textarea placeholder="Add an internal note..." value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} className="text-xs" rows={2} />
                    <Button size="sm" className="h-8 w-fit text-xs" disabled={!noteDraft.trim() || addNote.isPending} onClick={handleAddNote}>Add Note</Button>
                  </div>
                </Section>

                <Separator />

                {/* E. CUSTOMER */}
                <Section title="Customer" icon={<User className="h-4 w-4" />}>
                  <button className="text-sm font-semibold text-brand-raspberry hover:underline" onClick={() => order.customerId && openCustomer(order.customerId)}>
                    {order.customerName || 'Unknown Customer'}
                  </button>
                  <p className="text-xs text-muted-foreground">{order.customerPhone || '—'}{order.customerEmail ? ` · ${order.customerEmail}` : ''}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {customerLoading ? (
                      <>
                        <Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" />
                      </>
                    ) : customer ? (
                      <>
                        <StatBox label="Completed" value={customer.completed_orders} />
                        <StatBox label="Returned" value={customer.returned_orders} />
                        <StatBox label="Cancelled" value={customer.cancelled_orders} />
                      </>
                    ) : (
                      <p className="col-span-3 text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </Section>

                <Separator />

                {/* F. ITEMS */}
                <Section title={`Items (${order.items.length})`} icon={<Package className="h-4 w-4" />}>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted"><Package className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-semibold">{item.productName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.quantity} × {fmtCurrency(item.unitPrice)}{item.netQuantity ? ` · ${item.netQuantity}` : item.unit ? ` · ${item.unit}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-brand-raspberry">{fmtCurrency(item.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Separator />

                {/* G. VARIABLE-WEIGHT / CUTTING EVIDENCE */}
                <Section title="Vendor Cutting Evidence" icon={<Video className="h-4 w-4" />}>
                  {order.evidence ? (
                    <div className="text-xs">
                      <video src={order.evidence.videoUrl} controls className="w-full rounded-md" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No cutting evidence recorded for this order.</p>
                  )}
                </Section>

                <Separator />

                {/* H. PAYMENT BREAKDOWN */}
                <Section title="Payment" icon={<CreditCard className="h-4 w-4" />}>
                  <div className="space-y-1 text-xs">
                    <Row label="Subtotal" value={fmtCurrency(order.subtotal)} />
                    {order.discountAmount > 0 && <Row label="Discount" value={`-${fmtCurrency(order.discountAmount)}`} valueClass="text-emerald-600" />}
                    {order.deliveryFee > 0 && <Row label="Delivery Fee" value={fmtCurrency(order.deliveryFee)} />}
                    {order.platformFee > 0 && <Row label="Platform Fee" value={fmtCurrency(order.platformFee)} />}
                    {order.handlingFee > 0 && <Row label="Handling Fee" value={fmtCurrency(order.handlingFee)} />}
                    {order.lateNightFee > 0 && <Row label="Late-night Fee" value={fmtCurrency(order.lateNightFee)} />}
                    {order.tipAmount > 0 && <Row label="Tip" value={fmtCurrency(order.tipAmount)} />}
                    {order.taxAmount > 0 && <Row label="Tax" value={fmtCurrency(order.taxAmount)} />}
                    {order.walletAmountUsed > 0 && <Row label="Wallet Used" value={`-${fmtCurrency(order.walletAmountUsed)}`} valueClass="text-emerald-600" />}
                    <Separator className="my-1.5" />
                    <Row label="Total" value={fmtCurrency(order.totalAmount)} bold />
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <Row label="Method" value={order.paymentMethod} />
                    <Row label="Status" value={order.paymentStatus} />
                    {order.payment?.razorpayPaymentId && <Row label="Razorpay ID" value={order.payment.razorpayPaymentId} mono />}
                    {order.payment?.status === 'FAILED' && order.payment.errorDescription && (
                      <p className="mt-1 text-red-600">Declined: {order.payment.errorDescription}</p>
                    )}
                  </div>
                </Section>

                {/* I. RAZORPAY DETAILS */}
                {hasGatewayPayment && (
                  <>
                    <Separator />
                    <button className="flex w-full items-center justify-between text-left" onClick={() => setShowRazorpayDetails((v) => !v)}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4" /> Razorpay Details</span>
                      {showRazorpayDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {showRazorpayDetails && (
                      razorpayDetailsQuery.isLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : razorpayDetailsQuery.data ? (
                        <div className="space-y-1 text-xs">
                          <Row label="Method" value={razorpayDetailsQuery.data.method || '—'} />
                          {razorpayDetailsQuery.data.vpa && <Row label="UPI ID" value={razorpayDetailsQuery.data.vpa} />}
                          {razorpayDetailsQuery.data.bank && <Row label="Bank" value={razorpayDetailsQuery.data.bank} />}
                          {razorpayDetailsQuery.data.wallet && <Row label="Wallet" value={razorpayDetailsQuery.data.wallet} />}
                          {razorpayDetailsQuery.data.card && (
                            <Row label="Card" value={`${razorpayDetailsQuery.data.card.network || ''} •••• ${razorpayDetailsQuery.data.card.last4 || ''} (${razorpayDetailsQuery.data.card.type || ''})`} />
                          )}
                          <Row label="International" value={razorpayDetailsQuery.data.international ? 'Yes' : 'No'} />
                          {razorpayDetailsQuery.data.fee != null && <Row label="Razorpay Fee" value={fmtCurrency(razorpayDetailsQuery.data.fee)} />}
                          {razorpayDetailsQuery.data.tax != null && <Row label="Tax (GST)" value={fmtCurrency(razorpayDetailsQuery.data.tax)} />}
                          {razorpayDetailsQuery.data.acquirerReference && <Row label="Acquirer Ref (ARN/RRN)" value={razorpayDetailsQuery.data.acquirerReference} mono />}
                          {razorpayDetailsQuery.data.upiTransactionId && <Row label="UPI Txn ID" value={razorpayDetailsQuery.data.upiTransactionId} mono />}
                          <Row label="Captured" value={fmtDateTime(razorpayDetailsQuery.data.createdAt)} />
                          {razorpayDetailsQuery.data.amountRefunded != null && razorpayDetailsQuery.data.amountRefunded > 0 && (
                            <Row label="Refunded" value={`${fmtCurrency(razorpayDetailsQuery.data.amountRefunded)} (${razorpayDetailsQuery.data.refundStatus || 'pending'})`} />
                          )}
                          {razorpayDetailsQuery.data.errorDescription && <p className="text-red-600">Error: {razorpayDetailsQuery.data.errorDescription}</p>}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Unable to load Razorpay detail</p>
                      )
                    )}
                  </>
                )}

                <Separator />

                {/* Delivery */}
                <Section title="Delivery" icon={<MapPin className="h-4 w-4" />}>
                  <AddressBlock address={order.deliveryAddress} />
                  {order.deliveryNotes && <p className="mt-1 text-xs italic text-muted-foreground">"{order.deliveryNotes}"</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs" disabled={!hasCoords(order.deliveryAddress)} onClick={() => openMap(order)}>
                      <MapPin className="mr-1 h-3.5 w-3.5" /> View live on Map
                    </Button>
                    {order.delivery?.deliveryOtp && <Badge variant="outline">OTP: {order.delivery.deliveryOtp}</Badge>}
                  </div>
                </Section>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Confirm status transition */}
      <AlertDialog open={confirmStatusDialog} onOpenChange={setConfirmStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update order status?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves order #{order?.orderNumber} to <strong>{statusChoice.replace(/_/g, ' ')}</strong> and notifies the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusChoice('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatus}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund dialog */}
      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Refund amount is locked to what the customer actually paid — {order && fmtCurrency(order.totalAmount)} — not editable.
            </p>
            <div>
              <label className="text-xs font-semibold">Reason</label>
              <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Refund To</label>
              <select value={refundTo} onChange={(e) => setRefundTo(e.target.value as any)} className="mt-1 w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs">
                <option value="wallet">Wallet Balance</option>
                {hasGatewayPayment && <option value="original">Original Payment Method</option>}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRefundDialog(false)}>Cancel</Button>
            <Button size="sm" disabled={!refundReason.trim()} onClick={() => setConfirmRefundDialog(true)}>Process Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmRefundDialog} onOpenChange={setConfirmRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund {order && fmtCurrency(order.totalAmount)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately moves money to the customer via {refundTo === 'original' ? 'the original payment method' : 'wallet credit'}. This cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={refundOrder.isPending}>Yes, process refund</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Reason</label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2} className="mt-1 text-xs" />
            </div>
            {isPaid ? (
              <div>
                <label className="text-xs font-semibold">Refund To</label>
                <select value={cancelRefundTo} onChange={(e) => setCancelRefundTo(e.target.value as any)} className="mt-1 w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs">
                  <option value="none">No Refund</option>
                  <option value="wallet">Wallet Balance</option>
                  {hasGatewayPayment && <option value="original">Original Payment Method</option>}
                </select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">This order was never paid — there is nothing to refund.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelDialog(false)}>Back</Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmCancelDialog(true)}>Cancel Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmCancelDialog} onOpenChange={setConfirmCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order #{order?.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>This restores stock and notifies the customer. This cannot be undone from here.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelOrder.isPending}>Yes, cancel order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon} {title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value, bold, mono, valueClass }: { label: string; value: string; bold?: boolean; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''} ${valueClass || ''}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2 py-2 text-center">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ORDER_PLACED: 'bg-blue-100 text-blue-800 border-blue-300',
    PENDING: 'bg-blue-100 text-blue-800 border-blue-300',
    CONFIRMED: 'bg-violet-100 text-violet-800 border-violet-300',
    PREPARING: 'bg-amber-100 text-amber-800 border-amber-300',
    PACKED: 'bg-amber-100 text-amber-800 border-amber-300',
    OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800 border-violet-300',
    DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    CANCELLED: 'bg-gray-100 text-gray-700 border-gray-300',
    REFUNDED: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return <Badge className={styles[status] || 'bg-gray-100 text-gray-700 border-gray-300'}>{status.replace(/_/g, ' ')}</Badge>;
}

function AddressBlock({ address }: { address: Record<string, unknown> | null }) {
  if (!address) return <p className="text-xs text-muted-foreground">No delivery address on file</p>;
  const get = (...keys: string[]): string | undefined =>
    keys.map((k) => address[k]).find((v): v is string => typeof v === 'string' && !!v);
  const line1 = get('addressLine1', 'address_line1', 'line1');
  const line2 = get('addressLine2', 'address_line2', 'line2');
  const city = get('city');
  const state = get('state');
  const pincode = get('pincode');
  const label = get('label');
  return (
    <div className="text-xs">
      {label && <p className="font-semibold">{String(label)}</p>}
      <p>{[line1, line2].filter(Boolean).join(', ') || '—'}</p>
      <p className="text-muted-foreground">{[city, state, pincode].filter(Boolean).join(', ')}</p>
    </div>
  );
}

function hasCoords(address: Record<string, unknown> | null): boolean {
  if (!address) return false;
  const lat = (address as any).lat ?? (address as any).latitude;
  const lng = (address as any).lng ?? (address as any).longitude;
  return lat != null && lng != null;
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
