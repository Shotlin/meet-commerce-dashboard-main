import { QueryClient } from '@tanstack/react-query';
import { sessionManager } from './sessionManager';

// Server-state cache for all data-fetching hooks going forward (Phase 1+).
// Owns API data only — auth lives in `sessionManager`.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// When a session ends, stop every in-flight protected query and drop the
// cache so the next user (or the login screen) can never see, or refetch,
// the previous administrator's data.
sessionManager.onEnd(() => {
  void queryClient.cancelQueries();
  queryClient.clear();
});
