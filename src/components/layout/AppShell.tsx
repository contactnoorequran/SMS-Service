/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardOverview } from '../dashboard/DashboardOverview';
import { GlobalSearchModal } from './GlobalSearchModal';
import { apiClient } from '../../services/api';
import { SystemHealthReport } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { getNavItemsForRole } from '../../types/navigation';

interface AppShellProps {
  initialTab?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ initialTab }) => {
  const { role } = useAuth();

  const getTabFromPath = (pathname: string): string => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPath === '/') return 'dashboard';

    // Agent WORLD SMS SERVICE portal routes
    if (cleanPath.startsWith('/sms-ranges')) return 'sms-ranges';
    if (cleanPath.startsWith('/cli-search')) return 'cli-search';
    if (cleanPath.startsWith('/my-numbers')) return 'my-numbers';
    if (cleanPath.startsWith('/bulk-add')) return 'bulk-add';
    if (cleanPath.startsWith('/sms-test-panel')) return 'sms-test-panel';
    if (cleanPath.startsWith('/my-clients')) return 'my-clients';
    if (cleanPath.startsWith('/notifications')) return 'notifications';
    if (cleanPath.startsWith('/cdr-statistics')) return 'cdr-statistics';
    if (cleanPath.startsWith('/credit-notes')) return 'credit-notes';
    if (cleanPath.startsWith('/payment-requests')) return 'payment-requests';
    if (cleanPath.startsWith('/rest-api')) return 'rest-api';
    if (cleanPath.startsWith('/profile-settings')) return 'profile-settings';

    // Manager routes
    if (cleanPath.startsWith('/manager-approvals')) return 'manager-approvals';
    if (cleanPath.startsWith('/managers-team')) return 'managers-team';

    // Client routes
    if (cleanPath.startsWith('/client-numbers')) return 'client-numbers';
    if (cleanPath.startsWith('/client-inbound')) return 'client-inbound';
    if (cleanPath.startsWith('/client-webhooks')) return 'client-webhooks';
    if (cleanPath.startsWith('/client-wallet')) return 'client-wallet';

    // Super Admin routes
    if (cleanPath.startsWith('/allocate-numbers')) return 'allocate-numbers';
    if (cleanPath.startsWith('/providers')) return 'providers';
    if (cleanPath.startsWith('/connections')) return 'connections';
    if (cleanPath.startsWith('/field-sms')) return 'field-sms';
    if (cleanPath.startsWith('/financial-reports')) return 'financial-reports';
    if (cleanPath.startsWith('/clients')) return 'clients';
    if (cleanPath.startsWith('/agents')) return 'agents';
    if (cleanPath.startsWith('/managers')) return 'managers';
    if (cleanPath.startsWith('/users')) return 'users';
    if (cleanPath.startsWith('/numbers')) return 'numbers';
    if (cleanPath.startsWith('/ranges')) return 'ranges';
    if (cleanPath.startsWith('/countries') || cleanPath.startsWith('/operators') || cleanPath.startsWith('/assignments')) return 'numbers';
    if (cleanPath.startsWith('/traffic') || cleanPath.startsWith('/messages')) return 'traffic';
    if (cleanPath.startsWith('/cdr')) return 'cdr';
    if (cleanPath.startsWith('/financials') || cleanPath.startsWith('/billing') || cleanPath.startsWith('/wallets')) return 'financials';
    if (cleanPath.startsWith('/audit')) return 'audit';
    if (cleanPath.startsWith('/settings')) return 'settings';
    if (cleanPath.startsWith('/api') || cleanPath.startsWith('/diagnostics')) return 'diagnostics';
    if (cleanPath.startsWith('/database-schema')) return 'database-schema';
    if (cleanPath.startsWith('/architecture')) return 'architecture';
    return 'not-found';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '') {
      const tab = getTabFromPath(window.location.pathname);
      if (tab !== 'not-found') return tab;
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab]);

  // When user role changes (e.g. from RBAC dropdown switch in UserProfileMenu),
  // verify whether currentTab is valid for the new role; if not, default to dashboard.
  useEffect(() => {
    const validItems = getNavItemsForRole(role);
    const isValid = validItems.some((item) => item.id === currentTab || item.targetTab === currentTab);
    if (!isValid && currentTab !== 'dashboard') {
      setCurrentTab('dashboard');
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', '/');
      }
    }
  }, [role, currentTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  const handleSelectTab = useCallback((tabId: string) => {
    setCurrentTab(tabId);
    if (typeof window !== 'undefined' && window.history) {
      const targetPath = tabId === 'dashboard' ? '/' : `/${tabId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const nextTab = getTabFromPath(window.location.pathname);
        setCurrentTab(nextTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut for Command Palette: Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const result = await apiClient.getHealth();
      setHealth(result.data);
      setLatency(result.latencyMs);
    } catch {
      setHealth(null);
      setLatency(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div data-agent-panel={role === 'AGENT' ? 'true' : undefined} className={` ${role === 'AGENT' ? 'agent-workspace' : ''} flex h-screen w-screen overflow-hidden bg-[var(--bg-deep)] font-sans text-[var(--text-primary)] relative z-10`}>
      {/* Platform Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenMobileSidebar={() => setIsSidebarOpen(true)}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          health={health}
          latency={latency}
          isLoading={isLoadingHealth}
          onRefresh={fetchHealth}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          <DashboardOverview
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            onOpenGlobalSearch={() => setIsSearchOpen(true)}
            health={health}
            latency={latency}
            isLoading={isLoadingHealth}
          />
        </main>
      </div>

      {/* Global Command Palette Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={handleSelectTab}
      />
    </div>
  );
};
