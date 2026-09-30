import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  AlertCircle,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../services/api';

interface SmsRange {
  id: string;
  startE164: string;
  endE164: string;
  status: string;
  name: string;
  prefix: string;
  providerId?: string;
  providerName?: string;
  countryName?: string;
  operatorName?: string;
}

const COL_DEFS_INIT: ColumnVisibility[] = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'prefix', label: 'Prefix', visible: true },
  { key: 'testNumber', label: 'Test number', visible: true },
  { key: 'payout', label: '7/1', visible: true },
  { key: 'memo', label: 'Memo', visible: true },
  { key: 'heldRoom', label: 'Held / Room', visible: true },
  { key: 'range', label: 'Range', visible: false },
  { key: 'provider', label: 'Provider', visible: false },
  { key: 'country', label: 'Country', visible: false },
  { key: 'status', label: 'Status', visible: true },
];

export const SmsRangesView: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<SmsRange | null>(null);
  const [ranges, setRanges] = useState<SmsRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(COL_DEFS_INIT);

  const loadRanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/numbers/ranges', {
        headers: {
          Authorization: `Bearer ${apiClient.getToken() || ''}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
      const list = data?.data?.ranges && Array.isArray(data.data.ranges) ? data.data.ranges : [];
      setRanges(list.map((r: any) => ({
        id: r.id,
        name: [r.country?.name, r.operator?.name, r.providerRangeId].filter(Boolean).join(' ') || r.provider?.name || r.startE164,
        prefix: Array.from(String(r.startE164 || '')).filter((_, i, a) => a.slice(0, i + 1).join('') === String(r.endE164 || '').slice(0, i + 1)).join('') || '—',
        startE164: r.startE164,
        endE164: r.endE164,
        status: r.status || 'ACTIVE',
        providerId: r.providerId,
        providerName: r.provider?.name || r.providerName || '—',
        countryName: r.country?.name || r.countryName || '—',
        operatorName: r.operator?.name || r.operatorName,
      })));
    } catch (err: any) {
      setError(err?.message || 'Unable to load SMS ranges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadRanges(); }, [loadRanges]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ranges.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.prefix.toLowerCase().includes(q) ||
        r.startE164.toLowerCase().includes(q) ||
        r.endE164.toLowerCase().includes(q) ||
        (r.providerName || '').toLowerCase().includes(q) ||
        (r.countryName || '').toLowerCase().includes(q),
    );
  }, [ranges, search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleColChange = (key: string, visible: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));

  const exportData = filtered.map((r) => ({
    name: r.name, prefix: r.prefix, testNumber: '—', payout: '—', memo: '—', heldRoom: '—',
    range: `${r.startE164} – ${r.endE164}`,
    provider: r.providerName || '—',
    country: r.countryName || '—',
    status: r.status,
  }));

  return (
    <div className="reference-page space-y-4">
      {/* Page header */}
      <div className="reference-heading glass-card p-5 border-[rgba(139,92,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.25)] flex items-center justify-center">
            <Layers className="w-4 h-4 text-[var(--accent-violet)]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">SMS Ranges</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Available SMS ranges. Unavailable test numbers, payout rates and capacity are shown as —.
            </p>
          </div>
          <button
            id="btn-refresh-sms-ranges"
            onClick={loadRanges}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] text-xs text-[var(--accent-rose)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Unable to load SMS ranges: {error}</span>
          </div>
          <button type="button" onClick={loadRanges} className="font-semibold underline hover:no-underline cursor-pointer ml-3 shrink-0">Retry</button>
        </div>
      )}

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            section="controls"
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
                {colDefs.filter(c => c.visible && ['name', 'prefix', 'testNumber', 'payout', 'memo', 'heldRoom'].includes(c.key)).map(c => <th key={c.key} className="text-left">{c.label}</th>)}
                {colDefs.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left">Range</th>}
                {colDefs.find(c => c.key === 'provider')?.visible && <th className="px-4 py-3.5 text-left">Provider</th>}
                {colDefs.find(c => c.key === 'country')?.visible && <th className="px-4 py-3.5 text-left">Country</th>}
                {colDefs.find(c => c.key === 'status')?.visible && <th className="px-4 py-3.5 text-left">Status</th>}
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={colDefs.filter(c => c.visible).length + 1} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Loading ranges…
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={colDefs.filter(c => c.visible).length + 1} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)]">
                      <Inbox className="w-6 h-6 opacity-50" />
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        {search ? 'No ranges match your search' : 'No SMS ranges configured'}
                      </p>
                      <p className="text-[11px]">Provision number ranges via the Numbers module to see them here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                    {colDefs.filter(c => c.visible && ['name', 'prefix', 'testNumber', 'payout', 'memo', 'heldRoom'].includes(c.key)).map(c => (
                      <td key={c.key} className={c.key === 'name' ? 'font-semibold' : 'font-mono'}>{c.key === 'name' ? r.name : c.key === 'prefix' ? r.prefix : '—'}</td>
                    ))}
                    {colDefs.find(c => c.key === 'range')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[var(--text-primary)] font-semibold text-[11px]">
                          {r.startE164}
                        </span>
                        <span className="text-[var(--text-tertiary)] mx-1">–</span>
                        <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                          {r.endE164}
                        </span>
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'provider')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.providerName || '—'}</td>
                    )}
                    {colDefs.find(c => c.key === 'country')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.countryName || '—'}</td>
                    )}
                    {colDefs.find(c => c.key === 'status')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          r.status === 'ACTIVE'
                            ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-tertiary)]'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    )}
                    <td className="text-right"><button type="button" onClick={() => setSelectedRange(r)} className="bg-[var(--brand-primary)] text-white px-3 py-1.5 text-[11px]">Details</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar
            section="pagination"
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
      <Modal isOpen={!!selectedRange} onClose={() => setSelectedRange(null)} title="Range details" maxWidth="md">
        {selectedRange && <dl className="grid grid-cols-2 gap-3 text-sm p-5">
          <dt>Name</dt><dd>{selectedRange.name}</dd>
          <dt>Start number</dt><dd>{selectedRange.startE164}</dd>
          <dt>End number</dt><dd>{selectedRange.endE164}</dd>
          <dt>Provider</dt><dd>{selectedRange.providerName}</dd>
          <dt>Country</dt><dd>{selectedRange.countryName}</dd>
          <dt>Status</dt><dd>{selectedRange.status}</dd>
        </dl>}
      </Modal>
    </div>
  );
};
