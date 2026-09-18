/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserCog,
  Building2,
  Radio,
  Cable,
  Globe,
  Server,
  Layers,
  Hash,
  MessageSquare,
  Receipt,
  Tag,
  Wallet,
  DollarSign,
  CreditCard,
  FileText,
  Bell,
  Code,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PLATFORM_NAV_ITEMS,
  PLATFORM_NAV_GROUPS,
  NavItem,
  NavGroup,
} from '../../types/navigation';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
}) => {
  const { role, hasPermission } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  // Dynamic notification/attention counts (only display when requiring attention)
  const attentionCounts: Record<string, number> = {
    messages: 12,
    'payment-requests': 3,
    notifications: 2,
  };

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const renderIcon = (name: string, className: string = 'w-4 h-4') => {
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'UserCheck':
        return <UserCheck className={className} />;
      case 'UserCog':
        return <UserCog className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Cable':
        return <Cable className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Server':
        return <Server className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Hash':
        return <Hash className={className} />;
      case 'MessageSquare':
        return <MessageSquare className={className} />;
      case 'Receipt':
        return <Receipt className={className} />;
      case 'Tag':
        return <Tag className={className} />;
      case 'Wallet':
        return <Wallet className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'CreditCard':
        return <CreditCard className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Bell':
        return <Bell className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'BarChart3':
        return <BarChart3 className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Permission-aware filtering:
  const isItemVisible = (item: NavItem): boolean => {
    if (role === 'SUPER_ADMIN') return true;
    if (item.allowedRoles && !item.allowedRoles.includes(role)) {
      return false;
    }
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }
    return true;
  };

  const visibleItems = PLATFORM_NAV_ITEMS.filter(isItemVisible);

  // Group visible items by their respective NavGroup
  const itemsByGroup = PLATFORM_NAV_GROUPS.reduce<Record<NavGroup, NavItem[]>>((acc, group) => {
    acc[group] = visibleItems.filter((item) => item.group === group);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  const content = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] text-[var(--text-secondary)] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-bold shadow-md shadow-[var(--accent-blue-dim)] shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-[var(--text-primary)] tracking-tight uppercase">
                Telecom Ops
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse-dot" />
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">Carrier Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Strip (only visible when expanded) */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-b border-[var(--glass-border)] bg-[rgba(0,0,0,0.15)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
            <span className="font-mono text-[var(--text-tertiary)]">Role:</span>
            <span className="font-semibold text-[var(--text-primary)] truncate">{role}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--accent-emerald)] bg-[var(--accent-emerald-dim)] px-1.5 py-0.2 rounded border border-[rgba(16,185,129,0.2)]">
            RBAC
          </span>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {PLATFORM_NAV_GROUPS.map((group) => {
          const groupItems = itemsByGroup[group];
          if (!groupItems || groupItems.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              {/* Clean Group Separator Header */}
              {!isCollapsed ? (
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {group}
                  </span>
                </div>
              ) : (
                <div className="my-2 border-t border-[var(--glass-border)]" />
              )}

              {/* Items in this group */}
              <nav className="space-y-0.5">
                {groupItems.map((item) => {
                  const targetTab = item.targetTab || item.id;
                  const isSelected = currentTab === item.id || currentTab === targetTab;
                  const badgeCount = attentionCounts[item.id];

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      type="button"
                      title={isCollapsed ? `${item.label} (${group})` : undefined}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                      } ${
                        isSelected
                          ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.25)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] border border-transparent'
                      }`}
                    >
                      <span className={isSelected ? 'text-[var(--accent-blue)]' : 'text-[var(--text-tertiary)]'}>
                        {renderIcon(item.iconName)}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {/* Show badge only when there is something requiring attention */}
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <Badge
                              variant={item.id === 'notifications' ? 'warning' : 'info'}
                              size="sm"
                              className="font-mono text-[10px] px-1.5 py-0"
                            >
                              {badgeCount}
                            </Badge>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer Specs (when expanded) */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.15)] text-[10px] text-[var(--text-tertiary)] font-mono flex items-center justify-between shrink-0">
          <span>SMS Carrier Core</span>
          <span>v1.4.0</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible width) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 min-h-screen border-r border-[var(--glass-border)] transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer (with Backdrop) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Main Navigation"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};
