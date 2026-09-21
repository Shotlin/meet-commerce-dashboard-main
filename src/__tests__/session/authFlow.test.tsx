import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { createFakeBackend, installFetch, jsonResponse, makeJwt, NETWORK_ERROR, type FakeUser } from './testUtils';

const ADA: FakeUser = { id: 'user-a', email: 'ada@corp.test', password: 'pw-a', full_name: 'Ada Admin', platform_role: 'HQ_FINANCE' };
const ROOT: FakeUser = { id: 'user-r', email: 'root@corp.test', password: 'pw-r', full_name: 'Root Admin', platform_role: 'SUPER_ADMIN' };
const BOB: FakeUser = { id: 'user-b', email: 'bob@corp.test', password: 'pw-b', full_name: 'Bob Builder', platform_role: 'HQ_MANAGER' };

/**
 * Loads a fresh copy of the app's session modules (the manager decides its
 * first state at import time, exactly as on a page load) and returns a tree
 * that uses the REAL ProtectedRoute / LoginPage / MainLayout (sidebar with
 * the Sign-out button) around two probe pages.
 */
async function bootApp() {
  vi.resetModules();
  const { sessionManager } = await import('../../services/sessionManager');
  const { queryClient } = await import('../../services/queryClient');
  const { apiClient, getActiveShopId, setActiveShopId } = await import('../../services/apiClient');
  const { AuthProvider, useAuth } = await import('../../context/AuthContext');
  const { ProtectedRoute, RoleRoute } = await import('../../components/auth/ProtectedRoute');
  const { LoginPage } = await import('../../pages/LoginPage');
  const { MainLayout } = await import('../../components/layout/MainLayout');
  const { useShopScope } = await import('../../context/ShopScopeContext');

  const renders = { dashboard: 0 };

  const Probe: React.FC<{ name: string }> = ({ name }) => {
    const { userName, role } = useAuth();
    const { activeShopId } = useShopScope();
    renders.dashboard += 1;
    const q = useQuery({ queryKey: ['probe', name], queryFn: () => apiClient.get<{ ok: boolean }>('/api/v1/probe') });
    return (
      <div data-testid={`page-${name}`}>
        <p data-testid="probe-user">{`${userName}|${role}|shop:${activeShopId ?? 'none'}`}</p>
        <p data-testid="probe-data">{q.data ? 'loaded' : q.error ? `error:${(q.error as Error).message}` : 'loading'}</p>
        <Link to="/shops">go-shops</Link>
      </div>
    );
  };

  const Tree = () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route element={<RoleRoute />}>
                  <Route index element={<Probe name="home" />} />
                  <Route path="shops" element={<Probe name="shops" />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

  return { Tree, sessionManager, queryClient, apiClient, getActiveShopId, setActiveShopId, renders };
}

const signIn = async (user: FakeUser) => {
  fireEvent.change(screen.getByPlaceholderText('admin@bakaloo.com'), { target: { value: user.email } });
  fireEvent.change(screen.getByPlaceholderText('Local password'), { target: { value: user.password } });
  fireEvent.click(screen.getByRole('button', { name: /enter hq console/i }));
};

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startup', () => {
  it('valid token: shows a loading state first, NEVER the dashboard, until /me confirms', async () => {
    const backend = createFakeBackend([ADA]);
    const token = backend.issueTokenFor(ADA);
    localStorage.setItem('mc_access_token', token);
    let releaseMe!: () => void;
    const gate = new Promise<void>((r) => (releaseMe = r));
    installFetch(async (call, init) => {
      if (call.path === '/api/v1/admin/auth/me') await gate;
      return backend.handler(call, init);
    });
    const { Tree, renders } = await bootApp();

    render(<Tree />);

    expect(screen.getByText(/checking your session/i)).toBeTruthy();
    expect(screen.queryByTestId('page-home')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(renders.dashboard).toBe(0);

    await act(async () => releaseMe());
    await screen.findByTestId('page-home');
    expect(screen.getByTestId('probe-user').textContent).toMatch(/^Ada Admin\|Finance Lead\|/);
  });

  it('expired token: straight to /login without any network call, banner shown, storage cleared', async () => {
    localStorage.setItem('mc_access_token', makeJwt(-30));
    localStorage.setItem('mc_user_name', 'Stale Admin');
    const calls = installFetch(() => jsonResponse(200, { success: true, data: [] }));
    const { Tree } = await bootApp();

    render(<Tree />);

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(window.location.pathname).toBe('/login');
    expect(screen.getByRole('status').textContent).toMatch(/session has expired/i);
    expect(calls.filter((c) => c.path.includes('/admin/auth/me'))).toHaveLength(0);
    expect(localStorage.getItem('mc_access_token')).toBeNull();
    expect(localStorage.getItem('mc_user_name')).toBeNull();
  });

  it('manually corrupted token → login (no banner, no dashboard)', async () => {
    localStorage.setItem('mc_access_token', 'definitely-not-a-jwt');
    installFetch(() => jsonResponse(200, { success: true, data: [] }));
    const { Tree } = await bootApp();

    render(<Tree />);

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByTestId('page-home')).toBeNull();
    expect(localStorage.getItem('mc_access_token')).toBeNull();
  });

  it('token that looks valid but the server rejects (revoked/tampered) → login with expired notice', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', makeJwt(3600)); // never issued by the backend
    installFetch(backend.handler);
    const { Tree } = await bootApp();

    render(<Tree />);

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(screen.getByRole('status').textContent).toMatch(/session has expired/i);
    expect(screen.queryByTestId('page-home')).toBeNull();
    expect(localStorage.getItem('mc_access_token')).toBeNull();
  });

  it('backend offline at startup: shows a network error, does NOT log out, then recovers on retry', async () => {
    const backend = createFakeBackend([ADA]);
    const token = backend.issueTokenFor(ADA);
    localStorage.setItem('mc_access_token', token);
    backend.state.offline = true;
    installFetch(backend.handler);
    const { Tree } = await bootApp();

    render(<Tree />);

    await screen.findByText(/can't reach the server/i);
    expect(screen.queryByTestId('page-home')).toBeNull();
    expect(screen.queryByRole('button', { name: /enter hq console/i })).toBeNull();
    expect(localStorage.getItem('mc_access_token')).toBe(token); // session NOT classified as expired
    expect(window.location.pathname).toBe('/');

    backend.state.offline = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await screen.findByTestId('page-home');
  });

  it('server 500 on /me is likewise not treated as expiry', async () => {
    const token = makeJwt(3600);
    localStorage.setItem('mc_access_token', token);
    installFetch(() => jsonResponse(500, { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' }));
    const { Tree } = await bootApp();

    render(<Tree />);

    await screen.findByText(/can't reach the server/i);
    expect(localStorage.getItem('mc_access_token')).toBe(token);
  });
});

describe('login', () => {
  it('valid login → dashboard; wrong password → backend message, stays on login', async () => {
    const backend = createFakeBackend([ADA]);
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    window.history.replaceState({}, '', '/login');

    render(<Tree />);
    await signIn({ ...ADA, password: 'wrong' });
    expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password');

    await signIn(ADA);
    await screen.findByTestId('page-home');
    expect(window.location.pathname).toBe('/');
    expect(localStorage.getItem('mc_access_token')).toBeTruthy();
    expect(localStorage.getItem('mc_role')).toBe('Finance Lead');
  });

  it('backend offline at login → network message (not "invalid credentials")', async () => {
    const backend = createFakeBackend([ADA]);
    backend.state.offline = true;
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    window.history.replaceState({}, '', '/login');

    render(<Tree />);
    await signIn(ADA);

    expect((await screen.findByRole('alert')).textContent).toMatch(/unable to reach the server/i);
  });

  it('after an expiry, signing back in resumes the page the user was on', async () => {
    const backend = createFakeBackend([ROOT]);
    const token = backend.issueTokenFor(ROOT);
    localStorage.setItem('mc_access_token', token);
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    window.history.replaceState({}, '', '/shops');

    render(<Tree />);
    await screen.findByTestId('page-shops');

    await act(async () => backend.revokeAll());
    fireEvent.click(screen.getByText('go-shops')); // no-op nav; then force a request that 401s
    await act(async () => {
      await (await import('../../services/apiClient')).apiClient.get('/api/v1/other').catch(() => {});
    });
    await screen.findByRole('button', { name: /enter hq console/i });

    // Issue a fresh session for the same user and sign in again.
    await signIn(ROOT);
    await screen.findByTestId('page-shops');
    expect(window.location.pathname).toBe('/shops');
  });
});

describe('session dies while the dashboard is open', () => {
  it('first 401 redirects to /login, unmounts sidebar + pages, clears everything', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    localStorage.setItem('mc_scope', 'Mumbai Hub');
    installFetch(backend.handler);
    const { Tree, setActiveShopId, getActiveShopId, queryClient, apiClient } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');
    await waitFor(() => expect(screen.getByTestId('probe-data').textContent).toBe('loaded'));
    setActiveShopId('shop-42');
    expect(screen.getByText('Sign out')).toBeTruthy();
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    await act(async () => backend.revokeAll()); // JWT expires / session revoked server-side
    await act(async () => {
      await apiClient.get('/api/v1/anything').catch(() => {});
    });

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(screen.queryByTestId('page-home')).toBeNull();
    expect(screen.queryByText(/Ada Admin/)).toBeNull(); // stale identity gone
    expect(screen.queryByText(/Unauthorized/)).toBeNull(); // no raw error left behind
    expect(screen.getByRole('status').textContent).toMatch(/session has expired/i);
    expect(Object.keys(localStorage).filter((k) => k.startsWith('mc_'))).toEqual(['mc_draft_owner']); // opaque id only
    expect(getActiveShopId()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('many parallel 401s → one logout, one redirect', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    installFetch(backend.handler);
    const { Tree, sessionManager, apiClient } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');
    const ended = vi.fn();
    sessionManager.onEnd(ended);
    const pushState = vi.spyOn(window.history, 'replaceState');

    await act(async () => {
      backend.revokeAll();
      await Promise.allSettled(Array.from({ length: 12 }, (_, i) => apiClient.get(`/api/v1/p${i}`)));
    });

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(ended).toHaveBeenCalledTimes(1);
    expect(pushState.mock.calls.filter(([, , url]) => String(url).includes('/login'))).toHaveLength(1);
  });

  it('403 PERMISSION_DENIED and 500 leave the user signed in', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    installFetch(backend.handler);
    const { Tree, apiClient } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');

    await act(async () => {
      await apiClient.get('/api/v1/probe/forbidden').catch(() => {});
      await apiClient.get('/api/v1/probe/boom').catch(() => {});
    });

    expect(screen.getByTestId('page-home')).toBeTruthy();
    expect(localStorage.getItem('mc_access_token')).toBeTruthy();
  });

  it('backend going offline mid-session shows errors but does not sign out', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    installFetch(backend.handler);
    const { Tree, apiClient } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');

    backend.state.offline = true;
    await act(async () => {
      await apiClient.get('/api/v1/probe').catch(() => {});
    });

    expect(screen.getByTestId('page-home')).toBeTruthy();
    expect(localStorage.getItem('mc_access_token')).toBeTruthy();
  });
});

describe('Sign out', () => {
  it('button clears storage, lands on /login, and works even when the backend is offline and the token is dead', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');

    backend.state.offline = true;
    backend.revokeAll();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByRole('status')).toBeNull(); // deliberate sign-out ≠ "expired" notice
    expect(Object.keys(localStorage).filter((k) => k.startsWith('mc_'))).toEqual([]);
  });

  it('browser Back after sign-out cannot reopen the protected dashboard', async () => {
    const backend = createFakeBackend([ROOT]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ROOT));
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');
    fireEvent.click(screen.getByText('go-shops'));
    await screen.findByTestId('page-shops');

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await screen.findByRole('button', { name: /enter hq console/i });

    await act(async () => {
      window.history.back(); // → /shops (protected)
      await new Promise((r) => setTimeout(r, 50));
    });

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByTestId('page-shops')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
  });
});

