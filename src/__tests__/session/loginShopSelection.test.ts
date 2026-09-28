import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Isolated (no full app render) coverage for loginWithPassword's two
// 2026-09-28 changes: (1) a real single-shop login now carries the
// shop's id/role/name into the resulting session, so the UI can tell a
// shop-scoped session apart from an HQ one; (2) a multi-shop account
// (backend answers requiresShopSelection:true, a real 5-minute
// STORE_PENDING token) used to be silently treated as a normal
// successful login — it now fails cleanly instead, since this
// dashboard has no shop-picker UI for that token yet and it would
// otherwise strand the user mid-session within minutes.

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loginWithPassword — shop-scoped sessions', () => {
  it('a single-shop account carries shopId/shopRole/shopName into the session', async () => {
    const { apiClient } = await import('../../services/apiClient');
    const { sessionManager } = await import('../../services/sessionManager');
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'fake.jwt.token',
        user: { id: 'u1', email: 'manager@fc.in', full_name: 'Priya Manager' },
        shops: [{ shop_id: 'shop-kolkata', shop_role: 'SHOP_MANAGER', shop_name: 'FreshCuts — Kolkata' }],
        isSuperAdmin: false,
        requiresShopSelection: false,
      },
    } as any);

    const { loginWithPassword } = await import('../../services/authSession');
    const result = await loginWithPassword('manager@fc.in', 'pw');

    expect(result.ok).toBe(true);
    const snapshot = sessionManager.getSnapshot();
    expect(snapshot.status).toBe('authenticated');
    expect(snapshot.role).toBe('Shop Manager');
    expect(snapshot.user?.shopId).toBe('shop-kolkata');
    expect(snapshot.user?.shopRole).toBe('SHOP_MANAGER');
    expect(snapshot.user?.shopName).toBe('FreshCuts — Kolkata');
  });

  it('a multi-shop account (requiresShopSelection) fails cleanly instead of silently succeeding with a dead token', async () => {
    const { apiClient } = await import('../../services/apiClient');
    const { sessionManager } = await import('../../services/sessionManager');
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'temp.store-pending.token',
        user: { id: 'u2', email: 'multi@fc.in', full_name: 'Multi Shop' },
        shops: [
          { shop_id: 'shop-a', shop_role: 'SHOP_STAFF', shop_name: 'A' },
          { shop_id: 'shop-b', shop_role: 'SHOP_STAFF', shop_name: 'B' },
        ],
        isSuperAdmin: false,
        requiresShopSelection: true,
      },
    } as any);

    const { loginWithPassword } = await import('../../services/authSession');
    const result = await loginWithPassword('multi@fc.in', 'pw');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/more than one shop/i);
    }
    // Crucially: no session was begun with the short-lived STORE_PENDING
    // token — the dashboard must not look "logged in" on a token that
    // will fail the next real request or expire within minutes.
    expect(sessionManager.getSnapshot().status).toBe('unauthenticated');
  });

  it('an HQ login is unaffected — no shop fields, label resolves from platform_role', async () => {
    const { apiClient } = await import('../../services/apiClient');
    const { sessionManager } = await import('../../services/sessionManager');
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'fake.jwt.token',
        user: { id: 'u3', email: 'admin@fc.in', full_name: 'Admin User', platform_role: 'ADMIN' },
        shops: [],
        isSuperAdmin: true,
        requiresShopSelection: false,
      },
    } as any);

    const { loginWithPassword } = await import('../../services/authSession');
    const result = await loginWithPassword('admin@fc.in', 'pw');

    expect(result.ok).toBe(true);
    const snapshot = sessionManager.getSnapshot();
    expect(snapshot.role).toBe('HQ Admin');
    expect(snapshot.user?.shopId).toBeNull();
  });
});
