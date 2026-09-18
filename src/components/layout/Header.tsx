/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  Search,
  Command,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Breadcrumbs, BreadcrumbItem } from '../ui/Breadcrumbs';
import { NotificationsMenu } from './NotificationsMenu';
import { UserProfileMenu } from './UserProfileMenu';
import { SystemHealthReport } from '../../types/api';
import { PLATFORM_NAV_ITEMS } from '../../types/navigation';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenMobileSidebar: () => void;
  onOpenGlobalSearch: () => void;
  health: SystemHealthReport | null;
  latency: number | null;
  isLoading: boolean;
  onRefresh: () => void;
  id?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileSidebar,
  onOpenGlobalSearch,
  health,
  latency,
  isLoading,
  onRefresh,
  id,
}) => {
  const currentNav = PLATFORM_NAV_ITEMS.find((item) => item.id === currentTab || item.targetTab === currentTab);
  const tabTitle = currentNav?.label || (currentTab === 'not-found' ? 'Not Found' : 'Super Admin Dashboard');

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      id: 'tab',
      label: tabTitle,
    },
  ];

  const renderHealthIndicator = () => {
    if (!health) {
      return (
        <Badge variant="neutral" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
          Connecting...
        </Badge>
      );
    }

    if (health.status === 'healthy') {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Online</span>
          {latency !== null && <span className="opacity-75">({latency}ms)</span>}
        </Badge>
      );
    }

    if (health.status === 'degraded') {
      return (
        <Badge variant="warning" size="sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </Badge>
      );
    }

    return (
      <Badge variant="error" size="sm">
        <XCircle className="w-3.5 h-3.5" />
        <span>Critical</span>
      </Badge>
    );
  };

  return (
    <header
      id={id}
      className="h-16 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20"
    >
      {/* Left Area: Mobile Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <Breadcrumbs
            items={breadcrumbItems}
            onHomeClick={() => onSelectTab('dashboard')}
          />
        </div>
      </div>

      {/* Center / Global Search Trigger */}
      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.3)] border border-[var(--glass-border)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Search users, providers, numbers, CDRs...</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono bg-[var(--glass-bg)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Area: Status + Mobile Search Button + Notifications + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
          aria-label="Global search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Health Badge */}
        <div className="hidden sm:flex items-center">
          {renderHealthIndicator()}
        </div>

        {/* Refresh API Health */}
        <Button
          id="btn-refresh-health"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          aria-label="Refresh API health status"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="hidden lg:inline-flex"
        >
          Ping
        </Button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[var(--glass-border)]" />

        {/* Notifications Area Popover */}
        <NotificationsMenu onNavigateToTab={onSelectTab} />

        {/* User Profile Dropdown Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