describe('user switch: A → sign out → B', () => {
  it('nothing of user A (name, role, shop scope, cached data, request headers) reaches user B', async () => {
    const backend = createFakeBackend([ADA, BOB]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    localStorage.setItem('mc_role', 'Finance Lead');
    const calls = installFetch(backend.handler);
    const { Tree, setActiveShopId, getActiveShopId, queryClient } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');
    await waitFor(() => expect(screen.getByTestId('probe-data').textContent).toBe('loaded'));
    setActiveShopId('shop-of-A');
    localStorage.setItem('mc_scope', 'Mumbai Hub');
    expect(screen.getByTestId('probe-user').textContent).toContain('Ada Admin|Finance Lead');

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await screen.findByRole('button', { name: /enter hq console/i });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(getActiveShopId()).toBeNull();

    const callsBefore = calls.length;
    await signIn(BOB);
    await screen.findByTestId('page-home');
    await waitFor(() => expect(screen.getByTestId('probe-data').textContent).toBe('loaded'));

    const probeUser = screen.getByTestId('probe-user').textContent!;
    expect(probeUser).toBe('Bob Builder|Warehouse Manager|shop:none');
    expect(document.body.textContent).not.toMatch(/Ada Admin|ada@corp\.test/);
    expect(localStorage.getItem('mc_scope')).toBeNull();
    expect(localStorage.getItem('mc_active_shop_id')).toBeNull();
    // Every request B made carries B's token — and none carries A's shop scope.
    const bToken = localStorage.getItem('mc_access_token')!;
    calls.slice(callsBefore).filter((c) => c.path !== '/api/v1/admin/auth/login').forEach((c) => expect(c.authorization).toBe(`Bearer ${bToken}`));
    expect(bToken).not.toBe('');
  });
});

describe('cross-tab', () => {
  it('signing out in another tab signs this tab out too', async () => {
    const backend = createFakeBackend([ADA]);
    localStorage.setItem('mc_access_token', backend.issueTokenFor(ADA));
    installFetch(backend.handler);
    const { Tree } = await bootApp();
    render(<Tree />);
    await screen.findByTestId('page-home');

    await act(async () => {
      localStorage.removeItem('mc_access_token'); // done by the other tab
      window.dispatchEvent(new StorageEvent('storage', { key: 'mc_access_token', storageArea: localStorage }));
    });

    await screen.findByRole('button', { name: /enter hq console/i });
    expect(screen.queryByTestId('page-home')).toBeNull();
  });
});
