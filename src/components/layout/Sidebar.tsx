import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Layers,
  Users,
  UserCheck,
  Globe,
  Hash,
  Radio,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Building2,
  Server,
  Lock,
  Database,
  X,
  Shield,
} from 'lucide-react';
import { PLATFORM_NAV_ITEMS, NavItem } from '../../types/navigation';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, role, hasPermission, hasRole } = useAuth();

  const renderIcon = (name: string, className: string = 'w-4 h-4') => {
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Database':
        return <Database className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'UserCheck':
        return <UserCheck className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Hash':
        return <Hash className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'MessageSquare':
        return <MessageSquare className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Permission-aware filtering:
  // A user must never see navigation items for features they cannot access!
  const isItemVisible = (item: NavItem): boolean => {
    // Super admin has full visibility
    if (role === 'SUPER_ADMIN') return true;

    // Check specific role restrictions
    if (item.allowedRoles && !item.allowedRoles.includes(role)) {
      return false;
    }

    // Check required permissions
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }

    return true;
  };

  const visibleItems = PLATFORM_NAV_ITEMS.filter(isItemVisible);
  const activeItems = visibleItems.filter((item) => item.status === 'active');
  const plannedItems = visibleItems.filter((item) => item.status === 'planned');

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white tracking-tight truncate">
              SMS Platform
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] text-slate-400 font-mono">Phase 07 Live</span>
            </div>
          </div>
        </div>

        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Role Quick Indicator */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-mono text-slate-400 truncate text-[11px]">Role:</span>
          <span className="font-semibold text-slate-200 truncate text-[11px]">{role}</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
          Active
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Active Modules */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Live Modules ({activeItems.length})
            </span>
            <Badge variant="success" size="sm">
              Operational
            </Badge>
          </div>
          <nav className="space-y-1">
            {activeItems.map((item) => {
              const isSelected = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isSelected ? 'text-blue-400' : 'text-slate-500'}>
                    {renderIcon(item.iconName)}
                  </span>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.phase && (
                    <span className="text-[10px] font-mono opacity-50">{item.phase}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Future Modules Preview (Filtered by permission/role) */}
        {plannedItems.length > 0 && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Upcoming Roadmap
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Planned</span>
            </div>
            <nav className="space-y-1">
              {plannedItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 bg-slate-900/40 opacity-70 select-none"
                  title={`${item.label} will be enabled in ${item.phase}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-600">{renderIcon(item.iconName)}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-slate-600">{item.phase}</span>
                    <Lock className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Tech Stack Specs in Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
          <span>Platform Stack</span>
          <span className="text-[10px] font-mono text-slate-500">v1.4.0</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 font-mono">
          <div className="bg-slate-800/80 px-2 py-1 rounded text-center truncate">Express REST</div>
          <div className="bg-slate-800/80 px-2 py-1 rounded text-center truncate">Prisma 6.x</div>
          <div className="bg-slate-800/80 px-2 py-1 rounded text-center truncate">PostgreSQL</div>
          <div className="bg-slate-800/80 px-2 py-1 rounded text-center truncate">RBAC Auth</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed width) */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 flex-col shrink-0 min-h-screen">
        {content}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer content */}
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};
