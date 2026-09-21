import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { UserRole } from '../types';
import {
  sessionManager,
  type SessionEndReason,
  type SessionStatus,
} from '../services/sessionManager';
import { loginWithPassword, logout, restoreSession, retryRestore, type LoginResult } from '../services/authSession';

interface AuthContextType {
  status: SessionStatus;
  /** True only once the backend has confirmed the session (never just "a token exists"). */
  isAuthenticated: boolean;
  /** Set while unauthenticated: why the last session ended (drives the login notice). */
  sessionEndReason: SessionEndReason | null;
  /** Set while `status === 'unreachable'`. */
  restoreError: string | null;
  userId: string | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userEmail: string;
  userPhone: string;
  userDesignation: string;
  isMfaActive: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => void;
  retrySession: () => void;
  updateProfile: (name: string, email: string, phone?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Only used for the type when there is no session; never displayed. */
const NO_SESSION_ROLE: UserRole = 'HQ Admin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const snapshot = useSyncExternalStore(sessionManager.subscribe, sessionManager.getSnapshot);

  // Startup: verify the stored token with the backend before trusting it.
  useEffect(() => {
    void restoreSession();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      status: snapshot.status,
      isAuthenticated: snapshot.status === 'authenticated',
      sessionEndReason: snapshot.endReason,
      restoreError: snapshot.restoreError,
      userId: snapshot.user?.id ?? null,
      role: snapshot.role ?? NO_SESSION_ROLE,
      setRole: (role) => sessionManager.setRole(role),
      userName: snapshot.user?.name ?? '',
      userEmail: snapshot.user?.email ?? '',
      userPhone: snapshot.user?.phone ?? '',
      userDesignation: snapshot.user?.designation ?? '',
      isMfaActive: true,
      login: loginWithPassword,
      logout,
      retrySession: () => {
        void retryRestore();
      },
      // Local to this session: the dashboard has no backend endpoint for editing
      // a profile, so (as before) this only changes what is displayed.
      updateProfile: (name, email, phone) =>
        sessionManager.updateUser({ name, email, ...(phone ? { phone } : {}) }),
    }),
    [snapshot]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
