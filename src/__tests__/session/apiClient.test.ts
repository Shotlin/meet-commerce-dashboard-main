import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFetch, jsonResponse, makeJwt, NETWORK_ERROR, UNAUTHORIZED_BODY } from './testUtils';

async function load() {
  vi.resetModules();
  const sessionManager = (await import('../../services/sessionManager')).sessionManager;
  const api = await import('../../services/apiClient');
  const user = { id: 'u1', name: 'Ada', email: 'a@x.test', phone: '', designation: 'HQ Admin' };
  return { sessionManager, ...api, user };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('global 401 handling', () => {
  it('ends the session on 401 and throws a friendly, typed error', async () => {
    installFetch(() => jsonResponse(401, UNAUTHORIZED_BODY));
    const { sessionManager, apiClient, ApiError, SESSION_EXPIRED_MESSAGE, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');

    const err = await apiClient.get('/api/v1/shops').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.isAuthError).toBe(true);
    expect(err.message).toBe(SESSION_EXPIRED_MESSAGE); // never the raw "Unauthorized — invalid or expired token"
    expect(sessionManager.getSnapshot()).toMatchObject({ status: 'unauthenticated', endReason: 'expired' });
    expect(localStorage.getItem('mc_access_token')).toBeNull();
  });

  it('ten simultaneous 401s → exactly one logout', async () => {
    installFetch(() => jsonResponse(401, UNAUTHORIZED_BODY));
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');
    const hook = vi.fn();
    sessionManager.onEnd(hook);

    const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => apiClient.get(`/api/v1/p${i}`)));

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('requests started after logout carry no Authorization header', async () => {
    const calls = installFetch(() => jsonResponse(401, UNAUTHORIZED_BODY));
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');
    await apiClient.get('/api/v1/a').catch(() => {});
    await apiClient.get('/api/v1/b').catch(() => {});
    expect(calls[0].authorization).toMatch(/^Bearer /);
    expect(calls[1].authorization).toBeNull();
  });

  it('a 401 on login (bad credentials, no token sent) is NOT a session expiry', async () => {
    installFetch(() => jsonResponse(401, { success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }));
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin'); // e.g. a still-valid session in another state
    const hook = vi.fn();
    sessionManager.onEnd(hook);

    const err = await apiClient.request('POST', '/api/v1/admin/auth/login', { body: {}, skipAuth: true }).catch((e) => e);

    expect(err.message).toBe('Invalid email or password');
    expect(err.isAuthError).toBe(false);
    expect(hook).not.toHaveBeenCalled();
  });

  it("a late 401 from a PREVIOUS user's request cannot log the next user out", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    installFetch(async () => {
      await gate;
      return jsonResponse(401, UNAUTHORIZED_BODY);
    });
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600, { n: 'A' }), user, 'HQ Admin');
    const inFlightForA = apiClient.get('/api/v1/slow').catch(() => {});

    sessionManager.end('signed-out');
    sessionManager.begin(makeJwt(3600, { n: 'B' }), { ...user, id: 'u2' }, 'HQ Admin');
    release();
    await inFlightForA;

    expect(sessionManager.getSnapshot().status).toBe('authenticated');
  });

  it('403 PERMISSION_DENIED is an ordinary error, but 403 ACCOUNT_BLOCKED ends the session', async () => {
    installFetch((call) =>
      call.path.endsWith('blocked')
        ? jsonResponse(403, { success: false, message: 'Account is blocked. Contact support.', code: 'ACCOUNT_BLOCKED' })
        : jsonResponse(403, { success: false, message: "Forbidden — requires 'x' permission", code: 'PERMISSION_DENIED' })
    );
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');

    const denied = await apiClient.get('/api/v1/thing').catch((e) => e);
    expect(denied.message).toContain('Forbidden');
    expect(denied.isAuthError).toBe(false);
    expect(sessionManager.getSnapshot().status).toBe('authenticated');

    const blocked = await apiClient.get('/api/v1/blocked').catch((e) => e);
    expect(blocked.message).toBe('Account is blocked. Contact support.');
    expect(sessionManager.getSnapshot().status).toBe('unauthenticated');
  });
});

describe('network / server failures are NOT session expiry', () => {
  it.each([500, 502, 503, 429, 404])('HTTP %i keeps the session', async (status) => {
    installFetch(() => jsonResponse(status, { success: false, message: 'nope', code: 'X' }));
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');

    const err = await apiClient.get('/api/v1/x').catch((e) => e);

    expect(err.status).toBe(status);
    expect(err.isAuthError).toBe(false);
    expect(sessionManager.getSnapshot().status).toBe('authenticated');
  });

  it('offline (fetch rejects) → network error, session intact', async () => {
    installFetch(() => NETWORK_ERROR);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sessionManager, apiClient, user, NETWORK_ERROR_MESSAGE } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');

    const err = await apiClient.get('/api/v1/x').catch((e) => e);

    expect(err.isNetworkError).toBe(true);
    expect(err.message).toBe(NETWORK_ERROR_MESSAGE);
    expect(sessionManager.getSnapshot().status).toBe('authenticated');
  });

  it('timeout aborts as a network error, not an auth error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))))
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sessionManager, apiClient, user } = await load();
    sessionManager.begin(makeJwt(3600), user, 'HQ Admin');

    const pending = apiClient.request('GET', '/api/v1/slow', { timeoutMs: 50 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(60);
    const err = await pending;
    vi.useRealTimers();

    expect(err.isNetworkError).toBe(true);
    expect(err.message).toMatch(/too long/);
    expect(sessionManager.getSnapshot().status).toBe('authenticated');
  });
});
