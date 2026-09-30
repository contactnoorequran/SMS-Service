/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  getNavGroupsForRole,
  getNavItemsForRole,
  NavItem,
  NavGroup,
} from '../../types/navigation';
import { Badge } from '../ui/Badge';
import { BrandLogo } from '../ui/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';
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

  const isCollapsed = !isOpen && (externalCollapsed !== undefined ? externalCollapsed : internalCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Partial<Record<NavGroup, boolean>>>({});

  // Keep the current page discoverable when navigation happens outside the sidebar.
  useEffect(() => {
    const activeGroup = getNavItemsForRole(role).find(item =>
      item.id === currentTab || item.targetTab === currentTab
    )?.group;
    if (activeGroup) setExpandedGroups(previous => ({ ...previous, [activeGroup]: true }));
  }, [currentTab, role]);

  const toggleGroup = (group: NavGroup) => {
    setExpandedGroups(previous => ({ ...previous, [group]: !previous[group] }));
  };
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  // Dynamic notification/attention counts (only display when requiring attention)
  const attentionCounts: Record<string, number> = {
    messages: 12,
    traffic: 12,
    'payment-requests': 3,
    'manager-approvals': 3,
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



  const navGroups = getNavGroupsForRole(role);
  const navItems = getNavItemsForRole(role);

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

  const visibleItems = navItems.filter(isItemVisible);

  // Group visible items by their respective NavGroup
  const itemsByGroup = navGroups.reduce<Record<NavGroup, NavItem[]>>((acc, group) => {
    acc[group] = visibleItems.filter((item) => item.group === group);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  const content = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] text-[var(--text-secondary)] select-none">
      {/* Brand Header */}
      <div className={`p-3 border-b border-[var(--glass-border)] flex items-center ${isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-3'} shrink-0`}>
        <button
          type="button"
          onClick={() => {
            onSelectTab('dashboard');
            onClose();
          }}
          className={`flex items-center min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-lg p-0.5 cursor-pointer transition-opacity hover:opacity-90 ${
            isCollapsed ? 'justify-center w-full' : 'gap-2'
          }`}
          aria-label="WORLD SMS SERVICE — Dashboard"
        >
          <BrandLogo
            variant={isCollapsed ? 'symbol' : 'full'}
            size="sm"
            theme="dark"
          />
        </button>

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
            <Shield className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
            <span className="font-mono text-[var(--text-tertiary)]">Role:</span>
            <span className="font-semibold text-[var(--text-primary)] truncate">{role}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--accent-emerald)] bg-[var(--accent-emerald-dim)] px-1.5 py-0.2 rounded border border-[rgba(16,185,129,0.2)]">
            RBAC
          </span>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navGroups.map((group) => {
          const groupItems = itemsByGroup[group];
          if (!groupItems || groupItems.length === 0) return null;
          const isDropdown = groupItems.length > 1;
          const isExpanded = Boolean(expandedGroups[group]);
          const isActiveGroup = groupItems.some(item => item.id === currentTab || item.targetTab === currentTab);

          return (
            <div key={group} className="space-y-1">
              {!isCollapsed && isDropdown && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  aria-expanded={isExpanded}
                  aria-label={group}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-md text-left cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-colors ${isActiveGroup ? 'text-[var(--text-primary)] bg-[var(--brand-primary-soft)]' : 'text-[var(--text-secondary)]'}`}
                >
                  <AppIcon name={groupItems[0].iconName as AppIconName} size="sm" className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{group}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                </button>
              )}

              {/* Collapsed groups are removed from keyboard navigation as well. */}
              <nav
                aria-label={group + ' navigation'}
                hidden={!isCollapsed && isDropdown && !isExpanded}
                className={`space-y-0.5 ${!isCollapsed && isDropdown ? 'ml-5 pl-2 border-l border-[var(--glass-border)]' : ''}`}
              >
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
                      className={`w-full flex items-center gap-2.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer min-w-0 ${
                        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] border border-transparent'
                      }`}
                    >
                      <span className={`shrink-0 ${isSelected ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                        <AppIcon name={item.iconName as AppIconName} size="sm" className="w-4 h-4" />
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>
                          {/* Show badge only when there is something requiring attention */}
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <Badge
                              variant={item.id === 'notifications' ? 'warning' : 'info'}
                              size="sm"
                              className="font-mono text-[10px] px-1.5 py-0 shrink-0"
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
          <span>WORLD SMS SERVICE</span>
          <span>v1.7.0</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible width) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 min-h-screen border-r border-[var(--glass-border)] transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-56'
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
