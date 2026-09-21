/**
 * The ONE dashboard session state machine.
 *
 * Framework-agnostic (no React, no apiClient import) so that `apiClient`
 * can report a 401 to it and React can subscribe to it via
 * `useSyncExternalStore` without a dependency cycle.
 *
 *   checking ──/me ok──────────▶ authenticated
 *      │  └──/me network/5xx──▶ unreachable ──retry──▶ checking
 *      └──/me 401, no/bad token─▶ unauthenticated ◀── logout / first 401
 *
 * Invariant: `authenticated` is only ever entered from a successful login
 * response or a successful `/admin/auth/me` — never merely because a token
 * string exists in localStorage.
 *
 * Every transition into `unauthenticated` goes through `end()`, which is
 * idempotent, so ten parallel 401s produce exactly one logout.
 */
import type { UserRole } from '../types';
import { AUTOSAVE_KEY_PREFIX } from '../hooks/useBuilderAutosave';

export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'unreachable';
/** Why the session ended — drives the "session expired" notice on /login. */
export type SessionEndReason = 'expired' | 'signed-out';

export interface SessionUser {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  designation: string;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
  role: UserRole | null;
  /** Set only while `status === 'unauthenticated'`. */
  endReason: SessionEndReason | null;
  /** Set only while `status === 'unreachable'` — why /me could not be checked. */
  restoreError: string | null;
}

export const SESSION_KEYS = {
  token: 'mc_access_token',
  role: 'mc_role',
  scope: 'mc_scope',
  activeShop: 'mc_active_shop_id',
  // Legacy: older builds persisted a (fake-defaulted) profile. Never written
  // any more, but still purged.
  userName: 'mc_user_name',
  userEmail: 'mc_user_email',
  userPhone: 'mc_user_phone',
  /**
   * Opaque id (not a name/email) of the user whose builder drafts are in
   * localStorage. Lets a draft survive a session *expiry* for the same user
   * while guaranteeing another user never inherits it. Removed on explicit
   * sign-out.
   */
  draftOwner: 'mc_draft_owner',
} as const;

/** Every dashboard-owned key shares this prefix; ended sessions purge all of them. */
const SESSION_KEY_PREFIX = 'mc_';

const VALID_ROLES: readonly UserRole[] = [
  'HQ Admin',
  'Warehouse Manager',
  'Vendor',
  'Fulfilment Agent',
  'Finance Lead',
  'Governance Auditor',
];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);

// ── storage (all guarded: it can throw in private mode / when blocked) ──────

const readKey = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeKey = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* in-memory state still applies */
  }
};

const removeKeysWithPrefix = (storage: Storage, prefix: string, keep: readonly string[] = []): void => {
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(prefix) && !keep.includes(key)) doomed.push(key);
  }
  doomed.forEach((key) => storage.removeItem(key));
};

/** Removes every `mc_*` key (token, role, scope, active shop, legacy profile). */
const purgeSessionKeys = (): void => {
  const keep = [SESSION_KEYS.draftOwner];
  try {
    removeKeysWithPrefix(localStorage, SESSION_KEY_PREFIX, keep);
  } catch {
    /* ignore */
  }
  try {
    removeKeysWithPrefix(sessionStorage, SESSION_KEY_PREFIX, keep);
  } catch {
    /* ignore */
  }
};

const purgeBuilderDrafts = (): void => {
  try {
    removeKeysWithPrefix(localStorage, AUTOSAVE_KEY_PREFIX);
    localStorage.removeItem(SESSION_KEYS.draftOwner);
  } catch {
    /* ignore */
  }
};

// ── token inspection (a UX shortcut only — the backend stays the authority) ─

export type TokenCheck = 'ok' | 'malformed' | 'expired';

export function inspectToken(token: string, nowMs: number = Date.now()): TokenCheck {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return 'malformed';
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload: unknown = JSON.parse(atob(padded));
    if (typeof payload !== 'object' || payload === null) return 'malformed';
    const exp = (payload as { exp?: unknown }).exp;
    if (typeof exp === 'number' && exp * 1000 <= nowMs) return 'expired';
    return 'ok';
  } catch {
    return 'malformed';
  }
}

// ── the manager ────────────────────────────────────────────────────────────

type Listener = () => void;
type EndHook = (reason: SessionEndReason) => void;

const UNAUTHENTICATED = (endReason: SessionEndReason | null): SessionSnapshot => ({
  status: 'unauthenticated',
  user: null,
  role: null,
  endReason,
  restoreError: null,
});

class SessionManager {
  private snapshot: SessionSnapshot;
  /** The token this tab believes it owns; compared against cross-tab changes. */
  private heldToken: string | null = null;
  private readonly listeners = new Set<Listener>();
  private readonly endHooks = new Set<EndHook>();

  constructor() {
    this.snapshot = this.restoreInitialState();
  }

  /** Decides the very first status synchronously so nothing flashes on load. */
  private restoreInitialState(): SessionSnapshot {
    const token = readKey(SESSION_KEYS.token);
    if (!token) {
      // No session: make sure no stale identity/scope from an old build survives.
      purgeSessionKeys();
      return UNAUTHENTICATED(null);
    }
    const check = inspectToken(token);
    if (check !== 'ok') {
      purgeSessionKeys();
      return UNAUTHENTICATED(check === 'expired' ? 'expired' : null);
    }
    this.heldToken = token;
    return { status: 'checking', user: null, role: null, endReason: null, restoreError: null };
  }

