import React from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ScopeProvider } from '../../context/ScopeContext';
import { ShopScopeProvider } from '../../context/ShopScopeContext';
import { StoreProvider } from '../../contexts/StoreContext';
import { isRouteAllowed, getRequiredRolesForRoute } from '../../utils/permissions';
import { PermissionDenied } from '../states/PermissionDenied';
import { SessionLoadingScreen, SessionUnreachableScreen } from './SessionScreens';

/**
 * Session gate for everything behind the login. Renders the protected tree
 * only in the `authenticated` state — a token string in storage is never
 * enough (see `sessionManager`).
 *
 *   checking        → loading screen
 *   unreachable     → "can't reach the server" (token unverified, NOT expired)
 *   unauthenticated → redirect to /login
 *   authenticated   → providers + <Outlet/>
 */
export const ProtectedRoute: React.FC = () => {
  const { status, userId, restoreError, sessionEndReason, retrySession, logout } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <SessionLoadingScreen />;

  if (status === 'unreachable') {
    return <SessionUnreachableScreen message={restoreError} onRetry={retrySession} onSignOut={logout} />;
  }

  if (status === 'unauthenticated') {
    // Remember where the user was so a re-login resumes there — but not after an
    // explicit sign-out, so the next person to sign in never lands on the last
    // person's page.
    const from = sessionEndReason === 'signed-out' ? undefined : location.pathname + location.search;
    return <Navigate to="/login" replace state={from ? { from } : undefined} />;
  }

  // Everything below holds per-user state (shop scope, counts, store preview).
  // It only exists while authenticated, so it is unmounted — and therefore
  // reset — the moment the session ends, and keyed so a different user can
  // never inherit it.
  return (
    <ScopeProvider key={userId ?? 'session'}>
      <ShopScopeProvider>
        <StoreProvider>
          <Outlet />
        </StoreProvider>
      </ShopScopeProvider>
    </ScopeProvider>
  );
};

/** Role-scope gate for the routes inside the layout (the pre-existing cosmetic check). */
export const RoleRoute: React.FC = () => {
  const { role, setRole } = useAuth();
  const location = useLocation();

  if (!isRouteAllowed(location.pathname, role)) {
    const requiredRoles = getRequiredRolesForRoute(location.pathname);

    return (
      <PermissionDenied
        requiredRole={requiredRoles}
        onSwitchRole={() => {
          // Switch to first role that has access to this restricted route
          const firstAllowed = requiredRoles.split(', ')[0] || 'HQ Admin';
          setRole(firstAllowed as any);
        }}
      />
    );
  }

  return <Outlet />;
};
