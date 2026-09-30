/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  Search,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Formats current UTC time: Thu, 2026-09-24 08:04:30 UTC */
function formatUtc(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${days[d.getUTCDay()]}, ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

/** Live UTC Clock component — re-renders every second */
const LiveUtcClock: React.FC = () => {
  const [utc, setUtc] = useState(() => formatUtc(new Date()));
  useEffect(() => {
    const id = setInterval(() => setUtc(formatUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[11px] font-mono text-[var(--text-secondary)] shadow-xs shrink-0">
      <Clock className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
      <span>{utc}</span>
    </div>
  );
};

import { Badge } from '../ui/Badge';
import { Breadcrumbs, BreadcrumbItem } from '../ui/Breadcrumbs';
import { BrandLogo } from '../ui/BrandLogo';
import { NotificationsMenu } from './NotificationsMenu';
import { UserProfileMenu } from './UserProfileMenu';
import { ColorModeToggle } from '../theme/ColorModeToggle';
import { PaletteQuickDropdown } from '../theme/PaletteQuickDropdown';
import { SystemHealthReport } from '../../types/api';
import {
  ADMIN_NAV_ITEMS,
  MANAGER_NAV_ITEMS,
  AGENT_NAV_ITEMS,
  CLIENT_NAV_ITEMS,
} from '../../types/navigation';

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
  const { role } = useAuth();

  // Find active navigation item across all system roles
  const allNavItems = [
    ...ADMIN_NAV_ITEMS,
    ...MANAGER_NAV_ITEMS,
    ...AGENT_NAV_ITEMS,
    ...CLIENT_NAV_ITEMS,
  ];
  const currentNav = allNavItems.find(
    (item) => item.id === currentTab || item.targetTab === currentTab
  );

  const tabTitle = currentNav?.label || (currentTab === 'not-found' ? 'Not Found' : 'Dashboard');
  const groupName = currentNav?.group;

  const breadcrumbItems: BreadcrumbItem[] = [];
  if (currentTab === 'dashboard' || !groupName) {
    breadcrumbItems.push({ id: 'dashboard', label: 'Dashboard' });
  } else {
    breadcrumbItems.push(
      { id: 'group', label: groupName },
      { id: 'tab', label: tabTitle }
    );
  }


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
          {latency !== null && <span className="opacity-75">({latency}ms)</span>}
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
      className="h-12 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20"
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

        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-lg p-0.5 cursor-pointer"
            aria-label="WORLD SMS SERVICE — Dashboard"
          >
            <BrandLogo variant="compact" size="sm" />
          </button>
        </div>

        <div className="min-w-0 hidden sm:block md:block">
          <Breadcrumbs
            items={breadcrumbItems}
            onHomeClick={() => onSelectTab('dashboard')}
          />
        </div>
      </div>

      {/* Center Search (Compact, fixed width — not stretched across screen) */}
      <div className="hidden lg:block">
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="w-60 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--glass-bg-active)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
            <span className="truncate">Quick search...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-[var(--glass-bg)] px-1.5 py-0.5 rounded border border-[var(--glass-border)] shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Area: UTC Clock + Health + Role Pill + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live UTC Clock */}
        <LiveUtcClock />

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
          aria-label="Global search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Health Badge */}
        <div className="flex items-center">
          {renderHealthIndicator()}
        </div>

        {/* Discreet Ping/Refresh Icon Button */}
        <button
          id="btn-refresh-health"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh connection status"
          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh API health status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Palette Quick Switcher for Admins */}
        <ColorModeToggle />
        <PaletteQuickDropdown onOpenSettings={() => onSelectTab('settings')} />

        {/* Notifications Area Popover */}
        <NotificationsMenu onNavigateToTab={onSelectTab} />

        {/* User Profile Dropdown Menu (Contains Avatar, Name, and Role) */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
