/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemePaletteProvider } from './context/ThemePaletteContext';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { BrandedLoader } from './components/ui/BrandedLoader';
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
    return <BrandedLoader message="Initializing WORLD SMS SERVICE..." />;
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
        <ThemePaletteProvider>
          <AppContent />
        </ThemePaletteProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

