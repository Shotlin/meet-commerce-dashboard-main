import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeJwt } from './testUtils';

/** Fresh module instance per test: the manager decides its first state at import time. */
async function load() {
  vi.resetModules();
  // Capture (instead of registering) the window 'storage' listener so old
  // instances from earlier tests can't react to this test's events.
  const handlers: Array<(e: StorageEvent) => void> = [];
  const add = vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, fn: any) => {
    if (type === 'storage') handlers.push(fn);
  }) as any);
  const mod = await import('../../services/sessionManager');
  add.mockRestore();
  return { ...mod, fireStorage: (key: string | null) => handlers.forEach((h) => h({ key, storageArea: localStorage } as StorageEvent)) };
}

const user = (id = 'user-a') => ({ id, name: 'Ada', email: 'ada@x.test', phone: '1', designation: 'HQ Admin' });

afterEach(() => vi.restoreAllMocks());

describe('startup state', () => {
  it('no token → unauthenticated, and purges stale identity left by older builds', async () => {
    localStorage.setItem('mc_user_name', 'Aditya Sharma');
    localStorage.setItem('mc_user_email', 'admin@bakaloo.com');
    localStorage.setItem('mc_role', 'HQ Admin');
    localStorage.setItem('mc_active_shop_id', 'shop-1');
    const { sessionManager } = await load();
    expect(sessionManager.getSnapshot().status).toBe('unauthenticated');
    expect(Object.keys(localStorage).filter((k) => k.startsWith('mc_'))).toEqual([]);
  });

  it('a well-formed unexpired token is only "checking" — never authenticated on its own', async () => {
    localStorage.setItem('mc_access_token', makeJwt(3600));
    const { sessionManager } = await load();
    expect(sessionManager.getSnapshot().status).toBe('checking');
    expect(sessionManager.getSnapshot().user).toBeNull();
  });

  it('expired token → unauthenticated (expired), storage cleared, no request needed', async () => {
    localStorage.setItem('mc_access_token', makeJwt(-60));
    localStorage.setItem('mc_role', 'Finance Lead');
    const { sessionManager } = await load();
    const snap = sessionManager.getSnapshot();
    expect(snap.status).toBe('unauthenticated');
    expect(snap.endReason).toBe('expired');
    expect(localStorage.getItem('mc_access_token')).toBeNull();
    expect(localStorage.getItem('mc_role')).toBeNull();
  });

  it.each(['garbage', 'a.b', 'a.b.c', '..', 'x.bm90IGpzb24.y'])('corrupt token %j → unauthenticated, no banner', async (token) => {
    localStorage.setItem('mc_access_token', token);
    const { sessionManager } = await load();
    const snap = sessionManager.getSnapshot();
    expect(snap.status).toBe('unauthenticated');
    expect(snap.endReason).toBeNull();
    expect(localStorage.getItem('mc_access_token')).toBeNull();
  });
});

describe('transitions', () => {
  it('confirm() (from /me) is the only way from checking to authenticated', async () => {
    localStorage.setItem('mc_access_token', makeJwt(3600));
    const { sessionManager } = await load();
    sessionManager.confirm(user(), 'Finance Lead');
    const snap = sessionManager.getSnapshot();
    expect(snap.status).toBe('authenticated');
    expect(snap.role).toBe('Finance Lead');
    expect(snap.user?.name).toBe('Ada');
  });

  it('confirm() keeps a previously chosen valid role but ignores a tampered one', async () => {
    localStorage.setItem('mc_access_token', makeJwt(3600));
    localStorage.setItem('mc_role', 'Governance Auditor');
    let m = await load();
    m.sessionManager.confirm(user(), 'HQ Admin');
    expect(m.sessionManager.getSnapshot().role).toBe('Governance Auditor');

    localStorage.setItem('mc_role', 'GOD MODE');
    m = await load();
    m.sessionManager.confirm(user(), 'HQ Admin');
    expect(m.sessionManager.getSnapshot().role).toBe('HQ Admin');
  });

  it('unreachable is distinct from expired: keeps the token and can retry', async () => {
    const token = makeJwt(3600);
    localStorage.setItem('mc_access_token', token);
    const { sessionManager } = await load();
    sessionManager.markUnreachable('offline');
    expect(sessionManager.getSnapshot().status).toBe('unreachable');
    expect(localStorage.getItem('mc_access_token')).toBe(token);
    sessionManager.markChecking();
    expect(sessionManager.getSnapshot().status).toBe('checking');
  });

  it('end() is idempotent — ten concurrent failures produce ONE logout', async () => {
    const token = makeJwt(3600);
    const { sessionManager } = await load();
    sessionManager.begin(token, user(), 'HQ Admin');
    const hook = vi.fn();
    const listener = vi.fn();
    sessionManager.onEnd(hook);
    sessionManager.subscribe(listener);

    const results = Array.from({ length: 10 }, () => sessionManager.reportUnauthorized(token));

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(hook).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(sessionManager.getSnapshot().endReason).toBe('expired');
  });

  it('end() called directly is idempotent too: a second call neither re-runs hooks nor rewrites the reason', async () => {
    const { sessionManager } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'HQ Admin');
    const hook = vi.fn();
    sessionManager.onEnd(hook);

    expect(sessionManager.end('expired')).toBe(true);
    expect(sessionManager.end('signed-out')).toBe(false); // e.g. Sign-out clicked while a 401 was being handled
    expect(sessionManager.end('expired')).toBe(false);

    expect(hook).toHaveBeenCalledTimes(1);
    expect(sessionManager.getSnapshot().endReason).toBe('expired');
  });

  it('ignores an unauthorized report for a token that is no longer current', async () => {
    const { sessionManager } = await load();
    const oldToken = makeJwt(3600, { n: 1 });
    const newToken = makeJwt(3600, { n: 2 });
    sessionManager.begin(oldToken, user('a'), 'HQ Admin');
    sessionManager.end('signed-out');
    sessionManager.begin(newToken, user('b'), 'HQ Admin');

    expect(sessionManager.reportUnauthorized(oldToken)).toBe(false);
    expect(sessionManager.getSnapshot().status).toBe('authenticated');
    expect(sessionManager.getToken()).toBe(newToken);
  });

  it('getToken() is null once ended, so nothing can send the old token', async () => {
    const { sessionManager } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'HQ Admin');
    expect(sessionManager.getToken()).not.toBeNull();
    sessionManager.end('signed-out');
    expect(sessionManager.getToken()).toBeNull();
  });
});

