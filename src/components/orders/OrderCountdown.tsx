import React, { useEffect, useState } from 'react';

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'REFUNDED']);

interface OrderCountdownProps {
  estimatedDelivery: string | null;
  status: string;
  deliveredAt?: string | null;
}

/**
 * Pure client-side countdown against the backend's own `estimated_delivery`
 * timestamp — never an arbitrary frontend duration, and never polls the
 * backend. Ticks once a second only while the order is still active;
 * freezes the moment it reaches a terminal status so it doesn't keep
 * counting on a delivered/cancelled order.
 */
export const OrderCountdown: React.FC<OrderCountdownProps> = ({ estimatedDelivery, status, deliveredAt }) => {
  const frozen = TERMINAL_STATUSES.has(status);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [frozen]);

  if (!estimatedDelivery) {
    return <span className="text-xs text-status-neutral">—</span>;
  }

  const targetMs = new Date(estimatedDelivery).getTime();
  if (Number.isNaN(targetMs)) {
    return <span className="text-xs text-status-neutral">—</span>;
  }

  // Once delivered, compare the real delivery time to the estimate instead
  // of continuing to run a live clock against a now-meaningless target.
  if (status === 'DELIVERED' && deliveredAt) {
    const deliveredMs = new Date(deliveredAt).getTime();
    if (!Number.isNaN(deliveredMs)) {
      const diffMs = targetMs - deliveredMs;
      const { text } = formatDuration(Math.abs(diffMs));
      return (
        <span className="text-[11px] font-mono-num text-status-neutral">
          Delivered {text} {diffMs >= 0 ? 'early' : 'late'}
        </span>
      );
    }
  }

  if (frozen) {
    return <span className="text-xs text-status-neutral capitalize">{status.toLowerCase().replace(/_/g, ' ')}</span>;
  }

  const remainingMs = targetMs - now;
  const overdue = remainingMs < 0;
  const { text } = formatDuration(Math.abs(remainingMs));

  return (
    <span className={`text-xs font-mono-num font-semibold ${overdue ? 'text-status-danger' : 'text-ink'}`}>
      {overdue ? `Overdue ${text}` : `${text} left`}
    </span>
  );
};

function formatDuration(ms: number): { text: string } {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m` };
}
