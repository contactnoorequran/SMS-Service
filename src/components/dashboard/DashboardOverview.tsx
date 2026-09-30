/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, memo } from 'react';
import { SystemHealthReport } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

// ── Loading skeleton shown while a lazy chunk is fetching ──────────────
const PageSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse">
    <div className="glass-card h-28 rounded-2xl bg-[var(--glass-bg)]" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card h-24 rounded-xl bg-[var(--glass-bg)]" />
      ))}
    </div>
    <div className="glass-card h-64 rounded-2xl bg-[var(--glass-bg)]" />
  </div>
);

// ── Role Dedicated Dashboards ──────────────────────────────────────────
const AdminDashboardView = React.lazy(() =>
  import('./AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);
const ManagerDashboardView = React.lazy(() =>
  import('./ManagerDashboardView').then((m) => ({ default: m.ManagerDashboardView }))
);
const AgentDashboardView = React.lazy(() =>
  import('./AgentDashboardView').then((m) => ({ default: m.AgentDashboardView }))
);
const ClientDashboardView = React.lazy(() =>
  import('./ClientDashboardView').then((m) => ({ default: m.ClientDashboardView }))
);

// ── Manager Dedicated Modules ──────────────────────────────────────────
const ManagerApprovalsView = React.lazy(() =>
  import('./ManagerApprovalsView').then((m) => ({ default: m.ManagerApprovalsView }))
);
const ManagerTeamView = React.lazy(() =>
  import('./ManagerTeamView').then((m) => ({ default: m.ManagerTeamView }))
);

// ── Client Dedicated Modules ───────────────────────────────────────────
const ClientNumbersView = React.lazy(() =>
  import('./ClientNumbersView').then((m) => ({ default: m.ClientNumbersView }))
);
const ClientInboundStreamView = React.lazy(() =>
  import('./ClientInboundStreamView').then((m) => ({ default: m.ClientInboundStreamView }))
);
const ClientWebhookView = React.lazy(() =>
  import('./ClientWebhookView').then((m) => ({ default: m.ClientWebhookView }))
);
const ClientWalletView = React.lazy(() =>
  import('./ClientWalletView').then((m) => ({ default: m.ClientWalletView }))
);

// ── Agent WORLD SMS SERVICE Portal — lazy-loaded ─────────────────────────
const SmsRangesView = React.lazy(() =>
  import('./SmsRangesView').then((m) => ({ default: m.SmsRangesView }))
);
const CliSearchView = React.lazy(() =>
  import('./CliSearchView').then((m) => ({ default: m.CliSearchView }))
);
const MyNumbersView = React.lazy(() =>
  import('./MyNumbersView').then((m) => ({ default: m.MyNumbersView }))
);
const BulkAddView = React.lazy(() =>
  import('./BulkAddView').then((m) => ({ default: m.BulkAddView }))
);
const SmsTestPanelView = React.lazy(() =>
  import('./SmsTestPanelView').then((m) => ({ default: m.SmsTestPanelView }))
);
const MyClientsView = React.lazy(() =>
  import('./MyClientsView').then((m) => ({ default: m.MyClientsView }))
);
const AgentNotificationsView = React.lazy(() =>
  import('./AgentNotificationsView').then((m) => ({ default: m.AgentNotificationsView }))
);
const CdrStatisticsView = React.lazy(() =>
  import('./CdrStatisticsView').then((m) => ({ default: m.CdrStatisticsView }))
);
const CreditNotesView = React.lazy(() =>
  import('./AgentFinanceViews').then((m) => ({ default: m.CreditNotesView }))
);
const PaymentRequestsView = React.lazy(() =>
  import('./AgentFinanceViews').then((m) => ({ default: m.PaymentRequestsView }))
);
const RestApiView = React.lazy(() =>
  import('./AgentFinanceViews').then((m) => ({ default: m.RestApiView }))
);
const ProfileSettingsView = React.lazy(() =>
  import('./AgentFinanceViews').then((m) => ({ default: m.ProfileSettingsView }))
);

// ── Super Admin / Legacy Admin Views — lazy-loaded ─────────────────────
const UsersManagementView = React.lazy(() =>
  import('./UsersManagementView').then((m) => ({ default: m.UsersManagementView }))
);
const AuditLogsView = React.lazy(() =>
  import('./AuditLogsView').then((m) => ({ default: m.AuditLogsView }))
);
const NumberManagementView = React.lazy(() =>
  import('./NumberManagementView').then((m) => ({ default: m.NumberManagementView }))
);
const ManagerManagementView = React.lazy(() =>
  import('./ManagerManagementView').then((m) => ({ default: m.ManagerManagementView }))
);
const AgentManagementView = React.lazy(() =>
  import('./AgentManagementView').then((m) => ({ default: m.AgentManagementView }))
);
const ClientManagementView = React.lazy(() =>
  import('./ClientManagementView').then((m) => ({ default: m.ClientManagementView }))
);
const ProviderManagementView = React.lazy(() =>
  import('./ProviderManagementView').then((m) => ({ default: m.ProviderManagementView }))
);
const MessagingManagementView = React.lazy(() =>
  import('./MessagingManagementView').then((m) => ({ default: m.MessagingManagementView }))
);
const CdrManagementView = React.lazy(() =>
  import('./CdrManagementView').then((m) => ({ default: m.CdrManagementView }))
);
const BillingManagementView = React.lazy(() =>
  import('./BillingManagementView').then((m) => ({ default: m.BillingManagementView }))
);
const FieldSmsView = React.lazy(() =>
  import('./FieldSmsView').then((m) => ({ default: m.FieldSmsView }))
);
const FinancialReportsView = React.lazy(() =>
  import('./FinancialReportsView').then((m) => ({ default: m.FinancialReportsView }))
);
const SettingsView = React.lazy(() =>
  import('./SettingsView').then((m) => ({ default: m.SettingsView }))
);
const DatabaseSchemaViewer = React.lazy(() =>
  import('./DatabaseSchemaViewer').then((m) => ({ default: m.DatabaseSchemaViewer }))
);
const SystemHealthCard = React.lazy(() =>
  import('./SystemHealthCard').then((m) => ({ default: m.SystemHealthCard }))
);
const ApiTesterCard = React.lazy(() =>
  import('./ApiTesterCard').then((m) => ({ default: m.ApiTesterCard }))
);
const DatabaseConfigCard = React.lazy(() =>
  import('./DatabaseConfigCard').then((m) => ({ default: m.DatabaseConfigCard }))
);
const ArchitectureOverviewCard = React.lazy(() =>
  import('./ArchitectureOverviewCard').then((m) => ({ default: m.ArchitectureOverviewCard }))
);
import { NotFoundState } from '../system/NotFoundState';

// ── Known tabs set — used for 404 fallback ─────────────────────────────
const KNOWN_TABS = new Set([
  'dashboard',
  // Agent tabs
  'sms-ranges', 'cli-search', 'my-numbers', 'bulk-add', 'sms-test-panel',
  'my-clients', 'notifications',
  'cdr-statistics', 'credit-notes', 'payment-requests',
  'rest-api', 'profile-settings',
  // Manager tabs
  'manager-approvals', 'managers-team',
  // Client tabs
  'client-numbers', 'client-inbound', 'client-webhooks', 'client-wallet',
  // Super Admin tabs
  'numbers', 'countries', 'operators', 'ranges', 'assignments',
  'managers', 'agents', 'clients', 'providers', 'connections',
  'traffic', 'messages', 'cdr', 'reports', 'field-sms', 'financial-reports',
  'financials', 'billing', 'wallets', 'transactions', 'rates',
  'users', 'audit', 'settings', 'database-schema', 'diagnostics', 'api', 'architecture',
]);

// ── Props ──────────────────────────────────────────────────────────────
interface DashboardOverviewProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenGlobalSearch?: () => void;
  health: SystemHealthReport | null;
  latency: number | null;
  isLoading: boolean;
}

// ── Component ──────────────────────────────────────────────────────────
export const DashboardOverview: React.FC<DashboardOverviewProps> = memo(({
  currentTab,
  onSelectTab,
  onOpenGlobalSearch: _onOpenGlobalSearch,
  health,
  latency,
  isLoading,
}) => {
  const { role } = useAuth();

  const renderPage = () => {
    // ── Multi-Role Primary Dashboard ──
    if (currentTab === 'dashboard') {
      if (role === 'SUPER_ADMIN') {
        return <AdminDashboardView onNavigateToTab={onSelectTab} onOpenGlobalSearch={_onOpenGlobalSearch} />;
      }
      if (role === 'MANAGER') {
        return <ManagerDashboardView onNavigateToTab={onSelectTab} />;
      }
      if (role === 'CLIENT') {
        return <ClientDashboardView onNavigateToTab={onSelectTab} />;
      }
      return <AgentDashboardView onNavigateToTab={onSelectTab} />;
    }

    // ── Manager Dedicated Modules ──
    if (currentTab === 'manager-approvals') return <ManagerApprovalsView />;
    if (currentTab === 'managers-team') return <ManagerTeamView />;

    // ── Client Dedicated Modules ──
    if (currentTab === 'client-numbers') return <ClientNumbersView />;
    if (currentTab === 'client-inbound') return <ClientInboundStreamView />;
    if (currentTab === 'client-webhooks') return <ClientWebhookView />;
    if (currentTab === 'client-wallet') return <ClientWalletView />;

    // ── Agent WORLD SMS SERVICE Portal Modules ──
    if (currentTab === 'sms-ranges')      return <SmsRangesView />;
    if (currentTab === 'cli-search')      return <CliSearchView />;
    if (currentTab === 'my-numbers')      return <MyNumbersView />;
    if (currentTab === 'bulk-add')        return <BulkAddView />;
    if (currentTab === 'sms-test-panel')  return <SmsTestPanelView />;
    if (currentTab === 'my-clients')      return <MyClientsView />;
    if (currentTab === 'notifications')   return <AgentNotificationsView />;
    if (currentTab === 'cdr-statistics')  return <CdrStatisticsView />;
    if (currentTab === 'credit-notes')    return <CreditNotesView />;
    if (currentTab === 'payment-requests') return <PaymentRequestsView />;
    if (currentTab === 'rest-api')        return <RestApiView />;
    if (currentTab === 'profile-settings') return <ProfileSettingsView />;

    // ── Super Admin Modules ──
    if (currentTab === 'users')           return <UsersManagementView />;
    if (currentTab === 'managers')        return <ManagerManagementView />;
    if (currentTab === 'agents')          return <AgentManagementView />;
    if (currentTab === 'clients')         return <ClientManagementView />;

    if (currentTab === 'providers' || currentTab === 'connections')
      return <ProviderManagementView />;

    if (currentTab === 'field-sms')
      return <FieldSmsView />;

    if (currentTab === 'financial-reports')
      return <FinancialReportsView />;

    if (['numbers', 'countries', 'operators', 'ranges', 'assignments'].includes(currentTab))
      return <NumberManagementView />;

    if (currentTab === 'traffic' || currentTab === 'messages')
      return <MessagingManagementView />;

    if (currentTab === 'cdr' || currentTab === 'reports')
      return <CdrManagementView />;

    if (['financials', 'billing', 'wallets', 'transactions', 'rates'].includes(currentTab))
      return <BillingManagementView />;

    if (currentTab === 'audit')           return <AuditLogsView />;
    if (currentTab === 'settings')        return <SettingsView />;

    if (currentTab === 'database-schema')
      return <div className="space-y-6"><DatabaseSchemaViewer /></div>;

    if (currentTab === 'diagnostics' || currentTab === 'api')
      return (
        <div className="space-y-6">
          <SystemHealthCard health={health} latency={latency} isLoading={isLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiTesterCard />
            <DatabaseConfigCard />
          </div>
        </div>
      );

    if (currentTab === 'architecture')
      return (
        <div className="space-y-6">
          <ArchitectureOverviewCard />
          <DatabaseSchemaViewer />
        </div>
      );

    // 404 fallback
    if (!KNOWN_TABS.has(currentTab))
      return (
        <NotFoundState
          title="Page Not Found"
          description={
            currentTab === 'not-found'
              ? 'The URL path requested does not match any existing platform route.'
              : `The module "${currentTab}" is not currently enabled or available in this release.`
          }
          onGoHome={() => onSelectTab('dashboard')}
        />
      );

    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Suspense fallback={<PageSkeleton />}>
        {renderPage()}
      </Suspense>
    </div>
  );
});

DashboardOverview.displayName = 'DashboardOverview';
