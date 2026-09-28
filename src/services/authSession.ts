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

/** The one active shop assignment for a shop-staff session — `shops[0]`
 * from a login response, or `active_shop` from `/me`. Both share this
 * shape (`sanitizeAssignment` on the backend). */
interface RawShopAssignment {
  shop_id?: string;
  shop_name?: string;
  shop_role?: string;
}

/**
 * Resolves the cosmetic role label from EITHER an HQ `platform_role` OR
 * a shop-staff `shop_role` — exactly one of the two is ever present for
 * a real `/admin/auth/login` or `/admin/auth/me` response (never both,
 * never neither, for an account that can reach this dashboard at all).
 * Before this, a shop-staff session with no `platform_role` fell through
 * to a hardcoded `'HQ Admin'` default — the backend still enforced real
 * permissions per request, but the frontend rendered the full HQ nav for
 * an account that could act on none of it.
 */
export function roleLabelFromPlatformRole(
  platformRole?: string | null,
  shopRole?: string | null,
): UserRole {
  switch (platformRole) {
    case 'HQ_FINANCE':
      return 'Finance Lead';
    case 'HQ_MANAGER':
      return 'Warehouse Manager';
    case 'HQ_SUPPORT':
      return 'Governance Auditor';
  }
  if (platformRole) return 'HQ Admin';
  switch (shopRole) {
    case 'SHOP_ADMIN':
    case 'SHOP_MANAGER':
      return 'Shop Manager';
    case 'SHOP_STAFF':
    case 'SHOP_VIEWER':
      return 'Shop Staff';
  }
  // Neither claim present — should not happen for a real admin-login
  // token; err on the least-privileged real label rather than 'HQ Admin'.
  return 'Shop Staff';
}

/** `HQ_MANAGER` → `HQ Manager`, `SUPER_ADMIN` → `Super Admin`; shop roles
 * get their own human names since they don't follow the `HQ_*` shape. */
function humanizeRole(platformRole?: string | null, shopRole?: string | null): string {
  if (platformRole) {
    return platformRole
      .split('_')
      .map((word) => (word === 'HQ' ? word : word.charAt(0) + word.slice(1).toLowerCase()))
      .join(' ');
  }
  switch (shopRole) {
    case 'SHOP_ADMIN':
      return 'Shop Admin';
    case 'SHOP_MANAGER':
      return 'Shop Manager';
    case 'SHOP_STAFF':
      return 'Shop Staff';
    case 'SHOP_VIEWER':
      return 'Shop Viewer';
    default:
      return 'Store Staff';
  }
}

/** Identity comes from the server only — there are deliberately no placeholder defaults. */
export function toSessionUser(
  raw: RawUser | null | undefined,
  shopAssignment?: RawShopAssignment | null,
): SessionUser {
  const email = raw?.email ?? '';
  const platformRole = raw?.platform_role ?? raw?.platformRole ?? null;
  return {
    id: raw?.id ?? null,
    name: raw?.full_name || raw?.name || email,
    email,
    phone: raw?.phone ?? '',
    designation: humanizeRole(platformRole, shopAssignment?.shop_role ?? null),
    shopId: !platformRole ? (shopAssignment?.shop_id ?? null) : null,
    shopRole: !platformRole ? (shopAssignment?.shop_role ?? null) : null,
    shopName: !platformRole ? (shopAssignment?.shop_name ?? null) : null,
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
      const res = await apiClient.request<{ user?: RawUser; active_shop?: RawShopAssignment | null }>(
        'GET',
        ME_PATH,
        { timeoutMs: RESTORE_TIMEOUT_MS },
      );
      const user = res.data?.user;
      if (!res.success || !user) {
        sessionManager.end('expired');
        return;
      }
      const platformRole = user.platform_role ?? user.platformRole;
      const activeShop = res.data?.active_shop ?? null;
      sessionManager.confirm(
        toSessionUser(user, activeShop),
        roleLabelFromPlatformRole(platformRole, activeShop?.shop_role),
      );
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
    const res = await apiClient.request<{
      accessToken?: string;
      user?: RawUser;
      shops?: RawShopAssignment[];
      requiresShopSelection?: boolean;
    }>('POST', LOGIN_PATH, {
      body: { email, password },
      skipAuth: true,
    });
    const token = res.data?.accessToken;
    if (!res.success || !token) {
      return { ok: false, kind: 'server', message: 'Sign-in failed. Please try again.' };
    }
    if (res.data.requiresShopSelection) {
      // This account is assigned to 2+ shops — the backend correctly
      // issues only a 5-minute STORE_PENDING token that can call nothing
      // but `/admin/auth/select-shop`, which this dashboard has no UI
      // for yet. Treating that as a normal login used to silently
      // "succeed" with a token that would fail on the very next request
      // (or hard-expire within minutes) — refuse cleanly instead.
      return {
        ok: false,
        kind: 'server',
        message:
          'This account is assigned to more than one shop. Multi-shop sign-in isn’t supported here yet — ask HQ to assign a single shop, or sign in from a device that supports shop selection.',
      };
    }
    const user = res.data.user ?? { email };
    const shopAssignment = res.data.shops?.[0] ?? null;
    const platformRole = user.platform_role ?? user.platformRole;
    sessionManager.begin(
      token,
      toSessionUser(user, shopAssignment),
      roleLabelFromPlatformRole(platformRole, shopAssignment?.shop_role),
    );
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
