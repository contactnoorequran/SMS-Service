import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Hash,
  ChevronRight,
  Filter,
  RotateCcw,
  Download,
  UserCheck,
  UserX,
  CornerDownLeft,
  CheckSquare,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';
import { apiClient } from '../../services/api';

/* ─── Types ─── */
type Allocation = 'all' | 'allocated' | 'unallocated';
type DisplayMode = 'full' | 'local';
type PlanTerm = '7/1' | '15/1' | '30/1';

interface NumberRow {
  id: string;
  fullNumber: string;
  localNumber: string;
  range: string;
  prefix: string;
  clientId: string | null;
  clientName: string | null;
  myPayout: string;
  clientRate: string;
  plan: PlanTerm;
  dailyLimit: number;
  weeklyLimit: number;
  active: boolean;
}

const PLANS: PlanTerm[] = ['7/1', '15/1', '30/1'];


const INIT_COLS: ColumnVisibility[] = [
  { key: 'select', label: 'Select', visible: true },
  { key: 'number', label: 'Number', visible: true },
  { key: 'range', label: 'Range', visible: true },
  { key: 'myPayout', label: 'My Payout', visible: true },
  { key: 'clientRate', label: 'Client rate', visible: true },
  { key: 'plan', label: 'Plan', visible: true },
  { key: 'limits', label: 'Limits', visible: true },
  { key: 'status', label: 'Status', visible: true },
];

/* ─── Download dropdown ─── */
const DownloadDropdown: React.FC<{ numbers: NumberRow[]; display: DisplayMode }> = ({ numbers, display }) => {
  const [open, setOpen] = useState(false);
  const formats = [
    { label: 'Full number', fn: (n: NumberRow) => n.fullNumber },
    { label: 'Local number', fn: (n: NumberRow) => n.localNumber },
    { label: 'Number only (random)', fn: (n: NumberRow) => display === 'full' ? n.fullNumber : n.localNumber },
  ];
  const download = (fn: (n: NumberRow) => string) => {
    const txt = numbers.map(fn).sort(() => Math.random() - 0.5).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'numbers.txt';
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };
  return (
    <div className="relative">
      <button
        id="btn-download-txt-numbers"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Download .txt (random)
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-1">
          {formats.map((f) => (
            <button
              key={f.label}
              onClick={() => download(f.fn)}
              className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Batch Bar ─── */
interface BatchBarProps {
  selected: Set<string>;
  all: NumberRow[];
  onShowAll: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onReturn: () => void;
}
const BatchBar: React.FC<BatchBarProps> = ({ selected, all, onShowAll, onAssign, onUnassign, onReturn }) => {
  const count = selected.size;
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)]">
      <span className="text-[11px] font-semibold text-[var(--accent-blue)] font-mono">
        <CheckSquare className="w-3.5 h-3.5 inline mr-1" />
        {count} selected
      </span>
      <div className="h-4 w-px bg-[rgba(59,130,246,0.3)]" />
      <button
        id="btn-batch-show-all"
        onClick={onShowAll}
        className="px-3 py-1 rounded-lg text-[11px] font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
      >
        Show all
      </button>
      <button
        id={`btn-batch-assign-${count}`}
        onClick={onAssign}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.25)] text-[var(--accent-emerald)] hover:bg-[rgba(16,185,129,0.2)] cursor-pointer transition-all"
      >
        <UserCheck className="w-3 h-3" /> Assign ({count})
      </button>
      <button
        id={`btn-batch-unassign-${count}`}
        onClick={onUnassign}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.25)] text-[var(--accent-amber)] hover:bg-[rgba(245,158,11,0.2)] cursor-pointer transition-all"
      >
        <UserX className="w-3 h-3" /> Unassign ({count})
      </button>
      <button
        id={`btn-batch-return-${count}`}
        onClick={onReturn}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.25)] text-[var(--accent-rose)] hover:bg-[rgba(244,63,94,0.2)] cursor-pointer transition-all"
      >
        <CornerDownLeft className="w-3 h-3" /> Return ({count})
      </button>
    </div>
  );
};

