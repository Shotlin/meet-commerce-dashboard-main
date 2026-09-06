import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { queryKeys } from '../services/queryKeys';

interface SectionUpdatePayload {
  tab_key: string;
  action: string;
  timestamp: number;
}

// The server only broadcasts `tab_key` (the short slug, e.g. "all"), not the
// tab's UUID — and dashboard query keys are keyed by UUID. Rather than
// maintaining a key<->id map just for this, we invalidate the whole
// `sections` domain on any update; TanStack Query only refetches queries
// that are actually mounted, so this is cheap and correct even though it's
// not narrowly scoped to the one affected tab.
export function useThemeLiveSync() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<SectionUpdatePayload | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mc_access_token');
    if (!token) return;

    const socket = io(apiClient.getBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('section:update', (payload: SectionUpdatePayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
      setLastUpdate(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return { connected, lastUpdate };
}
