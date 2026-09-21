import { vi } from 'vitest';

const b64url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A structurally valid (unsigned) JWT. `expiresInSec` may be negative. */
export function makeJwt(expiresInSec: number, extra: Record<string, unknown> = {}): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ id: 'u', exp, ...extra })}.signature`;
}

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const UNAUTHORIZED_BODY = {
  success: false,
  message: 'Unauthorized — invalid or expired token',
  code: 'UNAUTHORIZED',
};

export const NETWORK_ERROR = Symbol('network-error');

export interface RecordedCall {
  path: string;
  method: string;
  authorization: string | null;
}

export type FetchHandler = (call: RecordedCall, init: RequestInit | undefined) => Response | typeof NETWORK_ERROR | Promise<Response | typeof NETWORK_ERROR>;

/** Replaces global fetch; returns the recorded calls. */
export function installFetch(handler: FetchHandler): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const headers = new Headers(init?.headers);
      const call: RecordedCall = {
        path: url.pathname,
        method: (init?.method || 'GET').toUpperCase(),
        authorization: headers.get('authorization'),
      };
      calls.push(call);
      const result = await handler(call, init);
      if (result === NETWORK_ERROR) throw new TypeError('Failed to fetch');
      return result;
    })
  );
  return calls;
}

export interface FakeUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  platform_role: string;
  phone?: string;
}

/**
 * A backend that behaves like the real one where it matters: login issues a
 * token, and EVERY other route answers 401 (same body the real
 * `fastify.authenticate` sends) unless the bearer token is one it issued and
 * has not since revoked.
 */
export function createFakeBackend(users: FakeUser[]) {
  const sessions = new Map<string, FakeUser>();
  const state = { offline: false };

  const userFor = (call: RecordedCall) => {
    const token = call.authorization?.replace(/^Bearer /, '');
    return token ? sessions.get(token) : undefined;
  };

  const handler: FetchHandler = async (call, init) => {
    if (state.offline) return NETWORK_ERROR;

    if (call.path === '/api/v1/admin/auth/login') {
      const body = JSON.parse(String(init?.body ?? '{}'));
      const user = users.find((u) => u.email === body.email && u.password === body.password);
      if (!user) return jsonResponse(401, { success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      const token = makeJwt(3600, { id: user.id });
      sessions.set(token, user);
      return jsonResponse(200, {
        success: true,
        data: { accessToken: token, user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone ?? '', platform_role: user.platform_role } },
      });
    }

    const user = userFor(call);
    if (!user) return jsonResponse(401, UNAUTHORIZED_BODY);

    if (call.path === '/api/v1/admin/auth/me') {
      return jsonResponse(200, {
        success: true,
        data: { user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone ?? '', platform_role: user.platform_role } },
      });
    }
    if (call.path === '/api/v1/probe/forbidden') {
      return jsonResponse(403, { success: false, message: "Forbidden — requires 'x' permission", code: 'PERMISSION_DENIED' });
    }
    if (call.path === '/api/v1/probe/boom') {
      return jsonResponse(500, { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
    return jsonResponse(200, { success: true, data: call.path === '/api/v1/probe' ? { ok: true } : [] });
  };

  return {
    handler,
    sessions,
    state,
    /** Server-side revocation (session_version bump / expiry). */
    revokeAll: () => sessions.clear(),
    issueTokenFor: (user: FakeUser) => {
      const token = makeJwt(3600, { id: user.id });
      sessions.set(token, user);
      return token;
    },
  };
}
