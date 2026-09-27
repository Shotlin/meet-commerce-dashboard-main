import React from 'react';
import { Flame, Loader2, WifiOff } from 'lucide-react';
import { Button } from '../common/Button';

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="min-h-screen w-screen bg-white text-ink flex items-center justify-center px-6">
    <div className="flex flex-col items-center text-center max-w-sm">
      <div className="h-11 w-11 rounded-2xl bg-brand-500 flex items-center justify-center shadow-sm mb-6">
        <Flame className="h-6 w-6 text-white fill-current" />
      </div>
      {children}
    </div>
  </main>
);

/** Shown while the stored token is being verified — the dashboard is never rendered meanwhile. */
export const SessionLoadingScreen: React.FC = () => (
  <Shell>
    <div role="status" aria-live="polite" className="flex flex-col items-center">
      <Loader2 className="h-5 w-5 animate-spin text-ink-2" />
      <p className="mt-3 text-sm font-bold text-ink-2">Checking your session…</p>
    </div>
  </Shell>
);

/** The session could not be verified (offline / server error) — not the same as expired. */
export const SessionUnreachableScreen: React.FC<{
  message: string | null;
  onRetry: () => void;
  onSignOut: () => void;
}> = ({ message, onRetry, onSignOut }) => (
  <Shell>
    <div role="alert" className="flex flex-col items-center">
      <WifiOff className="h-6 w-6 text-status-warning" />
      <h1 className="mt-3 text-lg font-black text-ink">Can't reach the server</h1>
      <p className="mt-2 text-sm leading-6 text-ink-2">
        {message || 'We could not verify your session.'} You have not been signed out.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  </Shell>
);
