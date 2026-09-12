import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardOverview } from '../dashboard/DashboardOverview';
import { apiClient } from '../../services/api';
import { SystemHealthReport } from '../../types/api';

export const AppShell: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const result = await apiClient.getHealth();
      setHealth(result.data);
      setLatency(result.latencyMs);
    } catch {
      // Degraded or local fallback if backend is momentarily restarting
      setHealth(null);
      setLatency(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Periodic health polling every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Platform Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenMobileSidebar={() => setIsSidebarOpen(true)}
          health={health}
          latency={latency}
          isLoading={isLoadingHealth}
          onRefresh={fetchHealth}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <DashboardOverview
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            health={health}
            latency={latency}
            isLoading={isLoadingHealth}
          />
        </main>
      </div>
    </div>
  );
};
