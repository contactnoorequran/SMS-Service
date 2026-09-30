import React, { useState, useMemo } from 'react';
import { Bell, ChevronRight, Filter, Inbox, Send, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

import { apiClient } from '../../services/api';
import { AppNotification } from '../../types/dashboard';

/* ─── Types ─── */
type Tab = 'inbox' | 'sent';

interface Notification {
  id: string;
  date: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

const INIT_COLS: ColumnVisibility[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'title', label: 'Title', visible: true },
  { key: 'message', label: 'Message', visible: true },
];

const typeColors: Record<string, string> = {
  info: 'text-[var(--accent-blue)] bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.25)]',
  warning: 'text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.25)]',
  success: 'text-[var(--accent-emerald)] bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.25)]',
};

/* ─── Filter modal ─── */
const FilterModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Filter Notifications</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Date from</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Date to</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer">Apply Filter</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
export const AgentNotificationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(INIT_COLS);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getNotifications();
      if (res && Array.isArray(res.items)) {
        const mapped: Notification[] = res.items.map((n: AppNotification) => ({
          id: n.id,
          date: new Date(n.createdAt).toISOString().replace('T', ' ').slice(0, 16),
          title: n.title,
          message: n.message,
          read: n.isRead,
          type: n.type === 'SUCCESS' ? 'success' : n.type === 'WARNING' ? 'warning' : 'info',
        }));
        setNotifications(mapped);
        setReadIds(new Set(mapped.filter((x) => x.read).map((x) => x.id)));
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const rawData = activeTab === 'inbox' ? notifications : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rawData.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
  }, [rawData, search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleRowClick = async (n: Notification) => {
    setExpandedId((prev) => (prev === n.id ? null : n.id));
    if (!readIds.has(n.id)) {
      setReadIds((prev) => new Set(prev).add(n.id));
      try {
        await apiClient.markNotificationRead(n.id);
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setReadIds(new Set(notifications.map((n) => n.id)));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleColChange = (key: string, v: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  const exportData = filtered.map((n) => ({
    date: n.date, title: n.title, message: n.message.slice(0, 80),
  }));

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(245,158,11,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.25)] flex items-center justify-center relative">
            <Bell className="w-4 h-4 text-[var(--accent-amber)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-rose)] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>Users</span><ChevronRight className="w-3 h-3" />
              <span className="text-[var(--text-primary)]">Notifications</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Notifications</h1>
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 gap-1">
          <button
            id="btn-notifications-inbox"
            onClick={() => { setActiveTab('inbox'); setPage(1); setExpandedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'inbox'
                ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.25)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Inbox
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--accent-rose)] text-white">{unreadCount}</span>
            )}
          </button>
          <button
            id="btn-notifications-sent"
            onClick={() => { setActiveTab('sent'); setPage(1); setExpandedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'sent'
                ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.25)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Sent
          </button>
        </div>

        {/* Filter button */}
        <button
          id="btn-notifications-filter"
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
        >
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>

        {unreadCount > 0 && activeTab === 'inbox' && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(16,185,129,0.3)] bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] hover:opacity-90 cursor-pointer transition-all ml-auto"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportData}
            columnDefs={colDefs}
            onColumnVisibilityChange={handleColChange}
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {colDefs.find(c => c.key === 'date')?.visible && <th className="px-4 py-3.5 text-left cursor-pointer hover:text-[var(--text-primary)]">Date ↕</th>}
                {colDefs.find(c => c.key === 'title')?.visible && <th className="px-4 py-3.5 text-left cursor-pointer hover:text-[var(--text-primary)]">Title ↕</th>}
                {colDefs.find(c => c.key === 'message')?.visible && <th className="px-4 py-3.5 text-left">Message</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-xs text-[var(--text-tertiary)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-amber)]" />
                      <span>Loading notifications...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-xs text-[var(--accent-rose)]">
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">{activeTab === 'inbox' ? 'No notifications in your inbox.' : 'No sent notifications.'}</td></tr>
              ) : (
                paginated.map((n) => {
                  const isRead = readIds.has(n.id);
                  const isExpanded = expandedId === n.id;
                  return (
                    <React.Fragment key={n.id}>
                      <tr
                        id={`row-notification-${n.id}`}
                        onClick={() => handleRowClick(n)}
                        className={`border-b border-[var(--glass-border)] cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[rgba(59,130,246,0.06)]' : 'hover:bg-[var(--glass-bg-hover)]'
                        }`}
                      >
                        {colDefs.find(c => c.key === 'date')?.visible && (
                          <td className="px-4 py-3.5 font-mono text-[10px] text-[var(--text-tertiary)] w-52 shrink-0">{n.date}</td>
                        )}
                        {colDefs.find(c => c.key === 'title')?.visible && (
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {!isRead && <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] shrink-0" />}
                              <span className={`font-medium ${isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                {n.title}
                              </span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border capitalize ${typeColors[n.type]}`}>
                                {n.type}
                              </span>
                              {isRead && (
                                <span className="text-[9px] text-[var(--text-tertiary)] ml-auto">read</span>
                              )}
                            </div>
                          </td>
                        )}
                        {colDefs.find(c => c.key === 'message')?.visible && (
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[var(--text-tertiary)] truncate max-w-[300px]">
                                {n.message.slice(0, 60)}{n.message.length > 60 ? '…' : ''}
                              </span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />}
                            </div>
                          </td>
                        )}
                      </tr>
                      {/* Expanded row */}
                      {isExpanded && (
                        <tr className="border-b border-[var(--glass-border)] bg-[rgba(59,130,246,0.04)]">
                          <td colSpan={3} className="px-6 py-4">
                            <div className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">{n.message}</div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Toolbar BOTTOM */}
        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportData}
            columnDefs={colDefs}
            onColumnVisibilityChange={handleColChange}
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
          />
        </div>
      </div>

      {showFilter && <FilterModal onClose={() => setShowFilter(false)} />}
    </div>
  );
};
