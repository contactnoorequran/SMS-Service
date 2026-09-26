import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

/* ─── Mock data ─── */
interface SmsRange {
  id: string;
  prefix: string;
  testNumber: string;
  memo: string;
  rate: number;
  held: number;
  room: number;
  type: 'free' | 'restricted';
}

const MOCK_RANGES: SmsRange[] = [
  { id: '1', prefix: '+44 7911', testNumber: '+447911123456', memo: '7/1 – Premium UK', rate: 0.0082, held: 12, room: 88, type: 'free' },
  { id: '2', prefix: '+1 213', testNumber: '+12139998877', memo: '7/1 – US California', rate: 0.0050, held: 5, room: 95, type: 'free' },
  { id: '3', prefix: '+49 151', testNumber: '+491511234567', memo: '15/1 – Germany Mobile', rate: 0.0120, held: 30, room: 20, type: 'restricted' },
  { id: '4', prefix: '+33 6', testNumber: '+33612345678', memo: '7/1 – France Mobile', rate: 0.0095, held: 8, room: 42, type: 'free' },
  { id: '5', prefix: '+61 4', testNumber: '+61412345678', memo: '30/1 – Australia Mobile', rate: 0.0140, held: 0, room: 100, type: 'restricted' },
  { id: '6', prefix: '+91 98', testNumber: '+919812345678', memo: '7/1 – India Airtel', rate: 0.0035, held: 3, room: 97, type: 'free' },
  { id: '7', prefix: '+55 11', testNumber: '+5511912345678', memo: '15/1 – Brazil São Paulo', rate: 0.0068, held: 15, room: 60, type: 'free' },
  { id: '8', prefix: '+81 90', testNumber: '+819012345678', memo: '30/1 – Japan Docomo', rate: 0.0180, held: 0, room: 100, type: 'restricted' },
];

const COL_DEFS_INIT: ColumnVisibility[] = [
  { key: 'prefix', label: 'Prefix', visible: true },
  { key: 'testNumber', label: 'Test Number', visible: true },
  { key: 'memo', label: 'Memo (Rate)', visible: true },
  { key: 'heldRoom', label: 'Held / Room', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

/* ─── Request confirmation modal ─── */
const RequestModal: React.FC<{
  range: SmsRange | null;
  onClose: () => void;
  onConfirm: (r: SmsRange) => void;
}> = ({ range, onClose, onConfirm }) => {
  if (!range) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Request Range</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Confirm request for prefix <strong className="text-[var(--text-primary)] font-mono">{range.prefix}</strong>?
          <br />
          <span className="text-[11px] text-[var(--text-tertiary)]">{range.memo} · Room: {range.room}</span>
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer">Cancel</button>
          <button
            onClick={() => { onConfirm(range); onClose(); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer transition-opacity"
          >
            Confirm Request
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── AskSupport modal ─── */
const SupportModal: React.FC<{ range: SmsRange | null; onClose: () => void }> = ({ range, onClose }) => {
  const [msg, setMsg] = useState('');
  if (!range) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Ask Support</h3>
        <p className="text-xs text-[var(--text-tertiary)]">
          Prefix: <strong className="text-[var(--text-primary)] font-mono">{range.prefix}</strong> — {range.memo}
        </p>
        <textarea
          rows={3}
          placeholder="Describe your requirement…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full glass-input p-3 text-xs rounded-lg resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer">Cancel</button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-amber)] text-black hover:opacity-90 cursor-pointer transition-opacity"
          >
            Send to Support
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
export const SmsRangesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(COL_DEFS_INIT);
  const [requestTarget, setRequestTarget] = useState<SmsRange | null>(null);
  const [supportTarget, setSupportTarget] = useState<SmsRange | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_RANGES.filter(
      (r) =>
        r.prefix.toLowerCase().includes(q) ||
        r.testNumber.toLowerCase().includes(q) ||
        r.memo.toLowerCase().includes(q),
    );
  }, [search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleColChange = (key: string, visible: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));

  const handleConfirm = (r: SmsRange) => {
    setSuccessIds((prev) => new Set(prev).add(r.id));
  };

  const exportData = filtered.map((r) => ({
    prefix: r.prefix,
    testNumber: r.testNumber,
    memo: r.memo,
    heldRoom: `${r.held < 0 ? r.held : '-' + String(r.held).padStart(2, '0')} / ${r.room}`,
    action: r.type,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(139,92,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.25)] flex items-center justify-center">
            <Layers className="w-4 h-4 text-[var(--accent-violet)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">SMS Ranges</h1>
          </div>
        </div>
        <p className="relative text-xs text-[var(--text-secondary)] ml-12">
          Browse available E.164 prefixes. Request free ranges or contact support for restricted routes.
        </p>
      </div>

      {/* Table card */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {colDefs.find(c => c.key === 'prefix')?.visible && <th className="px-4 py-3.5 text-left w-36">Prefix</th>}
                {colDefs.find(c => c.key === 'testNumber')?.visible && <th className="px-4 py-3.5 text-left w-44">Test Number</th>}
                {colDefs.find(c => c.key === 'memo')?.visible && <th className="px-4 py-3.5 text-left w-64">Memo (Rate)</th>}
                {colDefs.find(c => c.key === 'heldRoom')?.visible && <th className="px-4 py-3.5 text-left w-36">Held / Room</th>}
                {colDefs.find(c => c.key === 'action')?.visible && <th className="px-4 py-3.5 text-right w-40">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No ranges match your search.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                    {colDefs.find(c => c.key === 'prefix')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[var(--text-primary)] font-semibold">{r.prefix}</span>
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'testNumber')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[var(--accent-blue)] text-[11px]">{r.testNumber}</span>
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'memo')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.memo}</td>
                    )}
                    {colDefs.find(c => c.key === 'heldRoom')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                          -{String(r.held).padStart(2, '0')} / {r.room}
                        </span>
                      </td>
                    )}
                    {colDefs.find(c => c.key === 'action')?.visible && (
                      <td className="px-4 py-3.5">
                        {successIds.has(r.id) ? (
                          <span className="flex items-center gap-1 text-[var(--accent-emerald)] text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Requested
                          </span>
                        ) : r.type === 'free' ? (
                          <button
                            id={`btn-request-range-${r.id}`}
                            onClick={() => setRequestTarget(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--accent-blue)] hover:bg-[rgba(59,130,246,0.2)] cursor-pointer transition-all"
                          >
                            <Send className="w-3 h-3" /> Request
                          </button>
                        ) : (
                          <button
                            id={`btn-ask-support-${r.id}`}
                            onClick={() => setSupportTarget(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.25)] text-[var(--accent-amber)] hover:bg-[rgba(245,158,11,0.2)] cursor-pointer transition-all"
                          >
                            <HelpCircle className="w-3 h-3" /> Ask Support
                          </button>
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

      {/* Modals */}
      <RequestModal range={requestTarget} onClose={() => setRequestTarget(null)} onConfirm={handleConfirm} />
      <SupportModal range={supportTarget} onClose={() => setSupportTarget(null)} />
    </div>
  );
};
