import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SafeUser, UserRole } from '../types/auth';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  role: UserRole;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
}

// Seed accounts configuration for testing and role switching
export const SEED_ACCOUNTS: Record<UserRole, { email: string; pass: string; title: string; desc: string }> = {
  SUPER_ADMIN: {
    email: 'admin@smshub.local',
    pass: 'Admin#Secure2026!',
    title: 'Super Administrator',
    desc: 'Unrestricted control, financial ledgers, audit logs, system settings',
  },
  MANAGER: {
    email: 'manager@smshub.local',
    pass: 'Manager#Secure2026!',
    title: 'Operations Manager',
    desc: 'Provider routes, agent management, number pool allocations',
  },
  AGENT: {
    email: 'agent@smshub.local',
    pass: 'Agent#Secure2026!',
    title: 'Business Agent',
    desc: 'Assigned clients, commission tracking, client message volume',
  },
  CLIENT: {
    email: 'client@smshub.local',
    pass: 'Client#Secure2026!',
    title: 'Enterprise Client',
    desc: 'Dedicated leased numbers, inbound webhook stream, wallet balance',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session and wire automatic re-authentication
  useEffect(() => {
    let isMounted = true;

    // Register seamless reauth handler with API client
    apiClient.setReauthHandler(async () => {
      try {
        const refreshed = await apiClient.refreshToken();
        if (isMounted) {
          setUser(refreshed.user);
          setToken(refreshed.token);
        }
        return refreshed.token;
      } catch {
        // Fall back to silent login with preferred seed account
        try {
          const savedRole = (localStorage.getItem('sms_current_role') as UserRole) || 'SUPER_ADMIN';
          const creds = SEED_ACCOUNTS[savedRole] || SEED_ACCOUNTS.SUPER_ADMIN;
          const res = await apiClient.login(creds.email, creds.pass);
          if (isMounted) {
            setUser(res.user);
            setToken(res.token);
          }
          return res.token;
        } catch {
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
          return null;
        }
      }
    });

    const handleSessionExpired = () => {
      if (isMounted) {
        // Attempt quick recovery
        const savedRole = (localStorage.getItem('sms_current_role') as UserRole) || 'SUPER_ADMIN';
        const creds = SEED_ACCOUNTS[savedRole] || SEED_ACCOUNTS.SUPER_ADMIN;
        apiClient.login(creds.email, creds.pass).then((res) => {
          if (isMounted) {
            setUser(res.user);
            setToken(res.token);
          }
        }).catch(() => {
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        });
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    async function initAuth() {
      setIsLoading(true);
      const savedToken = apiClient.getToken();
      const savedRole = (localStorage.getItem('sms_current_role') as UserRole) || 'SUPER_ADMIN';

      if (savedToken) {
        try {
          const profile = await apiClient.getCurrentUser();
          if (isMounted) {
            setUser(profile);
            setToken(savedToken);
          }
        } catch {
          // Token expired or invalid, authenticate with seed credentials
          try {
            const creds = SEED_ACCOUNTS[savedRole] || SEED_ACCOUNTS.SUPER_ADMIN;
            const res = await apiClient.login(creds.email, creds.pass);
            if (isMounted) {
              setUser(res.user);
              setToken(res.token);
            }
          } catch {
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
        }
      } else {
        // Attempt initial silent login with seed account
        try {
          const creds = SEED_ACCOUNTS[savedRole] || SEED_ACCOUNTS.SUPER_ADMIN;
          const res = await apiClient.login(creds.email, creds.pass);
          if (isMounted) {
            setUser(res.user);
            setToken(res.token);
          }
        } catch {
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const role = useMemo<UserRole>(() => {
    return user?.role.name || 'SUPER_ADMIN';
  }, [user]);

  const permissions = useMemo<string[]>(() => {
    return user?.permissions || [];
  }, [user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role.name === 'SUPER_ADMIN') return true;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (allowed: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (user.role.name === 'SUPER_ADMIN') return true;
      const arr = Array.isArray(allowed) ? allowed : [allowed];
      return arr.includes(user.role.name);
    },
    [user]
  );

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, pass);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUserRole = useCallback(async (newRole: UserRole) => {
    setIsLoading(true);
    try {
      try {
        localStorage.setItem('sms_current_role', newRole);
      } catch {
        // ignore
      }
      const account = SEED_ACCOUNTS[newRole];
      if (account) {
        const res = await apiClient.login(account.email, account.pass);
        setUser(res.user);
        setToken(res.token);
      }
    } catch (err) {
      console.error(`Failed to switch role to ${newRole}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      permissions,
      isAuthenticated: !!user,
      isLoading,
      hasPermission,
      hasRole,
      login,
      logout,
      switchUserRole,
    }),
    [user, token, role, permissions, isLoading, hasPermission, hasRole, login, logout, switchUserRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
