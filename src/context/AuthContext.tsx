import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userEmail: string;
  userPhone: string;
  userDesignation: string;
  isMfaActive: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email: string, phone?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem('mc_access_token')));
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('mc_role') as UserRole) || 'HQ Admin';
  });
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('mc_user_name') || 'Aditya Sharma');
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('mc_user_email') || 'aditya.admin@meetcommerce.com');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('mc_user_phone') || '7013352181');
  const [userDesignation, setUserDesignation] = useState<string>('Lead Product Operations Manager');
  const isMfaActive = true;

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('mc_role', newRole);
  };

  const updateProfile = (name: string, email: string, phone?: string) => {
    setUserName(name);
    setUserEmail(email);
    if (phone) setUserPhone(phone);
    localStorage.setItem('mc_user_name', name);
    localStorage.setItem('mc_user_email', email);
    if (phone) localStorage.setItem('mc_user_phone', phone);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ accessToken: string; user: any }>('/api/v1/admin/auth/login', {
        email,
        password,
      });

      if (response.success && response.data?.accessToken) {
        localStorage.setItem('mc_access_token', response.data.accessToken);
        const user = response.data.user;
        const platformRole = user?.platform_role || user?.platformRole;
        const dashboardRole: UserRole =
          platformRole === 'HQ_FINANCE' ? 'Finance Lead' :
          platformRole === 'HQ_MANAGER' ? 'Warehouse Manager' :
          platformRole === 'HQ_SUPPORT' ? 'Governance Auditor' :
          'HQ Admin';
        setRole(dashboardRole);
        if (user) {
          updateProfile(user.full_name || user.name || 'Local Admin', user.email || email, user.phone || '');
        }
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[Auth Login] Backend login failed.', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('mc_access_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, setRole, userName, userEmail, userPhone, userDesignation, isMfaActive, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
