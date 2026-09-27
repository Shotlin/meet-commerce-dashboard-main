import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../services/apiClient';
import { sessionManager } from '../services/sessionManager';

export interface LiveRiderPosition {
  lat: number;
  lng: number;
  /** ms epoch — a position older than a few minutes is worth graying out, not trusting. */
  updatedAt: number;
}

type RawLocation = { riderId: string; lat: number; lng: number; updatedAt: number };

// The server already broadcasts every online rider's position to the
// `admin:dashboard` room every 10s (see socketio.plugin.js's
// `dashboard:rider_locations` interval) — it isn't shop-scoped, so this
// hook filters client-side to only the rider IDs the caller says belong
// to the current shop (from useShopLiveRiders' REST fetch, which IS
// shop-scoped). No backend socket change needed for this.
export function useLiveRiderLocations(riderIds: string[]): {
  positions: Record<string, LiveRiderPosition>;
  connected: boolean;
} {
  const [positions, setPositions] = useState<Record<string, LiveRiderPosition>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const riderIdsRef = useRef<Set<string>>(new Set(riderIds));
  riderIdsRef.current = new Set(riderIds);

  useEffect(() => {
    const token = sessionManager.getToken();
    if (!token) return;

    const socket = io(apiClient.getBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('dashboard:rider_locations', (locations: RawLocation[]) => {
      const relevant = locations.filter((l) => riderIdsRef.current.has(l.riderId));
      if (relevant.length === 0) return;
      setPositions((prev) => {
        const next = { ...prev };
        for (const loc of relevant) {
          next[loc.riderId] = { lat: loc.lat, lng: loc.lng, updatedAt: loc.updatedAt };
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- riderIdsRef carries the current id set; reconnecting per-render would thrash the socket
  }, []);

  return { positions, connected };
}
