import React, { useState, useMemo } from 'react';
import { BarChart3, ChevronRight, Receipt } from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

interface CdrRow {
  id: string;
  date: string;
  range: string;
  number: string;
  cli: string;
  duration: string;
  charge: string;
  status: 'billed' | 'unbilled' | 'disputed';
}

const MOCK_CDR: CdrRow[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  date: `2026-09-${String(24 - (i % 10)).padStart(2, '0')} ${String(10 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00 UTC`,
  range: ['+44 7911 UK', '+1 213 US', '+91 98 IN', '+33 6 FR'][i % 4],
  number: `+4479110000${String(i).padStart(2, '0')}`,
  cli: ['AUTXXXX', 'FACXXXX', 'TikXXXX', 'INFXXXX'][i % 4],
  duration: `${Math.floor(Math.random() * 120 + 1)}s`,
  charge: `$${(Math.random() * 0.02 + 0.001).toFixed(4)}`,
  status: (['billed', 'unbilled', 'disputed'] as const)[i % 3],
}));

const INIT_COLS: ColumnVisibility[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'range', label: 'Range', visible: true },
  { key: 'number', label: 'Number', visible: true },
  { key: 'cli', label: 'CLI', visible: true },
  { key: 'duration', label: 'Duration', visible: true },
  { key: 'charge', label: 'Charge', visible: true },
  { key: 'status', label: 'Status', visible: true },
];

const statusStyles: Record<string, string> = {
  billed: 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border-[rgba(16,185,129,0.25)]',
  unbilled: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border-[rgba(245,158,11,0.25)]',
  disputed: 'bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border-[rgba(244,63,94,0.25)]',
};

export const CdrStatisticsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(INIT_COLS);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_CDR.filter((r) =>
      r.range.toLowerCase().includes(q) || r.number.includes(q) || r.cli.toLowerCase().includes(q) || r.status.includes(q),
    );
  }, [search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const handleColChange = (key: string, v: boolean) => setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));
  const exportData = filtered.map((r) => ({ date: r.date, range: r.range, number: r.number, cli: r.cli, duration: r.duration, charge: r.charge, status: r.status }));

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 border-[rgba(139,92,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.25)] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[var(--accent-violet)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">CDR & Statistics</h1>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar exportData={exportData} columnDefs={colDefs} onColumnVisibilityChange={handleColChange}
            currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {colDefs.find(c => c.key === 'date')?.visible && <th className="px-4 py-3.5 text-left w-36">Date</th>}
                {colDefs.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left w-44">Range</th>}
                {colDefs.find(c => c.key === 'number')?.visible && <th className="px-4 py-3.5 text-left w-40">Number</th>}
                {colDefs.find(c => c.key === 'cli')?.visible && <th className="px-4 py-3.5 text-left w-32">CLI</th>}
                {colDefs.find(c => c.key === 'duration')?.visible && <th className="px-4 py-3.5 text-left w-28">Duration</th>}
                {colDefs.find(c => c.key === 'charge')?.visible && <th className="px-4 py-3.5 text-left w-28">Charge</th>}
                {colDefs.find(c => c.key === 'status')?.visible && <th className="px-4 py-3.5 text-left w-28">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">No CDR records found.</td></tr>
              ) : paginated.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                  {colDefs.find(c => c.key === 'date')?.visible && <td className="px-4 py-3.5 font-mono text-[10px] text-[var(--text-tertiary)]">{r.date}</td>}
                  {colDefs.find(c => c.key === 'range')?.visible && <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.range}</td>}
                  {colDefs.find(c => c.key === 'number')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--accent-blue)] text-[11px]">{r.number}</td>}
                  {colDefs.find(c => c.key === 'cli')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--text-tertiary)] text-[10px]">{r.cli}</td>}
                  {colDefs.find(c => c.key === 'duration')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{r.duration}</td>}
                  {colDefs.find(c => c.key === 'charge')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--accent-emerald)]">{r.charge}</td>}
                  {colDefs.find(c => c.key === 'status')?.visible && <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusStyles[r.status]}`}>{r.status}</span>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar exportData={exportData} columnDefs={colDefs} onColumnVisibilityChange={handleColChange}
            currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
      </div>
    </div>
  );
};
