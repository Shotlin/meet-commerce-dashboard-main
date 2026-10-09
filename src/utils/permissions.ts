import { UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'HQ Admin': [
    '/', '/overview', '/orders', '/inventory', '/vendors', '/procurement', '/procurement/new', '/procurement/supplies', '/finance', '/analytics',
    '/delivery', '/riders', '/shops', '/coverage-map', '/crm', '/support', '/returns', '/recalls', '/catalogue', '/products/families', '/categories', '/marketing',
    '/content', '/themes', '/themes/new', '/themes/builder', '/loyalty', '/merchandising', '/governance', '/retention', '/abandoned-carts', '/customer-activity', '/first-time-offers', '/cart-milestones', '/customer-segments', '/notifications', '/whatsapp', '/whatsapp/inbox', '/platform', '/configuration', '/configuration/maps', '/configuration/razorpay', '/configuration/shiprocket'
  ],
  'Warehouse Manager': [
    '/', '/orders', '/inventory', '/delivery', '/riders', '/shops', '/coverage-map', '/recalls', '/catalogue', '/procurement', '/procurement/new', '/procurement/supplies'
  ],
  'Vendor': [
    '/', '/vendors', '/inventory', '/catalogue', '/orders'
  ],
  'Fulfilment Agent': [
    '/', '/delivery', '/orders', '/shops'
  ],
  'Finance Lead': [
    '/', '/overview', '/finance', '/analytics', '/loyalty', '/orders', '/vendors'
  ],
  'Governance Auditor': [
    '/', '/governance', '/analytics', '/recalls', '/orders', '/inventory'
  ],
  // Real shop-staff sessions (SHOP_ADMIN/SHOP_MANAGER on the backend —
  // both map to this one cosmetic label, since real authorization is
  // still enforced per-request off the actual shopRole JWT claim, not
  // this frontend label). Deliberately scoped to ONLY what this session
  // actually verified as shop-scope-safe end to end (riders.routes.js's
  // own shop-scoping, this same task) — other pages (orders, shops,
  // etc.) were not audited for shop-staff safety here and are left off
  // this list rather than guessed at; widen it in a future task once
  // each page is actually checked, the same way this one was.
  'Shop Manager': [
    '/', '/riders'
  ],
  // SHOP_STAFF/SHOP_VIEWER — no rider-management access at all (that
  // permission tier starts at SHOP_ADMIN/SHOP_MANAGER; see
  // SHOP_ROLE_DEFAULT_PERMISSIONS on the backend), and nothing else was
  // audited for this label either.
  'Shop Staff': [
    '/'
  ],
};

export const ROLE_LANDING_PAGES: Record<UserRole, string> = {
  'HQ Admin': '/',
  'Warehouse Manager': '/inventory',
  'Vendor': '/vendors',
  'Fulfilment Agent': '/delivery',
  'Finance Lead': '/finance',
  'Governance Auditor': '/governance',
  'Shop Manager': '/riders',
  'Shop Staff': '/',
};

export function isRouteAllowed(routePath: string, role: UserRole): boolean {
  const cleanPath = routePath.split('?')[0].replace(/\/$/, '') || '/';
  const allowedRoutes = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['HQ Admin'];
  if (allowedRoutes.includes(cleanPath)) return true;
  // /themes/:id (theme detail/edit) is the one dynamic-segment route in this
  // app — every other entry above is a static path, so a plain exact-match
  // list can't express it. Treat any allow-listed static prefix as also
  // covering its own dynamic children.
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments[0] === 'themes' && segments.length === 2) {
    return allowedRoutes.includes('/themes');
  }
  if (segments[0] === 'products' && segments[1] === 'families' && segments.length === 3) {
    return allowedRoutes.includes('/products/families');
  }
  // /shops/:id (store detail/edit) — same dynamic-child pattern as above.
  if (segments[0] === 'shops' && segments.length === 2) {
    return allowedRoutes.includes('/shops');
  }
  // /procurement/supplies/:supplyId (supply order detail) — a dynamic child
  // of /procurement/supplies, checked before the generic /procurement/:id
  // rule below so it doesn't get mistaken for a request id.
  if (segments[0] === 'procurement' && segments[1] === 'supplies' && segments.length === 3) {
    return allowedRoutes.includes('/procurement/supplies');
  }
  // /procurement/:id (request detail) — same dynamic-child pattern as /themes/:id.
  if (segments[0] === 'procurement' && segments.length === 2) {
    return allowedRoutes.includes('/procurement');
  }
  return false;
}

export function getPrimaryRouteForRole(role: UserRole): string {
  return ROLE_LANDING_PAGES[role] || '/';
}

export function getRequiredRolesForRoute(routePath: string): string {
  const cleanPath = routePath.split('?')[0].replace(/\/$/, '') || '/';
  const allowedRoles: string[] = [];
  
  (Object.keys(ROLE_PERMISSIONS) as UserRole[]).forEach((role) => {
    if (ROLE_PERMISSIONS[role].includes(cleanPath)) {
      allowedRoles.push(role);
    }
  });

  return allowedRoles.length > 0 ? allowedRoles.join(', ') : 'HQ Admin';
}
