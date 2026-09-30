import React, { useState, useRef, useCallback } from 'react';
import {
  Copy,
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  Columns,
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

/* ─── Types ─── */
export interface ColumnVisibility {
  key: string;
  label: string;
  visible: boolean;
}

export interface DataTableToolbarProps {
  section?: 'all' | 'controls' | 'pagination';
  /** Raw data rows (for export) */
  exportData: Record<string, unknown>[];
  /** Column definitions for export header + show/hide */
  columnDefs: ColumnVisibility[];
  onColumnVisibilityChange: (key: string, visible: boolean) => void;
  /** Pagination */
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Search */
  searchValue: string;
  onSearchChange: (v: string) => void;
  /** Optional: "All" option in page sizes (used in CLI Search) */
  includeAll?: boolean;
  id?: string;
  className?: string;
}

/* ─── Helpers ─── */
function toTsv(rows: Record<string, unknown>[], cols: ColumnVisibility[]): string {
  const visible = cols.filter((c) => c.visible);
  const header = visible.map((c) => c.label).join('\t');
  const body = rows
    .map((r) => visible.map((c) => String(r[c.key] ?? '')).join('\t'))
    .join('\n');
  return `${header}\n${body}`;
}
function toCsv(rows: Record<string, unknown>[], cols: ColumnVisibility[]): string {
  const visible = cols.filter((c) => c.visible);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = visible.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((r) => visible.map((c) => escape(String(r[c.key] ?? ''))).join(','))
    .join('\n');
  return `${header}\n${body}`;
}
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── ExportButton ─── */
const ExportBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  success?: boolean;
}> = ({ icon, label, onClick, success }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
      success
        ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
        : 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white hover:opacity-80'
    }`}
  >
    {success ? <Check className="w-3 h-3" /> : icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/* ─── Main Component ─── */
export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  section = 'all',
  exportData,
  columnDefs,
  onColumnVisibilityChange,
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100, 500, 1000, 2000, 5000],
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  includeAll = false,
  id,
  className = '',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCols, setShowCols] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const flash = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1400);
  };

  const handleCopy = useCallback(() => {
    const text = toTsv(exportData, columnDefs);
    navigator.clipboard.writeText(text).catch(() => {});
    flash('copy');
  }, [exportData, columnDefs]);

  const handleTxt = useCallback(() => {
    downloadFile(toTsv(exportData, columnDefs), 'export.txt', 'text/plain');
    flash('txt');
  }, [exportData, columnDefs]);

  const handleCsv = useCallback(() => {
    downloadFile(toCsv(exportData, columnDefs), 'export.csv', 'text/csv');
    flash('csv');
  }, [exportData, columnDefs]);

  const handleExcel = useCallback(() => {
    // Simple Excel-compatible CSV with BOM
    const bom = '\uFEFF';
    downloadFile(bom + toCsv(exportData, columnDefs), 'export.csv', 'text/csv;charset=utf-8');
    flash('excel');
  }, [exportData, columnDefs]);

  /* Page numbers */
  const getPageNums = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const btnBase =
    'min-w-[28px] h-7 px-1.5 rounded-md font-mono text-[11px] font-medium transition-all border cursor-pointer';

  return (
    <div id={id} className={`data-toolbar toolbar-${section} space-y-2.5 ${className}`}>
      {/* ── TOP ROW: Records selector + Export buttons + Search ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Records per page */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'all') onPageSizeChange(totalItems || 9999999);
              else onPageSizeChange(Number(v));
            }}
            className="glass-input px-2 py-1 text-[11px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] cursor-pointer"
          >
            {pageSizeOptions.map((o) => (
              <option key={o} value={o}>
                {o.toLocaleString()}
              </option>
            ))}
            {includeAll && <option value="all">All</option>}
          </select>
          <span className="text-[11px] text-[var(--text-tertiary)]">records</span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--glass-border)]" />

        {/* Export Buttons */}
        <div className="flex items-center gap-1">
          <ExportBtn icon={<Copy className="w-3 h-3" />} label="Copy" onClick={handleCopy} success={copiedKey === 'copy'} />
          <ExportBtn icon={<FileText className="w-3 h-3" />} label="TXT" onClick={handleTxt} success={copiedKey === 'txt'} />
          <ExportBtn icon={<Download className="w-3 h-3" />} label="CSV" onClick={handleCsv} success={copiedKey === 'csv'} />
          <ExportBtn icon={<FileSpreadsheet className="w-3 h-3" />} label="Excel" onClick={handleExcel} success={copiedKey === 'excel'} />

          {/* Show / hide columns */}
          <div className="relative" ref={colPanelRef}>
            <button
              type="button"
              onClick={() => setShowCols((p) => !p)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-all"
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">Columns</span>
            </button>
            {showCols && (
              <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-2 space-y-1">
                <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--glass-border)] mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Show / Hide Columns
                  </span>
                  <button onClick={() => setShowCols(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {columnDefs.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--glass-bg-hover)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={(e) => onColumnVisibilityChange(col.key, e.target.checked)}
                      className="w-3 h-3 accent-[var(--accent-blue)] cursor-pointer"
                    />
                    <span className="text-[11px] text-[var(--text-secondary)]">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 focus-within:border-[var(--accent-blue)] transition-colors min-w-[160px]">
          <Search className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
          <input
            type="search"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-[11px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none w-full"
          />
          {searchValue && (
            <button onClick={() => onSearchChange('')} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: Entry count + Full pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Entry counter */}
        <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
          Showing{' '}
          <strong className="text-[var(--text-primary)]">{startItem}</strong> to{' '}
          <strong className="text-[var(--text-primary)]">{endItem}</strong> of{' '}
          <strong className="text-[var(--text-primary)]">{totalItems.toLocaleString()}</strong> entries
        </span>

        {/* Pagination: First Prev [1 2 3 4 5] Next Last */}
        <div className="flex items-center gap-1">
          {/* First */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className={`${btnBase} border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed`}
            title="First page"
          >
            <ChevronFirst className="w-3.5 h-3.5 mx-auto" />
          </button>

          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${btnBase} border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5 mx-auto" />
          </button>

          {/* Numbered pages */}
          {getPageNums().map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="px-1 text-[var(--text-tertiary)] text-[11px]">
                …
              </span>
            ) : (
              <button
                key={`pg-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={`${btnBase} ${
                  p === currentPage
                    ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white shadow-[0_0_10px_var(--accent-blue-dim)]'
                    : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${btnBase} border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5 mx-auto" />
          </button>

          {/* Last */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className={`${btnBase} border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Last page"
          >
            <ChevronLast className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};
