import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Radio, Clock, AlertCircle } from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

import { apiClient } from '../../services/api';

/* ─── Types ─── */
interface CliResult {
  id: string;
  range: string;
  prefix: string;
  lastSeen: string;
}

const INIT_COLS: ColumnVisibility[] = [
  { key: 'range', label: 'Range', visible: true },
  { key: 'lastSeen', label: 'Last seen', visible: true },
];

/* ─── Component ─── */
export const CliSearchView: React.FC = () => {
  const [sender, setSender] = useState('');
  const [messageText, setMessageText] = useState('');
  const [results, setResults] = useState<CliResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(INIT_COLS);

  const handleSearch = async () => {
    if (!sender.trim() && !messageText.trim()) return;
    setIsSearching(true);
    setSearched(true);
    try {
      const queryTerm = sender.trim() || messageText.trim();
      const res = await apiClient.getInboundMessages({
        search: queryTerm,
        limit: 50,
      });

      if (res && Array.isArray(res.items)) {
        const mapped: CliResult[] = res.items
          .filter((item: any) => {
            const matchSender = !sender.trim() || (item.fromNumber || '').toLowerCase().includes(sender.toLowerCase().trim());
            const matchBody = !messageText.trim() || (item.body || '').toLowerCase().includes(messageText.toLowerCase().trim());
            return matchSender && matchBody;
          })
          .map((item: any) => {
            const dt = item.receivedAt ? new Date(item.receivedAt) : new Date(item.createdAt || Date.now());
            const lastSeenStr = dt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
            return {
              id: item.id,
              range: item.number?.range?.name || item.number?.country?.name || `Range ${item.toNumber?.slice(0, 5) || 'Standard'}`,
              prefix: item.number?.range?.prefix || item.number?.country?.prefix || item.toNumber?.slice(0, 4) || '+',
              lastSeen: lastSeenStr,
            };
          });

        // Deduplicate by range name to show unique ranges running this CLI
        const uniqueMap = new Map<string, CliResult>();
        mapped.forEach((m) => {
          if (!uniqueMap.has(m.range)) {
            uniqueMap.set(m.range, m);
          }
        });

        setResults(Array.from(uniqueMap.values()));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.warn('CLI search API failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
      setPage(1);
    }
  };

  const handleReset = () => {
    setSender('');
    setMessageText('');
    setResults(null);
    setSearched(false);
    setSearch('');
  };

  const filtered = useMemo(() => {
    if (!results) return [];
    const q = search.toLowerCase();
    return results.filter((r) =>
      r.range.toLowerCase().includes(q) || r.lastSeen.includes(q),
    );
  }, [results, search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleColChange = (key: string, visible: boolean) =>
    setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));

  const exportData = filtered.map((r) => ({ range: r.range, lastSeen: r.lastSeen }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,182,212,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-cyan-dim)] border border-[rgba(6,182,212,0.25)] flex items-center justify-center">
            <Search className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">CLI Search</h1>
          </div>
        </div>
        <p className="relative text-xs text-[var(--text-secondary)] ml-12">
          Search for ranges that are running a specific sender ID (CLI) or match a message body.
        </p>
      </div>

      {/* Search form */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Search Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender CLI */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Sender (CLI)
            </label>
            <input
              id="input-cli-sender"
              type="text"
              placeholder="e.g. AUTXXX, FACXXX, TikXXXX"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-cyan)] outline-none transition-colors font-mono"
            />
            <p className="text-[10px] text-[var(--text-tertiary)]">Exact match — e.g. AUTXXXX, FACXXXX</p>
          </div>
          {/* Message text */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Message text
            </label>
            <input
              id="input-cli-message"
              type="text"
              placeholder="SMS body filter…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-cyan)] outline-none transition-colors"
            />
            <p className="text-[10px] text-[var(--text-tertiary)]">Partial match on inbound SMS body</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-cli-search"
            onClick={handleSearch}
            disabled={isSearching || (!sender.trim() && !messageText.trim())}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            {isSearching ? 'Searching…' : 'Search'}
          </button>
          {searched && (
            <button
              id="btn-cli-reset"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--glass-border)] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[var(--accent-cyan)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Ranges running this CLI
            </h2>
            <span className="ml-auto text-[11px] font-mono text-[var(--text-tertiary)]">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

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
              includeAll
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                  {colDefs.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left w-2/3">Range</th>}
                  {colDefs.find(c => c.key === 'lastSeen')?.visible && <th className="px-4 py-3.5 text-left w-1/3">Last seen</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <AlertCircle className="w-5 h-5 text-[var(--text-tertiary)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">No ranges found for this CLI.</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Try a different sender ID or message text.</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                      {colDefs.find(c => c.key === 'range')?.visible && (
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-[var(--text-primary)]">{r.range}</div>
                          <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">{r.prefix}</div>
                        </td>
                      )}
                      {colDefs.find(c => c.key === 'lastSeen')?.visible && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono">
                            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                            {r.lastSeen}
                          </div>
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
              includeAll
            />
          </div>
        </div>
      )}
    </div>
  );
};
