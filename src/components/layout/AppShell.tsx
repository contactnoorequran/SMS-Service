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

export const AppShell: React.FC = () => {
  const getTabFromPath = (pathname: string): string => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPath === '/') return 'dashboard';
    if (cleanPath.startsWith('/providers')) return 'providers';
    if (cleanPath.startsWith('/connections')) return 'connections';
    if (cleanPath.startsWith('/clients')) return 'clients';
    if (cleanPath.startsWith('/agents')) return 'agents';
    if (cleanPath.startsWith('/managers')) return 'managers';
    if (cleanPath.startsWith('/users')) return 'users';
    if (cleanPath.startsWith('/numbers')) return 'numbers';
    if (cleanPath.startsWith('/ranges') || cleanPath.startsWith('/countries') || cleanPath.startsWith('/operators') || cleanPath.startsWith('/assignments')) return 'numbers';
    if (cleanPath.startsWith('/traffic') || cleanPath.startsWith('/messages')) return 'traffic';
    if (cleanPath.startsWith('/cdr')) return 'cdr';
    if (cleanPath.startsWith('/financials') || cleanPath.startsWith('/billing') || cleanPath.startsWith('/wallets') || cleanPath.startsWith('/transactions') || cleanPath.startsWith('/rates') || cleanPath.startsWith('/payment-requests') || cleanPath.startsWith('/credit-notes')) return 'financials';
    if (cleanPath.startsWith('/audit') || cleanPath.startsWith('/notifications')) return 'audit';
    if (cleanPath.startsWith('/settings')) return 'settings';
    if (cleanPath.startsWith('/api') || cleanPath.startsWith('/diagnostics')) return 'diagnostics';
    if (cleanPath.startsWith('/reports')) return 'cdr';
    if (cleanPath.startsWith('/database-schema')) return 'database-schema';
    if (cleanPath.startsWith('/architecture')) return 'architecture';
    return 'not-found';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'dashboard';
  });

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-deep)] font-sans text-[var(--text-primary)] relative z-10">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
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
