import React from 'react';
import { Radio } from 'lucide-react';
import { useLiveOrderAlerts } from '../../hooks/useLiveOrderAlerts';

/**
 * Small always-visible dot in the top bar proving the real-time order socket
 * is actually connected — mounted once in `TopHeaderBar` (rendered by
 * `MainLayout`, so it's alive for the whole authenticated session, on every
 * page, not just Orders). The hook itself owns the socket connection, the
 * alert sound, the toast, and the live-list refresh; this component only
 * renders its `connected` state.
 */
export const LiveOrdersIndicator: React.FC = () => {
  const { connected } = useLiveOrderAlerts();

  return (
    <div
      className={`hidden md:flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
        connected
          ? 'text-status-success border-status-success/30 bg-status-success/10'
          : 'text-status-neutral border-border bg-surface'
      }`}
      title={connected ? 'Real-time order alerts: connected' : 'Real-time order alerts: connecting…'}
    >
      <Radio className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} />
      {connected ? 'Live' : 'Connecting'}
    </div>
  );
};
