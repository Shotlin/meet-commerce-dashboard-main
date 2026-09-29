import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  assignOrderToShiprocket, cancelOrderShipment, checkOrderQuick, getOrderShipment,
  getShiprocketSettings, refreshOrderShipment, type ShiprocketCheck, type ShiprocketShipment,
} from '../../services/shiprocketSettingsService';

interface Props {
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
}

const LIVE = ['CREATED', 'ASSIGNING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
const LABEL: Record<string, string> = {
  CREATED: 'Order created', ASSIGNING: 'Finding a rider…', ASSIGNED: 'Rider assigned', PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', FAILED: 'Failed',
};
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

/**
 * Shiprocket Quick delivery for one order. Shown only while Shiprocket is the
 * delivery partner (or when this order already has a Shiprocket shipment).
 * Prepaid orders only — COD shows a disabled button with the reason.
 */
export function ShiprocketDeliverySection({ orderId, paymentMethod, paymentStatus, orderStatus }: Props) {
  const qc = useQueryClient();
  const [check, setCheck] = useState<ShiprocketCheck | null>(null);
  const key = ['admin', 'shiprocket-order', orderId];

  const settings = useQuery({ queryKey: ['admin', 'shiprocket-settings'], queryFn: getShiprocketSettings, staleTime: 30_000 });
  const shipment = useQuery({
    queryKey: key,
    queryFn: () => getOrderShipment(orderId),
    refetchInterval: (q) => (q.state.data && LIVE.includes(q.state.data.status) ? 20_000 : false),
  });

  const done = (msg: string) => (s: ShiprocketShipment | null) => {
    qc.setQueryData(key, s);
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    setCheck(null);
    toast.success(msg);
  };
  const checkM = useMutation({ mutationFn: () => checkOrderQuick(orderId), onSuccess: setCheck, onError: (e) => toast.error(errMsg(e)) });
  const assignM = useMutation({ mutationFn: () => assignOrderToShiprocket(orderId), onSuccess: done('Assigned to Shiprocket Quick'), onError: (e) => toast.error(errMsg(e)) });
  const refreshM = useMutation({ mutationFn: () => refreshOrderShipment(orderId), onSuccess: done('Status refreshed'), onError: (e) => toast.error(errMsg(e)) });
  const cancelM = useMutation({
    mutationFn: () => cancelOrderShipment(orderId),
    onSuccess: done('Shiprocket delivery cancelled'),
    onError: (e) => toast.error(errMsg(e)),
  });

  const sh = shipment.data;
  const live = !!sh && LIVE.includes(sh.status);
  const shiprocketMode = settings.data?.deliveryPartner === 'SHIPROCKET';
  if (!shiprocketMode && !sh) return null;

  const isCod = paymentMethod === 'COD';
  const isPaid = paymentStatus === 'PAID';
  const closed = ['DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'].includes(orderStatus);
  const blockReason = isCod ? 'COD not available on Shiprocket — prepaid orders only'
    : !isPaid ? 'Payment not completed yet' : closed ? `Order is ${orderStatus}` : null;

  return (
    <div className="space-y-3 text-sm">
      {live || sh?.status === 'DELIVERED' ? (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Shiprocket Quick</span>
            <Badge variant="outline">{LABEL[sh!.status]}</Badge>
          </div>
          {sh!.sr_status && <p className="text-xs text-muted-foreground">Latest: {sh!.sr_status}</p>}
          {sh!.agent_name && <p className="text-xs">Rider: <b>{sh!.agent_name}</b>{sh!.agent_phone ? ` · ${sh!.agent_phone}` : ''}</p>}
          {sh!.awb_code && <p className="text-xs">AWB: <span className="font-mono">{sh!.awb_code}</span></p>}
          {sh!.tracking_url && <a href={sh!.tracking_url} target="_blank" rel="noreferrer" className="text-xs underline">Track on Shiprocket</a>}
          {live && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" disabled={refreshM.isPending} onClick={() => refreshM.mutate()}>Refresh</Button>
              {!['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(sh!.status) && (
                <Button size="sm" variant="outline" disabled={cancelM.isPending}
                  onClick={() => window.confirm('Cancel this Shiprocket delivery?') && cancelM.mutate()}>Cancel Shiprocket</Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sh?.status === 'FAILED' && sh.last_error && <p className="text-xs text-red-600">Last attempt failed: {sh.last_error}</p>}
          {sh?.status === 'CANCELLED' && <p className="text-xs text-muted-foreground">Previous Shiprocket delivery was cancelled.</p>}
          {check && (
            <p className={`text-xs ${check.available ? '' : 'text-red-600'}`}>
              {check.available ? `${check.courierName ?? 'Shiprocket Quick'} available${check.rate != null ? ` · ₹${check.rate}` : ''}` : check.reason}
            </p>
          )}
          {blockReason && <p className="text-xs text-amber-600">{blockReason}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!!blockReason || checkM.isPending} onClick={() => checkM.mutate()}>Check price</Button>
            <Button size="sm" disabled={!!blockReason || assignM.isPending} onClick={() => assignM.mutate()}>
              {assignM.isPending ? 'Assigning…' : check?.rate != null ? `Assign to Shiprocket – ₹${check.rate}` : 'Assign to Shiprocket'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
