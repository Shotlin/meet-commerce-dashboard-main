import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '../services/apiClient';
import { sessionManager } from '../services/sessionManager';
import { queryKeys } from '../services/queryKeys';
import { createRealtimeGate } from '../utils/realtimeGate';

/** Shape of `dashboard:new_order` — see backend `socketio.plugin.js#emitDashboardNewOrder`. */
export interface NewOrderAlertPayload {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  shop_id: string | null;
  created_at: string;
}

/** Browser-wide signal for pages that don't use TanStack Query for their order data (e.g. HQCommandCenter's local `useState`+`fetch`), so they can refetch instantly too instead of waiting on their own polling interval. */
export const NEW_ORDER_EVENT = 'dashboard:new-order';

/** Same, for any order status change / refund update (pages on plain fetch). */
export const ORDER_CHANGED_EVENT = 'dashboard:order-changed';

/** Shape of `refund:status` — see backend `modules/orders/order-events.js`. */
export interface RefundStatusPayload {
  orderId: string;
  orderNumber?: string;
  refundRequestId: string;
  status: string;
  event?: string;
  amount?: number;
  seq?: number;
  eventId?: string;
}

/** Shape of `order:status`. */
export interface OrderStatusPayload {
  orderId: string;
  orderNumber?: string;
  status: string;
  seq?: number;
  eventId?: string;
}

const ALERT_SOUND_URL = '/sounds/new-order-alert.mp3';
// Cap how many order ids we remember, purely so a session left open for days
// doesn't grow this Set without bound — a real duplicate delivery (socket
// reconnect replay, a double emit) is the only thing this is guarding
// against, and it will always be a recent id.
const MAX_SEEN_IDS = 200;

function playAlertOnce() {
  try {
    const audio = new Audio(ALERT_SOUND_URL);
    audio.volume = 1;
    // Autoplay is only blocked by browsers before any user gesture on the
    // page — by the time an admin is looking at an authenticated dashboard
    // they've already clicked/typed at least once, so this reliably plays.
    // If a browser ever blocks it anyway, fail silently rather than throw:
    // the toast + live list update below still carry the real information.
    void audio.play().catch((err) => {
      console.warn('New-order alert sound could not autoplay', err);
    });
  } catch (err) {
    console.warn('New-order alert sound failed to load', err);
  }
}

/**
 * Owns the dashboard's one real-time order socket connection. Mounted once,
 * at the top of the authenticated shell (`MainLayout`), so a new order shows
 * up — sound, toast, and an instant Orders-list refresh — no matter which
 * page is currently open, without waiting for a manual refresh or the next
 * polling tick.
 */
export function useLiveOrderAlerts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const seenOrderIdsRef = useRef<string[]>([]);
  const gateRef = useRef(createRealtimeGate());

  useEffect(() => {
    const token = sessionManager.getToken();
    if (!token) return;

    const socket = io(apiClient.getBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // Events fired while the socket was down are never replayed, so every
    // (re)connect re-reads the order + returns lists from REST.
    const reconcile = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
      window.dispatchEvent(new CustomEvent(ORDER_CHANGED_EVENT));
    };
    socket.on('connect', () => { setConnected(true); reconcile(); });
    socket.on('disconnect', () => setConnected(false));

    // Any order status change — by a rider, the customer, another admin or
    // Shiprocket — refreshes the order list/drawer instantly. One event per
    // change (server de-dupes rooms); the gate drops stale/duplicate ones.
    socket.on('order:status', (e: OrderStatusPayload) => {
      if (!e?.orderId || !gateRef.current.accept(`order:${e.orderId}`, e.seq, e.eventId)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
      window.dispatchEvent(new CustomEvent(ORDER_CHANGED_EVENT, { detail: e }));
    });

    // A customer refund request lands in the right store's queue live.
    socket.on('refund:status', (e: RefundStatusPayload) => {
      if (!e?.refundRequestId || !gateRef.current.accept(`refund:${e.refundRequestId}`, e.seq, e.eventId)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
      window.dispatchEvent(new CustomEvent(ORDER_CHANGED_EVENT, { detail: e }));

      if (e.event === 'REFUND_REQUESTED') {
        playAlertOnce();
        toast.warning(`Refund request — ${e.orderNumber || 'order'}`, {
          description: `${Number(e.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} requested by the customer`,
          action: { label: 'Review', onClick: () => navigate(`/returns?id=${e.refundRequestId}`) },
          duration: 10000,
        });
      }
    });

    socket.on('dashboard:new_order', (order: NewOrderAlertPayload) => {
      if (!order?.id || seenOrderIdsRef.current.includes(order.id)) return;
      seenOrderIdsRef.current.push(order.id);
      if (seenOrderIdsRef.current.length > MAX_SEEN_IDS) {
        seenOrderIdsRef.current.shift();
      }

      playAlertOnce();

      const amount = Number(order.total || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      });
      toast.success(`New order — ${order.order_number || 'placed'}`, {
        description: `${amount} · ${order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}`,
        action: {
          label: 'View',
          onClick: () => navigate('/orders'),
        },
        duration: 8000,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
      window.dispatchEvent(new CustomEvent(NEW_ORDER_EVENT, { detail: order }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  return { connected };
}