  // useSyncExternalStore contract — stable reference until something changes.
  getSnapshot = (): SessionSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Token to attach to requests; `null` once the session has ended. */
  getToken(): string | null {
    return this.snapshot.status === 'unauthenticated' ? null : readKey(SESSION_KEYS.token);
  }

  /** Runs after a session ends (query cache, in-memory scope …). Returns an unsubscribe. */
  onEnd(hook: EndHook): () => void {
    this.endHooks.add(hook);
    return () => {
      this.endHooks.delete(hook);
    };
  }

  private set(next: SessionSnapshot): void {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  // ── transitions ──────────────────────────────────────────────────────────

  /** Login succeeded: the response itself is the proof of a valid session. */
  begin(token: string, user: SessionUser, role: UserRole): void {
    // Scope keys can never carry over from a previous user.
    purgeSessionKeys();
    this.reconcileDraftOwner(user.id);
    writeKey(SESSION_KEYS.token, token);
    writeKey(SESSION_KEYS.role, role);
    this.heldToken = token;
    this.set({ status: 'authenticated', user, role, endReason: null, restoreError: null });
  }

  /** `/admin/auth/me` accepted the stored token. */
  confirm(user: SessionUser, roleFromServer: UserRole): void {
    if (this.snapshot.status !== 'checking' && this.snapshot.status !== 'unreachable') return;
    // The role label is a cosmetic scope selector the user may have switched;
    // honour a previously chosen valid one, otherwise use the server-derived one.
    const stored = readKey(SESSION_KEYS.role);
    const role = isUserRole(stored) ? stored : roleFromServer;
    this.reconcileDraftOwner(user.id);
    this.set({ status: 'authenticated', user, role, endReason: null, restoreError: null });
  }

  /** `/me` could not be evaluated (offline, 5xx, timeout) — NOT a session expiry. */
  markUnreachable(message: string): void {
    if (this.snapshot.status !== 'checking') return;
    this.set({ ...this.snapshot, status: 'unreachable', restoreError: message });
  }

  /** Leave `unreachable` to try `/me` again. */
  markChecking(): void {
    if (this.snapshot.status !== 'unreachable') return;
    this.set({ ...this.snapshot, status: 'checking', restoreError: null });
  }

  /**
   * End the session. Idempotent: returns false (and does nothing) when the
   * session has already ended, so N concurrent failures cause one logout.
   */
  end(reason: SessionEndReason): boolean {
    if (this.snapshot.status === 'unauthenticated') return false;

    purgeSessionKeys();
    if (reason === 'signed-out') purgeBuilderDrafts();
    this.heldToken = null;

    // Storage is already clean and status is about to flip; hooks then drop
    // caches so nothing protected can be rendered from a previous session.
    const next = UNAUTHENTICATED(reason);
    this.snapshot = next;
    this.endHooks.forEach((hook) => {
      try {
        hook(reason);
      } catch (err) {
        console.warn('[session] end hook failed', err);
      }
    });
    this.set(next);
    return true;
  }

  /**
   * An API call was rejected as unauthenticated. Only acts if the request was
   * sent with the token that is *still* the current one — a late response
   * from a previous session must not log the next user out.
   */
  reportUnauthorized(tokenSent: string | null): boolean {
    if (!tokenSent || tokenSent !== this.getToken()) return false;
    return this.end('expired');
  }

  // ── profile / role (in-memory + role persisted for the request header) ──

  updateUser(patch: Partial<SessionUser>): void {
    if (!this.snapshot.user) return;
    this.set({ ...this.snapshot, user: { ...this.snapshot.user, ...patch } });
  }

  setRole(role: UserRole): void {
    if (this.snapshot.status !== 'authenticated') return;
    writeKey(SESSION_KEYS.role, role);
    this.set({ ...this.snapshot, role });
  }

  // ── cross-tab ────────────────────────────────────────────────────────────

  /** Another tab changed `localStorage`; keep this tab consistent with it. */
  handleStorageChange(key: string | null): void {
    if (key !== null && key !== SESSION_KEYS.token) return;
    const now = readKey(SESSION_KEYS.token);
    if (!now) {
      // Signed out (or expired) elsewhere. `draftOwner` survives only an expiry.
      this.end(readKey(SESSION_KEYS.draftOwner) ? 'expired' : 'signed-out');
      return;
    }
    if (now !== this.heldToken) {
      // A different login appeared in another tab — reload so this tab
      // restarts cleanly as that user instead of mixing identities.
      if (typeof window !== 'undefined') window.location.reload();
    }
  }

  private reconcileDraftOwner(userId: string | null): void {
    if (!userId) {
      purgeBuilderDrafts();
      return;
    }
    if (readKey(SESSION_KEYS.draftOwner) !== userId) purgeBuilderDrafts();
    writeKey(SESSION_KEYS.draftOwner, userId);
  }
}

export const sessionManager = new SessionManager();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    sessionManager.handleStorageChange(event.key);
  });
}