describe('what a finished session clears', () => {
  it('removes every mc_* key and all identity from memory', async () => {
    const { sessionManager, SESSION_KEYS } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'Finance Lead');
    // Simulate everything the app may have written during the session.
    localStorage.setItem(SESSION_KEYS.scope, 'Mumbai Hub');
    localStorage.setItem(SESSION_KEYS.activeShop, 'shop-1');
    localStorage.setItem(SESSION_KEYS.userName, 'x');
    localStorage.setItem(SESSION_KEYS.userEmail, 'x');
    localStorage.setItem(SESSION_KEYS.userPhone, 'x');
    localStorage.setItem('mc_some_future_permission_cache', '{}');
    sessionStorage.setItem('mc_tmp', '1');

    sessionManager.end('signed-out');

    expect(Object.keys(localStorage).filter((k) => k.startsWith('mc_'))).toEqual([]);
    expect(Object.keys(sessionStorage).filter((k) => k.startsWith('mc_'))).toEqual([]);
    const snap = sessionManager.getSnapshot();
    expect(snap.user).toBeNull();
    expect(snap.role).toBeNull();
  });

  it('runs end hooks so caches/scope can be dropped, and survives a throwing hook', async () => {
    const { sessionManager } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'HQ Admin');
    const good = vi.fn();
    sessionManager.onEnd(() => {
      throw new Error('boom');
    });
    sessionManager.onEnd(good);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionManager.end('expired');
    expect(good).toHaveBeenCalledWith('expired');
    expect(sessionManager.getSnapshot().status).toBe('unauthenticated');
  });

  it('builder drafts: kept across an EXPIRY for the same user, purged on sign-out and for a different user', async () => {
    const { sessionManager } = await load();
    const draftKey = 'bakaloo:builder:autosave:tab-1';

    sessionManager.begin(makeJwt(3600), user('user-a'), 'HQ Admin');
    localStorage.setItem(draftKey, '{"draft":true}');

    sessionManager.end('expired');
    expect(localStorage.getItem(draftKey)).toBe('{"draft":true}'); // don't lose work to a 24h expiry
    sessionManager.begin(makeJwt(3600, { n: 2 }), user('user-a'), 'HQ Admin');
    expect(localStorage.getItem(draftKey)).toBe('{"draft":true}'); // same user gets it back

    sessionManager.end('expired');
    sessionManager.begin(makeJwt(3600, { n: 3 }), user('user-b'), 'HQ Admin');
    expect(localStorage.getItem(draftKey)).toBeNull(); // another user never inherits it

    localStorage.setItem(draftKey, '{"draft":"b"}');
    sessionManager.end('signed-out');
    expect(localStorage.getItem(draftKey)).toBeNull();
    expect(localStorage.getItem('mc_draft_owner')).toBeNull();
  });
});

describe('cross-tab', () => {
  it('token removed in another tab → this tab ends too (no storage write needed)', async () => {
    const { sessionManager, fireStorage } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'HQ Admin');
    localStorage.removeItem('mc_access_token'); // what the other tab did
    fireStorage('mc_access_token');
    expect(sessionManager.getSnapshot().status).toBe('unauthenticated');
  });

  it('unrelated keys do not affect the session', async () => {
    const { sessionManager, fireStorage } = await load();
    sessionManager.begin(makeJwt(3600), user(), 'HQ Admin');
    fireStorage('some_other_key');
    expect(sessionManager.getSnapshot().status).toBe('authenticated');
  });
});
