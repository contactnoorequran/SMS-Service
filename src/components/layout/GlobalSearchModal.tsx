/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Radio,
  Hash,
  MessageSquare,
  Receipt,
  Wallet,
  ShieldCheck,
  Settings,
  X,
  ArrowRight,
  Command,
  CornerDownLeft,
  Server,
  Activity,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'MODULE' | 'USER' | 'PROVIDER' | 'NUMBER' | 'MESSAGING' | 'FINANCE';
  tabId: string;
  icon: React.ReactNode;
  badge?: string;
}

const STATIC_SEARCH_ITEMS: SearchResultItem[] = [
  // Modules
  {
    id: 'mod-dashboard',
    title: 'Dashboard',
    subtitle: 'Executive overview, real-time telemetry, and platform status',
    category: 'MODULE',
    tabId: 'dashboard',
    icon: <LayoutDashboard className="w-4 h-4 text-[var(--accent-blue)]" />,
  },
  {
    id: 'mod-users',
    title: 'Users & RBAC',
    subtitle: 'User directory, security roles, and permission assignments',
    category: 'MODULE',
    tabId: 'users',
    icon: <Users className="w-4 h-4 text-[var(--accent-blue)]" />,
  },
  {
    id: 'mod-managers',
    title: 'Managers',
    subtitle: 'Manage supervisor accounts, capacity, and agent oversight',
    category: 'MODULE',
    tabId: 'managers',
    icon: <UserCheck className="w-4 h-4 text-[var(--accent-cyan)]" />,
  },
  {
    id: 'mod-agents',
    title: 'Agents',
    subtitle: 'Agent directory, commissions, and client portfolio allocations',
    category: 'MODULE',
    tabId: 'agents',
    icon: <Users className="w-4 h-4 text-[var(--accent-violet)]" />,
  },
  {
    id: 'mod-clients',
    title: 'Clients',
    subtitle: 'Enterprise tenant accounts, balances, and API access',
    category: 'MODULE',
    tabId: 'clients',
    icon: <Building2 className="w-4 h-4 text-[var(--accent-emerald)]" />,
  },
  {
    id: 'mod-providers',
    title: 'Providers',
    subtitle: 'Carrier gateways, HTTP/REST and SMPP trunk connections',
    category: 'MODULE',
    tabId: 'providers',
    icon: <Radio className="w-4 h-4 text-[var(--accent-amber)]" />,
  },
  {
    id: 'mod-numbers',
    title: 'Numbers & Inventory',
    subtitle: 'E.164 phone numbers, inventory allocation, and carrier pools',
    category: 'MODULE',
    tabId: 'numbers',
    icon: <Hash className="w-4 h-4 text-[var(--accent-blue)]" />,
  },
  {
    id: 'mod-messages',
    title: 'Messages & Traffic',
    subtitle: 'Inbound SMS stream, delivery statuses, and routing inspection',
    category: 'MODULE',
    tabId: 'traffic',
    icon: <MessageSquare className="w-4 h-4 text-[var(--accent-cyan)]" />,
  },
  {
    id: 'mod-cdr',
    title: 'Call Detail Records (CDR)',
    subtitle: 'Itemized telecom CDR ledger, wholesale cost, and margin clearing',
    category: 'MODULE',
    tabId: 'cdr',
    icon: <Receipt className="w-4 h-4 text-[var(--accent-violet)]" />,
  },
  {
    id: 'mod-billing',
    title: 'Wallets & Ledger',
    subtitle: 'Sub-cent financial ledger, wallet balances, and rate cards',
    category: 'MODULE',
    tabId: 'financials',
    icon: <Wallet className="w-4 h-4 text-[var(--accent-emerald)]" />,
  },
  {
    id: 'mod-audit',
    title: 'Security & Audit Logs',
    subtitle: 'Platform security audit trail, session events, and access logs',
    category: 'MODULE',
    tabId: 'audit',
    icon: <ShieldCheck className="w-4 h-4 text-[var(--accent-rose)]" />,
  },
  {
    id: 'mod-settings',
    title: 'System Settings',
    subtitle: 'Platform configurations, API credentials, and preferences',
    category: 'MODULE',
    tabId: 'settings',
    icon: <Settings className="w-4 h-4 text-[var(--text-secondary)]" />,
  },

  // Sample Carriers & Providers
  {
    id: 'carrier-zain',
    title: 'Zain Telecom Gateway',
    subtitle: 'HTTP REST Carrier Connection • Kuwait (KW)',
    category: 'PROVIDER',
    tabId: 'providers',
    icon: <Radio className="w-4 h-4 text-[var(--accent-amber)]" />,
    badge: 'SMPP / HTTP',
  },
  {
    id: 'carrier-vodafone',
    title: 'Vodafone Enterprise Gateway',
    subtitle: 'Direct Carrier Route • United Kingdom (GB)',
    category: 'PROVIDER',
    tabId: 'providers',
    icon: <Radio className="w-4 h-4 text-[var(--accent-rose)]" />,
    badge: 'Active',
  },
  {
    id: 'carrier-stc',
    title: 'STC Carrier Link',
    subtitle: 'Primary Tier-1 SMS Route • Saudi Arabia (SA)',
    category: 'PROVIDER',
    tabId: 'providers',
    icon: <Radio className="w-4 h-4 text-[var(--accent-violet)]" />,
    badge: 'Active',
  },

  // Sample Numbers
  {
    id: 'num-447',
    title: '+44 7911 123456',
    subtitle: 'United Kingdom • Allocated to Acme Corp',
    category: 'NUMBER',
    tabId: 'numbers',
    icon: <Hash className="w-4 h-4 text-[var(--accent-blue)]" />,
    badge: 'Allocated',
  },
  {
    id: 'num-1415',
    title: '+1 (415) 555-2671',
    subtitle: 'United States • Available in Pool',
    category: 'NUMBER',
    tabId: 'numbers',
    icon: <Hash className="w-4 h-4 text-[var(--accent-emerald)]" />,
    badge: 'Available',
  },
  {
    id: 'num-965',
    title: '+965 9876 5432',
    subtitle: 'Kuwait • Allocated to Gulf Retailers',
    category: 'NUMBER',
    tabId: 'numbers',
    icon: <Hash className="w-4 h-4 text-[var(--accent-violet)]" />,
    badge: 'Allocated',
  },

  // Sample People / Entities
  {
    id: 'usr-sarah',
    title: 'Sarah Jenkins',
    subtitle: 'Regional Operations Manager • Super Admin Team',
    category: 'USER',
    tabId: 'managers',
    icon: <UserCheck className="w-4 h-4 text-[var(--accent-cyan)]" />,
    badge: 'Manager',
  },
  {
    id: 'usr-alex',
    title: 'Alex Rivera',
    subtitle: 'Senior Agent • 18 Managed Clients',
    category: 'USER',
    tabId: 'agents',
    icon: <Users className="w-4 h-4 text-[var(--accent-violet)]" />,
    badge: 'Agent',
  },
  {
    id: 'clt-acme',
    title: 'Acme Global Corp',
    subtitle: 'Enterprise Tenant • 24 Active Numbers • $1,420.50 Balance',
    category: 'USER',
    tabId: 'clients',
    icon: <Building2 className="w-4 h-4 text-[var(--accent-emerald)]" />,
    badge: 'Client',
  },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return STATIC_SEARCH_ITEMS;
    return STATIC_SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [query]);

  // Adjust selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          onSelectTab(item.tabId);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, onSelectTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Platform Search"
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)] bg-[rgba(0,0,0,0.2)]">
          <Search className="w-5 h-5 text-[var(--accent-blue)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, managers, providers, numbers (+44...), CDRs, or modules..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-1.5 py-0.5 rounded">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-tertiary)] space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30" />
              <p>No platform entities or modules match &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] opacity-70">Try searching for a phone number, user name, carrier, or module.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tabId);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="neutral" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono">
          <div className="flex items-center gap-3">
            <span><strong className="text-[var(--text-secondary)]">↑↓</strong> Navigate</span>
            <span><strong className="text-[var(--text-secondary)]">↵</strong> Select</span>
            <span><strong className="text-[var(--text-secondary)]">ESC</strong> Close</span>
          </div>
          <span>Telecom Operations Command</span>
        </div>
      </div>
    </div>
  );
};
