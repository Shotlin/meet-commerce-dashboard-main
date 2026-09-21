/**
 * Session lifecycle operations (restore / login / logout) — the only code
 * that talks to `/admin/auth/*` and drives `sessionManager` transitions.
 * Framework-agnostic so it can be tested without React.
 */
import type { UserRole } from '../types';
import { apiClient, ApiError, NETWORK_ERROR_MESSAGE } from './apiClient';
import { sessionManager, type SessionUser } from './sessionManager';

const ME_PATH = '/api/v1/admin/auth/me';
const LOGIN_PATH = '/api/v1/admin/auth/login';
/** Never leave the "checking session" splash up forever if the API hangs. */
const RESTORE_TIMEOUT_MS = 10_000;

interface RawUser {
  id?: string;
  email?: string;
  full_name?: string;
  name?: string;
  phone?: string | null;
  platform_role?: string | null;
  platformRole?: string | null;
}

export function roleLabelFromPlatformRole(platformRole?: string | null): UserRole {
  switch (platformRole) {
    case 'HQ_FINANCE':
      return 'Finance Lead';
    case 'HQ_MANAGER':
      return 'Warehouse Manager';
    case 'HQ_SUPPORT':
      return 'Governance Auditor';
    default:
      return 'HQ Admin';
  }
}

/** `HQ_MANAGER` → `HQ Manager`, `SUPER_ADMIN` → `Super Admin`. */
function humanizeRole(platformRole?: string | null): string {
  if (!platformRole) return 'Store Staff';
  return platformRole
    .split('_')
    .map((word) => (word === 'HQ' ? word : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(' ');
}

/** Identity comes from the server only — there are deliberately no placeholder defaults. */
export function toSessionUser(raw: RawUser | null | undefined): SessionUser {
  const email = raw?.email ?? '';
  return {
    id: raw?.id ?? null,
    name: raw?.full_name || raw?.name || email,
    email,
    phone: raw?.phone ?? '',
    designation: humanizeRole(raw?.platform_role ?? raw?.platformRole),
  };
}

// ── restore ────────────────────────────────────────────────────────────────

let restoreInFlight: Promise<void> | null = null;

/**
 * Startup: turn a stored token into a *verified* session (or none).
 * Safe to call repeatedly (React StrictMode double-invokes effects).
 */
export function restoreSession(): Promise<void> {
  if (sessionManager.getSnapshot().status !== 'checking') return Promise.resolve();
  if (restoreInFlight) return restoreInFlight;

  restoreInFlight = (async () => {
    try {
      const res = await apiClient.request<{ user?: RawUser }>('GET', ME_PATH, { timeoutMs: RESTORE_TIMEOUT_MS });
      const user = res.data?.user;
      if (!res.success || !user) {
        sessionManager.end('expired');
        return;
      }
      sessionManager.confirm(toSessionUser(user), roleLabelFromPlatformRole(user.platform_role ?? user.platformRole));
    } catch (err) {
      // 401 / blocked: apiClient already ended the session and the router is
      // redirecting. Everything else (offline, timeout, 5xx, 429) says nothing
      // about the token, so it must NOT log the user out.
      if (err instanceof ApiError && err.isAuthError) return;
      sessionManager.markUnreachable(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    } finally {
      restoreInFlight = null;
    }
  })();

  return restoreInFlight;
}

export function retryRestore(): Promise<void> {
  sessionManager.markChecking();
  return restoreSession();
}

// ── login / logout ─────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true }
  | { ok: false; kind: 'credentials' | 'network' | 'server'; message: string };

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await apiClient.request<{ accessToken?: string; user?: RawUser }>('POST', LOGIN_PATH, {
      body: { email, password },
      skipAuth: true,
    });
    const token = res.data?.accessToken;
    if (!res.success || !token) {
      return { ok: false, kind: 'server', message: 'Sign-in failed. Please try again.' };
    }
    const user = res.data.user ?? { email };
    sessionManager.begin(token, toSessionUser(user), roleLabelFromPlatformRole(user.platform_role ?? user.platformRole));
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.isNetworkError) return { ok: false, kind: 'network', message: err.message };
      if (err.status !== null && err.status >= 500) {
        return { ok: false, kind: 'server', message: 'The server had a problem signing you in. Please try again shortly.' };
      }
      return { ok: false, kind: 'credentials', message: err.message };
    }
    return { ok: false, kind: 'server', message: 'Sign-in failed. Please try again.' };
  }
}

/**
 * Purely local, so it works offline and with an already-expired token. The
 * backend's `/admin/auth/logout` only clears cookies this SPA never receives
 * (no `credentials: 'include'`), so there is nothing server-side to call.
 */
export function logout(): void {
  sessionManager.end('signed-out');
}