/* ─── Assign Modal ─── */
const AssignModal: React.FC<{ count: number; clients: string[]; onClose: () => void; onConfirm: (client: string) => void }> = ({ count, clients, onClose, onConfirm }) => {
  const [client, setClient] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Assign {count} Number{count !== 1 ? 's' : ''}</h3>
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Select Client</label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]"
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer">Cancel</button>
          <button
            disabled={!client}
            onClick={() => { onConfirm(client); onClose(); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-emerald)] text-black hover:opacity-90 disabled:opacity-40 cursor-pointer"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
export const MyNumbersView: React.FC = () => {
  /* Real numbers and clients loaded from API */
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* Load real API data */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [numRes, clientRes] = await Promise.all([
        apiClient.getNumbers({ limit: 100 }).catch(() => null),
        apiClient.getClients({ limit: 100 }).catch(() => null),
      ]);

      if (numRes && Array.isArray(numRes.items)) {
        const mapped: NumberRow[] = numRes.items.map((n: any) => {
          const full = n.e164 || n.number || '';
          const local = full.replace(/^\+\d{1,3}/, '');
          const rangeName = n.range?.name || n.country?.name || 'Standard Range';
          const prefixStr = n.range?.prefix || n.country?.prefix || full.slice(0, 4) || '+';
          return {
            id: n.id,
            fullNumber: full,
            localNumber: local,
            range: rangeName,
            prefix: prefixStr,
            clientId: n.activeAssignment?.clientId || n.clientId || null,
            clientName: n.activeAssignment?.client?.companyName || n.client?.name || null,
            myPayout: `$${Number(n.payoutRate || 0.045).toFixed(3)}`,
            clientRate: `$${Number(n.clientRate || 0.065).toFixed(3)}`,
            plan: '30/1' as PlanTerm,
            dailyLimit: n.dailySmsLimit || 500,
            weeklyLimit: n.weeklySmsLimit || 3500,
            active: n.status === 'ASSIGNED' || n.status === 'AVAILABLE',
          };
        });
        setNumbers(mapped);
      } else {
        setNumbers([]);
      }

      if (clientRes && Array.isArray(clientRes.items)) {
        const names = clientRes.items.map((c: any) => c.companyName || c.name || `Client #${c.id}`).filter(Boolean);
        setClientNames(names);
      }
    } catch (err) {
      console.warn('Failed to load numbers or clients in MyNumbersView:', err);
      setNumbers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Dynamic filter options from loaded data */
  const availableRanges = useMemo(() => {
    const unique = Array.from(new Set(numbers.map((n) => n.range))).filter(Boolean);
    return ['All ranges', ...unique];
  }, [numbers]);

  const availableClients = useMemo(() => {
    return ['All clients', ...clientNames];
  }, [clientNames]);

  /* Filters */
  const [selectedRange, setSelectedRange] = useState('All ranges');
  const [selectedClient, setSelectedClient] = useState('All clients');
  const [allocation, setAllocation] = useState<Allocation>('all');
  const [startsWith, setStartsWith] = useState('');
  const [rangeContains, setRangeContains] = useState('');
  const [activeFilters, setActiveFilters] = useState({ range: 'All ranges', client: 'All clients', allocation: 'all' as Allocation, startsWith: '', rangeContains: '' });

  /* Table state */
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(INIT_COLS);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState('');

  /* Apply filters */
  const filtered = useMemo(() => {
    let data = numbers;
    if (activeFilters.range !== 'All ranges') data = data.filter((n) => n.range === activeFilters.range);
    if (activeFilters.client !== 'All clients') data = data.filter((n) => n.clientName === activeFilters.client);
    if (activeFilters.allocation === 'allocated') data = data.filter((n) => n.clientId !== null);
    if (activeFilters.allocation === 'unallocated') data = data.filter((n) => n.clientId === null);
    if (activeFilters.startsWith) data = data.filter((n) => n.fullNumber.startsWith(activeFilters.startsWith) || n.localNumber.startsWith(activeFilters.startsWith));
    if (activeFilters.rangeContains) data = data.filter((n) => n.range.toLowerCase().includes(activeFilters.rangeContains.toLowerCase()));

    const q = search.toLowerCase();
    if (q) data = data.filter((n) => n.fullNumber.includes(q) || n.localNumber.includes(q) || (n.clientName || '').toLowerCase().includes(q) || n.range.toLowerCase().includes(q));
    return data;
  }, [numbers, activeFilters, search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allPageIds = paginated.map((n) => n.id);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) allPageIds.forEach((id) => next.delete(id));
      else allPageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleFilter = () => {
    setActiveFilters({ range: selectedRange, client: selectedClient, allocation, startsWith, rangeContains });
    setPage(1);
    setSelected(new Set());
  };

  const handleReset = () => {
    setSelectedRange('All ranges');
    setSelectedClient('All clients');
    setAllocation('all');
    setStartsWith('');
    setRangeContains('');
    setActiveFilters({ range: 'All ranges', client: 'All clients', allocation: 'all', startsWith: '', rangeContains: '' });
    setSearch('');
    setPage(1);
    setSelected(new Set());
  };

  const handleColChange = (key: string, v: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  const exportData = filtered.map((n) => ({
    select: '',
    number: displayMode === 'full' ? n.fullNumber : n.localNumber,
    range: n.range,
    myPayout: n.myPayout,
    clientRate: n.clientRate,
    plan: n.plan,
    limits: `SD : ${n.dailyLimit} | SW : ${n.weeklyLimit}`,
    status: n.active ? 'Active' : 'Inactive',
  }));

  const inputCls = 'glass-input px-3 py-1.5 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] outline-none transition-colors w-full';

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-emerald)] text-black text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(16,185,129,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.25)] flex items-center justify-center">
            <Hash className="w-4 h-4 text-[var(--accent-emerald)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>SMS Module</span><ChevronRight className="w-3 h-3" />
              <span className="text-[var(--text-primary)]">My Numbers</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">My Numbers</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DownloadDropdown numbers={filtered} display={displayMode} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Filters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Select Range */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Select Range</label>
            <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} className={inputCls}>
              {availableRanges.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          {/* Select Client */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Select Client</label>
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className={inputCls}>
              {availableClients.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Number starts with */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Number starts with</label>
            <input type="text" placeholder="+44 791…" value={startsWith} onChange={(e) => setStartsWith(e.target.value)} className={inputCls} />
          </div>
          {/* Range contains */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Range contains</label>
            <input type="text" placeholder="UK, US…" value={rangeContains} onChange={(e) => setRangeContains(e.target.value)} className={inputCls} />
          </div>
          {/* Allocation */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Allocation</label>
            <div className="flex rounded-lg overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-bg)]">
              {(['all', 'allocated', 'unallocated'] as Allocation[]).map((a) => (
                <button
                  key={a}
                  id={`btn-allocation-filter-${a}`}
                  onClick={() => setAllocation(a)}
                  className={`flex-1 py-1.5 text-[10px] font-medium capitalize cursor-pointer transition-all ${
                    allocation === a
                      ? 'bg-[var(--accent-blue)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-my-numbers-filter"
            onClick={handleFilter}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer transition-all"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button
            id="btn-my-numbers-reset"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Manage SMS Numbers — Batch bar + Display toggle */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Manage SMS Numbers</h2>
          {/* Display toggle */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[var(--text-tertiary)]">Display:</span>
            <button
              id="btn-display-full-num"
              onClick={() => setDisplayMode('full')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${displayMode === 'full' ? 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)] text-[var(--accent-blue)]' : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'}`}
            >
              <Eye className="w-3 h-3" /> Full Num
            </button>
            <button
              id="btn-display-local-num"
              onClick={() => setDisplayMode('local')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${displayMode === 'local' ? 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)] text-[var(--accent-blue)]' : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'}`}
            >
              <EyeOff className="w-3 h-3" /> Local Num
            </button>
          </div>
        </div>
        <BatchBar
          selected={selected}
          all={filtered}
          onShowAll={() => setSelected(new Set(filtered.map((n) => n.id)))}
          onAssign={() => setShowAssignModal(true)}
          onUnassign={() => { showToast(`${selected.size} number(s) unassigned`); setSelected(new Set()); }}
          onReturn={() => { showToast(`${selected.size} number(s) returned to pool`); setSelected(new Set()); }}
        />
        {showAssignModal && (
          <AssignModal
            count={selected.size}
            clients={clientNames}
            onClose={() => setShowAssignModal(false)}
            onConfirm={(c) => {
              showToast(`${selected.size} number(s) assigned to ${c}`);
              setSelected(new Set());
            }}
          />
        )}
      </div>

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportData}
            columnDefs={colDefs.filter((c) => c.key !== 'select')}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 accent-[var(--accent-blue)] cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                {colDefs.find(c => c.key === 'number')?.visible && <th className="px-4 py-3.5 text-left">Number</th>}
                {colDefs.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left">Range</th>}
                {colDefs.find(c => c.key === 'myPayout')?.visible && <th className="px-4 py-3.5 text-left">My Payout</th>}
                {colDefs.find(c => c.key === 'clientRate')?.visible && <th className="px-4 py-3.5 text-left">Client rate</th>}
                {colDefs.find(c => c.key === 'plan')?.visible && <th className="px-4 py-3.5 text-left">Plan</th>}
                {colDefs.find(c => c.key === 'limits')?.visible && <th className="px-4 py-3.5 text-left">Limits</th>}
                {colDefs.find(c => c.key === 'status')?.visible && <th className="px-4 py-3.5 text-left">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-[var(--text-tertiary)]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-blue)]" />
                      <span>Loading active numbers from database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No numbers match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((n) => (
                  <tr
                    key={n.id}
                    className={`transition-colors ${selected.has(n.id) ? 'bg-[rgba(59,130,246,0.06)]' : 'hover:bg-[var(--glass-bg-hover)]'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(n.id)}
                        onChange={() => toggleRow(n.id)}
                        className="w-3.5 h-3.5 accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </td>
                    {colDefs.find(c => c.key === 'number')?.visible && (
                      <td className="px-4 py-3">
                        <div className="font-mono text-[var(--text-primary)] text-[11px] font-semibold">
                          {displayMode === 'full' ? n.fullNumber : n.localNumber}
                        </div>
                        {n.clientName && (
                          <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">→ {n.clientName}</div>
                        )}
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'range')?.visible && (
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{n.range}</td>
                    )}
                    {colDefs.find(c => c.key === 'myPayout')?.visible && (
                      <td className="px-4 py-3 font-mono text-[var(--accent-emerald)] text-[11px]">{n.myPayout}</td>
                    )}
                    {colDefs.find(c => c.key === 'clientRate')?.visible && (
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)] text-[11px]">{n.clientRate}</td>
                    )}
                    {colDefs.find(c => c.key === 'plan')?.visible && (
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] border border-[rgba(139,92,246,0.2)]">
                          {n.plan}
                        </span>
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'limits')?.visible && (
                      <td className="px-4 py-3 font-mono text-[10px] text-[var(--text-tertiary)]">
                        SD : {n.dailyLimit} | SW : {n.weeklyLimit}
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'status')?.visible && (
                      <td className="px-4 py-3">
                        {n.active ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" title="Active" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-[var(--glass-border)] inline-block" title="Inactive" />
                        )}
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
            columnDefs={colDefs.filter((c) => c.key !== 'select')}
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

      {/* Assign modal */}
      {showAssignModal && (
        <AssignModal
          count={selected.size}
          onClose={() => setShowAssignModal(false)}
          onConfirm={(c) => {
            showToast(`${selected.size} number(s) assigned to ${c}`);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
};
