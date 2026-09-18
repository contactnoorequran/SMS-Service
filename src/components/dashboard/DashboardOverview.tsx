/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemHealthCard } from './SystemHealthCard';
import { ArchitectureOverviewCard } from './ArchitectureOverviewCard';
import { ApiTesterCard } from './ApiTesterCard';
import { DatabaseConfigCard } from './DatabaseConfigCard';
import { DatabaseSchemaViewer } from './DatabaseSchemaViewer';
import { AdminDashboardView } from './AdminDashboardView';
import { UsersManagementView } from './UsersManagementView';
import { AuditLogsView } from './AuditLogsView';
import { NumberManagementView } from './NumberManagementView';
import { ManagerManagementView } from './ManagerManagementView';
import { AgentManagementView } from './AgentManagementView';
import { ClientManagementView } from './ClientManagementView';
import { ProviderManagementView } from './ProviderManagementView';
import { MessagingManagementView } from './MessagingManagementView';
import { CdrManagementView } from './CdrManagementView';
import { BillingManagementView } from './BillingManagementView';
import { SettingsView } from './SettingsView';
import { NotFoundState } from '../system/NotFoundState';
import { SystemHealthReport } from '../../types/api';

interface DashboardOverviewProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenGlobalSearch?: () => void;
  health: SystemHealthReport | null;
  latency: number | null;
  isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentTab,
  onSelectTab,
  onOpenGlobalSearch,
  health,
  latency,
  isLoading,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Dashboard */}
      {currentTab === 'dashboard' && (
        <AdminDashboardView
          onNavigateToTab={onSelectTab}
          onOpenGlobalSearch={onOpenGlobalSearch}
        />
      )}

      {/* 2. Management Modules */}
      {currentTab === 'users' && <UsersManagementView />}
      {currentTab === 'managers' && <ManagerManagementView />}
      {currentTab === 'agents' && <AgentManagementView />}
      {currentTab === 'clients' && <ClientManagementView />}

      {/* 3. Telecom Modules */}
      {(currentTab === 'providers' || currentTab === 'connections') && (
        <ProviderManagementView />
      )}
      {(currentTab === 'numbers' ||
        currentTab === 'countries' ||
        currentTab === 'operators' ||
        currentTab === 'ranges' ||
        currentTab === 'assignments') && <NumberManagementView />}

      {/* 4. Messaging Modules */}
      {(currentTab === 'traffic' || currentTab === 'messages') && (
        <MessagingManagementView />
      )}
      {(currentTab === 'cdr' || currentTab === 'reports') && <CdrManagementView />}

      {/* 5. Finance Modules */}
      {(currentTab === 'financials' ||
        currentTab === 'billing' ||
        currentTab === 'wallets' ||
        currentTab === 'transactions' ||
        currentTab === 'rates' ||
        currentTab === 'payment-requests' ||
        currentTab === 'credit-notes') && <BillingManagementView />}

      {/* 6. Platform Modules */}
      {(currentTab === 'audit' || currentTab === 'notifications') && <AuditLogsView />}
      {currentTab === 'settings' && <SettingsView />}

      {currentTab === 'database-schema' && (
        <div className="space-y-6">
          <DatabaseSchemaViewer />
        </div>
      )}

      {(currentTab === 'diagnostics' || currentTab === 'api') && (
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

      {/* Fallback for unknown or unsupported routes */}
      {![
        'dashboard',
        'numbers',
        'countries',
        'operators',
        'ranges',
        'assignments',
        'managers',
        'agents',
        'clients',
        'providers',
        'connections',
        'traffic',
        'messages',
        'cdr',
        'reports',
        'financials',
        'billing',
        'wallets',
        'transactions',
        'rates',
        'payment-requests',
        'credit-notes',
        'users',
        'audit',
        'notifications',
        'settings',
        'database-schema',
        'diagnostics',
        'api',
        'architecture',
      ].includes(currentTab) && (
        <NotFoundState
          title="Page Not Found"
          description={
            currentTab === 'not-found'
              ? 'The URL path requested does not match any existing platform route.'
              : `The module "${currentTab}" is not currently enabled or available in this release.`
          }
          onGoHome={() => onSelectTab('dashboard')}
        />
      )}
    </div>
  );
};
