import React, { useState, useMemo } from 'react';
import {
  Users,
  ChevronRight,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

interface Client {
  id: string;
  username: string;
  name: string;
  email: string;
  contact: string;
  teams: string;
  balance: number;
  active: boolean;
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', username: 'nexus_corp', name: 'Nexus Corporation', email: 'admin@nexuscorp.com', contact: '+1 555-0100', teams: 'Sales, Tech', balance: 2450.00, active: true },
  { id: '2', username: 'alpine_sys', name: 'Alpine Systems', email: 'ops@alpinesys.io', contact: '+44 7700-900200', teams: 'DevOps', balance: 980.50, active: true },
  { id: '3', username: 'clearpath', name: 'ClearPath Ltd', email: 'info@clearpath.co', contact: '+49 30-900400', teams: 'Marketing', balance: 150.00, active: false },
  { id: '4', username: 'orbit_tel', name: 'Orbit Telecom', email: 'billing@orbittelecom.net', contact: '+33 1-900600', teams: 'Finance, Legal', balance: 5120.75, active: true },
  { id: '5', username: 'datastm', name: 'DataStream Inc', email: 'support@datastream.io', contact: '+91 98-000001', teams: 'Support', balance: 0, active: false },
];

const INIT_COLS: ColumnVisibility[] = [
  { key: 'username', label: 'Username', visible: true },
  { key: 'name', label: 'Name', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'contact', label: 'Contact', visible: true },
  { key: 'teams', label: 'Teams', visible: true },
  { key: 'balance', label: 'Balance', visible: true },
  { key: 'active', label: 'Active', visible: true },
  { key: 'actions', label: 'Actions', visible: true },
];

type SortField = 'username' | 'balance' | 'active';

const ManageClientsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative glass-card p-6 w-full max-w-md mx-4 space-y-4">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Manage Clients</h3>
      <p className="text-xs text-[var(--text-secondary)]">Use this panel to invite, configure or remove clients from your portfolio.</p>
      <div className="space-y-2">
        {['Invite new client', 'Edit client settings', 'Remove client'].map((a) => (
          <button key={a} className="w-full text-left px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-xs text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all">
            {a}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer">
          Close
        </button>
      </div>
    </div>
  </div>
);

export const MyClientsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(INIT_COLS);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showManage, setShowManage] = useState(false);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
  };

  const sortIcon = (f: SortField) => {
    if (sortField !== f) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[var(--accent-blue)]" /> : <ArrowDown className="w-3 h-3 text-[var(--accent-blue)]" />;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let data = MOCK_CLIENTS.filter(
      (c) => c.username.includes(q) || c.name.toLowerCase().includes(q) || c.email.includes(q),
    );
    data = [...data].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'username') cmp = a.username.localeCompare(b.username);
      if (sortField === 'balance') cmp = a.balance - b.balance;
      if (sortField === 'active') cmp = Number(b.active) - Number(a.active);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [search, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleColChange = (key: string, v: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  const exportData = filtered.map((c) => ({
    username: c.username, name: c.name, email: c.email, contact: c.contact,
    teams: c.teams, balance: `$${c.balance.toFixed(2)}`, active: c.active ? 'Yes' : 'No', actions: '',
  }));

  const th = (label: string, field?: SortField) => (
    <th
      className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none ${field ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
      onClick={() => field && handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {field && sortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center">
            <Users className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>Users</span><ChevronRight className="w-3 h-3" />
              <span className="text-[var(--text-primary)]">My Clients</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">My Clients</h1>
          </div>
          <div className="ml-auto">
            <button
              id="btn-manage-clients"
              onClick={() => setShowManage(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)]"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage clients
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportData}
            columnDefs={colDefs.filter((c) => c.key !== 'actions')}
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
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)]">
                {colDefs.find(c => c.key === 'username')?.visible && th('Username ↑', 'username')}
                {colDefs.find(c => c.key === 'name')?.visible && th('Name')}
                {colDefs.find(c => c.key === 'email')?.visible && th('Email')}
                {colDefs.find(c => c.key === 'contact')?.visible && th('Contact')}
                {colDefs.find(c => c.key === 'teams')?.visible && th('Teams')}
                {colDefs.find(c => c.key === 'balance')?.visible && th('Balance ↕', 'balance')}
                {colDefs.find(c => c.key === 'active')?.visible && th('Active ↕', 'active')}
                {colDefs.find(c => c.key === 'actions')?.visible && <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">No clients found.</td></tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                    {colDefs.find(col => col.key === 'username')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[var(--accent-blue)] font-semibold">{c.username}</td>
                    )}
                    {colDefs.find(col => col.key === 'name')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-primary)] font-medium">{c.name}</td>
                    )}
                    {colDefs.find(col => col.key === 'email')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.email}</td>
                    )}
                    {colDefs.find(col => col.key === 'contact')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{c.contact}</td>
                    )}
                    {colDefs.find(col => col.key === 'teams')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-tertiary)]">{c.teams}</td>
                    )}
                    {colDefs.find(col => col.key === 'balance')?.visible && (
                      <td className="px-4 py-3.5 font-mono">
                        <span className={c.balance > 0 ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-tertiary)]'}>
                          ${c.balance.toFixed(2)}
                        </span>
                      </td>
                    )}
                    {colDefs.find(col => col.key === 'active')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          c.active
                            ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-tertiary)]'
                        }`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    {colDefs.find(col => col.key === 'actions')?.visible && (
                      <td className="px-4 py-3.5">
                        <button
                          id={`btn-client-view-${c.id}`}
                          className="px-2.5 py-1 rounded-lg text-[11px] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Toolbar BOTTOM */}
        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportData}
            columnDefs={colDefs.filter((c) => c.key !== 'actions')}
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

      {showManage && <ManageClientsModal onClose={() => setShowManage(false)} />}
    </div>
  );
};
