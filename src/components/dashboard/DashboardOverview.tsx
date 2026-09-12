import React from 'react';
import { SystemHealthCard } from './SystemHealthCard';
import { ArchitectureOverviewCard } from './ArchitectureOverviewCard';
import { ApiTesterCard } from './ApiTesterCard';
import { DatabaseConfigCard } from './DatabaseConfigCard';
import { DatabaseSchemaViewer } from './DatabaseSchemaViewer';
import { AdminDashboardView } from './AdminDashboardView';
import { UsersManagementView } from './UsersManagementView';
import { AuditLogsView } from './AuditLogsView';
import { NumbersInventoryView } from './NumbersInventoryView';
import { ManagerManagementView } from './ManagerManagementView';
import { AgentManagementView } from './AgentManagementView';
import { ClientManagementView } from './ClientManagementView';
import { SystemHealthReport } from '../../types/api';
import { Shield, Sparkles, CheckCircle2, Server, Database, Code } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DashboardOverviewProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  health: SystemHealthReport | null;
  latency: number | null;
  isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentTab,
  onSelectTab,
  health,
  latency,
  isLoading,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Main Content Area based on Tab */}
      {currentTab === 'dashboard' && (
        <AdminDashboardView onNavigateToTab={onSelectTab} />
      )}

      {currentTab === 'numbers' && (
        <NumbersInventoryView />
      )}

      {currentTab === 'users' && (
        <UsersManagementView />
      )}

      {currentTab === 'managers' && (
        <ManagerManagementView />
      )}

      {currentTab === 'agents' && (
        <AgentManagementView />
      )}

      {currentTab === 'clients' && (
        <ClientManagementView />
      )}

      {currentTab === 'audit' && (
        <AuditLogsView />
      )}

      {currentTab === 'database-schema' && (
        <div className="space-y-6">
          <DatabaseSchemaViewer />
        </div>
      )}

      {currentTab === 'diagnostics' && (
        <div className="space-y-6">
          <SystemHealthCard health={health} latency={latency} isLoading={isLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiTesterCard />
            <DatabaseConfigCard />
          </div>
        </div>
      )}

      {currentTab === 'architecture' && (
        <div className="space-y-6">
          <ArchitectureOverviewCard />
          <DatabaseSchemaViewer />
        </div>
      )}

      {/* Fallback for other planned tabs like traffic, providers, financials */}
      {!['dashboard', 'numbers', 'managers', 'agents', 'clients', 'users', 'audit', 'database-schema', 'diagnostics', 'architecture'].includes(currentTab) && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center py-12">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 capitalize">
              {currentTab.replace('-', ' ')} Module
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              This module operates in synchronization with the core telemetry pipeline. Return to the main operations overview to inspect live throughput.
            </p>
            <div className="mt-4">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Overview Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
