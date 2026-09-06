import { UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'HQ Admin': [
    '/', '/orders', '/warehouse/receiving', '/inventory', '/vendors', '/finance', '/analytics',
    '/fulfilment', '/delivery', '/shops', '/crm', '/support', '/returns', '/recalls', '/catalogue', '/products/families', '/categories', '/marketing',
    '/content', '/themes', '/themes/new', '/themes/builder', '/theme-tabs', '/loyalty', '/merchandising', '/traceability', '/governance', '/retention', '/abandoned-carts', '/customer-activity', '/first-time-offers', '/cart-milestones', '/customer-segments', '/notifications', '/platform', '/configuration', '/configuration/maps'
  ],
  'Warehouse Manager': [
    '/', '/orders', '/warehouse/receiving', '/inventory', '/fulfilment', '/delivery', '/shops', '/recalls', '/catalogue'
  ],
  'Vendor': [
    '/', '/vendors', '/inventory', '/catalogue', '/orders'
  ],
  'Fulfilment Agent': [
    '/', '/fulfilment', '/delivery', '/orders', '/warehouse/receiving', '/shops'
  ],
  'Finance Lead': [
    '/', '/finance', '/analytics', '/loyalty', '/orders', '/vendors'
  ],
  'Governance Auditor': [
    '/', '/governance', '/traceability', '/analytics', '/recalls', '/orders', '/inventory'
  ],
};

export const ROLE_LANDING_PAGES: Record<UserRole, string> = {
  'HQ Admin': '/',
  'Warehouse Manager': '/warehouse/receiving',
  'Vendor': '/vendors',
  'Fulfilment Agent': '/fulfilment',
  'Finance Lead': '/finance',
  'Governance Auditor': '/governance',
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
