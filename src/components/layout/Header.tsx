import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Menu } from 'lucide-react';
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
  health,
  latency,
  isLoading,
  onRefresh,
  id,
}) => {
  const currentNav = PLATFORM_NAV_ITEMS.find((item) => item.id === currentTab);
  const tabTitle = currentNav?.label || 'Super Admin Dashboard';

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
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
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
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20"
    >
      {/* Left Area: Mobile Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      {/* Right Area: Status + Notifications + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="hidden lg:inline-flex"
        >
          Ping
        </Button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Notifications Area Popover */}
        <NotificationsMenu onNavigateToTab={onSelectTab} />

        {/* User Profile Dropdown Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
