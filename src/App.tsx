/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { UserRole } from './types/auth';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [initialRoleLandingTab, setInitialRoleLandingTab] = useState<string | undefined>(undefined);
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        setPathname(window.location.pathname);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center text-[var(--text-primary)]">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-xl shadow-[var(--accent-blue-glow)] animate-pulse">
          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
          Initializing SMS Service...
        </p>
      </div>
    );
  }

  // If unauthenticated or navigating to /login
  if (!isAuthenticated || !user || pathname === '/login') {
    return (
      <LoginView
        onLoginSuccess={(role: UserRole) => {
          let targetTab = 'dashboard';
          if (role === 'AGENT') {
            targetTab = 'dashboard';
          } else if (role === 'SUPER_ADMIN') {
            targetTab = 'dashboard';
          } else if (role === 'MANAGER') {
            targetTab = 'managers';
          } else if (role === 'CLIENT') {
            targetTab = 'my-numbers';
          }
          setInitialRoleLandingTab(targetTab);
          if (typeof window !== 'undefined') {
            const newPath = targetTab === 'dashboard' ? '/' : `/${targetTab}`;
            window.history.pushState({}, '', newPath);
            setPathname(newPath);
          }
        }}
      />
    );
  }

  return <AppShell initialTab={initialRoleLandingTab} />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppErrorBoundary>
  );
}

