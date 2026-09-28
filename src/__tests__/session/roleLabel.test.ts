import { describe, expect, it } from 'vitest';
import { roleLabelFromPlatformRole, toSessionUser } from '../../services/authSession';

// Regression coverage for the 2026-09-28 fix: a shop-staff session (no
// platform_role, only a shopRole from the login/`/me` response's `shops[0]`
// / `active_shop`) used to fall through to a hardcoded 'HQ Admin' default —
// the backend still enforced real permissions per request, but the
// dashboard rendered the ENTIRE HQ nav for an account that could act on
// none of it. See riders.routes.js's own doc comment (backend) and
// utils/permissions.ts's new 'Shop Manager'/'Shop Staff' entries.

describe('roleLabelFromPlatformRole', () => {
  it('HQ roles resolve exactly as before (unaffected by the shop-role param)', () => {
    expect(roleLabelFromPlatformRole('SUPER_ADMIN')).toBe('HQ Admin');
    expect(roleLabelFromPlatformRole('ADMIN')).toBe('HQ Admin');
    expect(roleLabelFromPlatformRole('HQ_FINANCE')).toBe('Finance Lead');
    expect(roleLabelFromPlatformRole('HQ_MANAGER')).toBe('Warehouse Manager');
    expect(roleLabelFromPlatformRole('HQ_SUPPORT')).toBe('Governance Auditor');
  });

  it('an HQ platform_role always wins even if a shopRole is somehow also present', () => {
    expect(roleLabelFromPlatformRole('SUPER_ADMIN', 'SHOP_STAFF')).toBe('HQ Admin');
  });

  it('SHOP_ADMIN / SHOP_MANAGER resolve to Shop Manager — no HQ Admin fallback', () => {
    expect(roleLabelFromPlatformRole(null, 'SHOP_ADMIN')).toBe('Shop Manager');
    expect(roleLabelFromPlatformRole(undefined, 'SHOP_MANAGER')).toBe('Shop Manager');
  });

  it('SHOP_STAFF / SHOP_VIEWER resolve to Shop Staff', () => {
    expect(roleLabelFromPlatformRole(null, 'SHOP_STAFF')).toBe('Shop Staff');
    expect(roleLabelFromPlatformRole(null, 'SHOP_VIEWER')).toBe('Shop Staff');
  });

  it('neither claim present falls back to the least-privileged label, never HQ Admin', () => {
    expect(roleLabelFromPlatformRole(null, null)).toBe('Shop Staff');
    expect(roleLabelFromPlatformRole(undefined, undefined)).toBe('Shop Staff');
  });
});

describe('toSessionUser', () => {
  it('an HQ user gets no shop fields, regardless of a shopAssignment argument', () => {
    const user = toSessionUser(
      { id: 'u1', email: 'admin@fc.in', full_name: 'Admin User', platform_role: 'ADMIN' },
      { shop_id: 'shop-1', shop_role: 'SHOP_ADMIN', shop_name: 'Should be ignored' },
    );
    expect(user.shopId).toBeNull();
    expect(user.shopRole).toBeNull();
    expect(user.shopName).toBeNull();
    expect(user.designation).toBe('Admin');
  });

  it('a shop-staff user carries shopId/shopRole/shopName from the assignment', () => {
    const user = toSessionUser(
      { id: 'u2', email: 'manager@fc.in', full_name: 'Priya Manager' },
      { shop_id: 'shop-kolkata', shop_role: 'SHOP_MANAGER', shop_name: 'FreshCuts — Kolkata' },
    );
    expect(user.shopId).toBe('shop-kolkata');
    expect(user.shopRole).toBe('SHOP_MANAGER');
    expect(user.shopName).toBe('FreshCuts — Kolkata');
    expect(user.designation).toBe('Shop Manager');
  });

  it('no shopAssignment at all (HQ with no shop, or a malformed response) leaves shop fields null', () => {
    const user = toSessionUser({ id: 'u3', email: 'x@fc.in' });
    expect(user.shopId).toBeNull();
    expect(user.shopRole).toBeNull();
    expect(user.shopName).toBeNull();
  });
});
