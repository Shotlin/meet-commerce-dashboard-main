import React from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isRouteAllowed, getRequiredRolesForRoute, getPrimaryRouteForRole } from '../../utils/permissions';
import { PermissionDenied } from '../states/PermissionDenied';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, role, setRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const isAllowed = isRouteAllowed(location.pathname, role);

  if (!isAllowed) {
    const requiredRoles = getRequiredRolesForRoute(location.pathname);
    const primaryLanding = getPrimaryRouteForRole(role);

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
