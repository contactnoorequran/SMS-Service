import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronRight,
  Search,
  X,
  CheckSquare,
  Square,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

/* ─── Types ─── */
interface RangeOption {
  id: string;
  prefix: string;
  label: string;
  freeCount: number;
  rate: string;
  selected: boolean;
}

interface BulkJob {
  id: string;
  date: string;
  client: string;
  ranges: string;
  rate: string;
  requested: number;
  progress: number;
  status: 'complete' | 'processing' | 'queued' | 'failed';
  downloadReady: boolean;
}

type DownloadFormat = 'full number' | 'country code : number' | 'country code : number : country' | 'local number';

import { apiClient } from '../../services/api';

const PAYOUT_TERMS = ['7/1', '15/1', '30/1', '45/1', '60/1'];


const JOB_COL_DEFS: ColumnVisibility[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'client', label: 'Client', visible: true },
  { key: 'ranges', label: 'Ranges', visible: true },
  { key: 'rate', label: 'Rate', visible: true },
  { key: 'requested', label: 'Requested', visible: true },
  { key: 'progress', label: 'Progress', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'download', label: 'Download', visible: true },
];

const statusStyles: Record<string, string> = {
  complete: 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]',
  processing: 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)] text-[var(--accent-blue)]',
  queued: 'bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.3)] text-[var(--accent-amber)]',
  failed: 'bg-[var(--accent-rose-dim)] border-[rgba(244,63,94,0.3)] text-[var(--accent-rose)]',
};

/* ─── Download format dropdown ─── */
const FormatDropdown: React.FC<{ value: DownloadFormat; onChange: (f: DownloadFormat) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options: DownloadFormat[] = ['full number', 'country code : number', 'country code : number : country', 'local number'];
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
      >
        {value} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-1">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-[11px] cursor-pointer transition-colors ${o === value ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
export const BulkAddView: React.FC = () => {
  /* Dynamic data from API */
  const [clients, setClients] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  /* Form state */
  const [rangeSearch, setRangeSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [ranges, setRanges] = useState<RangeOption[]>([]);
  const [countPerRange, setCountPerRange] = useState(100);
  const [clientRate, setClientRate] = useState('');
  const [payoutTerm, setPayoutTerm] = useState('7/1');
  const [sortRandomly, setSortRandomly] = useState(true);
  const [queued, setQueued] = useState(false);

  /* Load real clients and countries */
  useEffect(() => {
    const loadApiData = async () => {
      setIsLoadingData(true);
      try {
        const [clientRes, countryRes] = await Promise.all([
          apiClient.getClients({ limit: 100 }).catch(() => null),
          apiClient.getCountries().catch(() => null),
        ]);

        if (clientRes && Array.isArray(clientRes.items)) {
          const names = clientRes.items.map((c: any) => c.companyName || c.name || `Client #${c.id}`).filter(Boolean);
          setClients(names);
        }

        if (countryRes && Array.isArray(countryRes)) {
          const mappedRanges: RangeOption[] = countryRes.map((c: any) => ({
            id: c.id,
            prefix: c.prefix || `+${c.callingCode || '1'}`,
            label: `${c.name || 'Country'} (${c.iso2 || c.isoCode || 'INT'})`,
            freeCount: 50,
            rate: '0.045',
            selected: false,
          }));
          setRanges(mappedRanges);
        }
      } catch (err) {
        console.warn('Failed to load clients or countries for BulkAddView:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadApiData();
  }, []);

  /* History table state */
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('full number');
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(25);
  const [jobColDefs, setJobColDefs] = useState<ColumnVisibility[]>(JOB_COL_DEFS);

  const filteredClients = useMemo(
    () => clients.filter((c) => c.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch],
  );

  const selectedRanges = ranges.filter((r) => r.selected);
  const totalQueued = selectedRanges.length * countPerRange;

  const toggleRange = (id: string) =>
    setRanges((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));

  const selectAll = () => setRanges((prev) => prev.map((r) => ({ ...r, selected: true })));
  const clearAll = () => setRanges((prev) => prev.map((r) => ({ ...r, selected: false })));

  const handleQueue = () => {
    if (!selectedClient || selectedRanges.length === 0 || countPerRange <= 0) return;
    setQueued(true);

    const newJob: BulkJob = {
      id: `job-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      client: selectedClient,
      ranges: selectedRanges.map((r) => r.label).join(', '),
      rate: clientRate ? `$${clientRate}/SMS` : 'Standard',
      requested: totalQueued,
      progress: 0,
      status: 'queued',
      downloadReady: false,
    };
    setJobs((prev) => [newJob, ...prev]);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id ? { ...j, status: 'processing', progress: Math.max(1, Math.floor(newJob.requested * 0.5)) } : j
        )
      );
    }, 1200);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id ? { ...j, status: 'complete', progress: newJob.requested, downloadReady: true } : j
        )
      );
    }, 3000);

    setTimeout(() => setQueued(false), 2000);
  };

  /* Job table */
  const filteredJobs = useMemo(() => {
    const q = jobSearch.toLowerCase();
    return jobs.filter((j) =>
      j.client.toLowerCase().includes(q) || j.ranges.toLowerCase().includes(q) || j.status.includes(q),
    );
  }, [jobs, jobSearch]);

  const paginatedJobs = filteredJobs.slice((jobPage - 1) * jobPageSize, jobPage * jobPageSize);

  const handleJobColChange = (key: string, v: boolean) =>
    setJobColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  const exportJobs = filteredJobs.map((j) => ({
    date: j.date, client: j.client, ranges: j.ranges, rate: j.rate,
    requested: String(j.requested), progress: `${j.progress}/${j.requested}`,
    status: j.status, download: j.downloadReady ? 'Yes' : 'No',
  }));

  const inputCls = 'glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] outline-none transition-colors';

  return (
    <div className="reference-page bulk-add-page">
      {/* Page header */}
      <div className="reference-heading glass-card p-5 border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center">
            <Plus className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>SMS Module</span><ChevronRight className="w-3 h-3" />
              <span className="text-[var(--text-primary)]">Bulk Add</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Bulk Add</h1>
          </div>
        </div>
      </div>

      {/* New Bulk Add Form */}
      <div className="bulk-add-form glass-card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">
          New Bulk Add
        </h2>

        {/* Client autocomplete */}
        <div className="space-y-1.5 relative">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Client *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input
              id="input-bulk-client-search"
              type="text"
              placeholder="Search client…"
              value={selectedClient || clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setSelectedClient('');
                setShowClientDrop(true);
              }}
              onFocus={() => setShowClientDrop(true)}
              className={`${inputCls} pl-8 w-full max-w-sm`}
            />
            {selectedClient && (
              <button onClick={() => { setSelectedClient(''); setClientSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {showClientDrop && !selectedClient && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 w-full max-w-sm bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-1">
              {filteredClients.map((c) => (
                <button
                  key={c}
                  onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientDrop(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pick ranges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Pick ranges / Prefix *
            </label>
            <div className="flex gap-1.5">
              <button
                id="btn-bulk-select-all-ranges"
                onClick={selectAll}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
              >
                All ({ranges.length})
              </button>
              <button
                id="btn-bulk-clear-ranges"
                onClick={clearAll}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
              >
                Clear
              </button>
            </div>
          </div>
          <input aria-label="Filter ranges" placeholder="Filter ranges or prefix..." value={rangeSearch} onChange={e => setRangeSearch(e.target.value)} className={`${inputCls} w-full`} />
          <div className="range-options grid grid-cols-1 gap-2">
            {ranges.filter(r => `${r.label} ${r.prefix}`.toLowerCase().includes(rangeSearch.toLowerCase())).map((r) => (
              <label
                key={r.id}
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  r.selected
                    ? 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)]'
                    : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={r.selected}
                  onChange={() => toggleRange(r.id)}
                  className="mt-0.5 w-3.5 h-3.5 accent-[var(--accent-blue)] cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{r.label}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                    Free: {r.freeCount} · {r.rate}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {selectedRanges.length > 0 && (
            <p className="text-[11px] text-[var(--accent-blue)]">
              {selectedRanges.length} range{selectedRanges.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Count / Rate / Payout / Sort */}
        <div className="bulk-fields grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Count per range *</label>
            <input
              id="input-bulk-count-per-range"
              type="number"
              min={1}
              max={10000}
              value={countPerRange}
              onChange={(e) => setCountPerRange(Number(e.target.value))}
              className={`${inputCls} w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Client rate</label>
            <input
              id="input-bulk-client-rate"
              type="text"
              placeholder="e.g. 0.012"
              value={clientRate}
              onChange={(e) => setClientRate(e.target.value)}
              className={`${inputCls} w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Client payout term</label>
            <select
              id="select-bulk-payout-term"
              value={payoutTerm}
              onChange={(e) => setPayoutTerm(e.target.value)}
              className={`${inputCls} w-full cursor-pointer`}
            >
              {PAYOUT_TERMS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Options</label>
            <label className="flex items-center gap-2 h-8 cursor-pointer">
              <input
                id="checkbox-bulk-sort-randomly"
                type="checkbox"
                checked={sortRandomly}
                onChange={(e) => setSortRandomly(e.target.checked)}
                className="w-3.5 h-3.5 accent-[var(--accent-blue)] cursor-pointer"
              />
              <span className="text-[11px] text-[var(--text-secondary)]">Sort randomly</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            id={`btn-bulk-queue-numbers-${totalQueued}`}
            onClick={handleQueue}
            disabled={!selectedClient || selectedRanges.length === 0 || countPerRange <= 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            {queued ? (
              <><CheckCircle2 className="w-4 h-4" /> Queued!</>
            ) : (
              <><Plus className="w-4 h-4" /> Queue {totalQueued.toLocaleString()} number(s)</>
            )}
          </button>
          {totalQueued > 0 && (
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5 font-mono">
              {selectedRanges.length} range(s) × {countPerRange} = {totalQueued.toLocaleString()} numbers
            </p>
          )}
        </div>
      </div>

      {/* Bulk Job History */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--glass-border)] flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Bulk Job History</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-tertiary)]">Download format:</span>
            <FormatDropdown value={downloadFormat} onChange={setDownloadFormat} />
          </div>
        </div>

        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            section="controls"
            exportData={exportJobs}
            columnDefs={jobColDefs}
            onColumnVisibilityChange={handleJobColChange}
            currentPage={jobPage}
            totalItems={filteredJobs.length}
            pageSize={jobPageSize}
            onPageChange={setJobPage}
            onPageSizeChange={(s) => { setJobPageSize(s); setJobPage(1); }}
            searchValue={jobSearch}
            onSearchChange={(v) => { setJobSearch(v); setJobPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {jobColDefs.find(c => c.key === 'date')?.visible && <th className="px-4 py-3.5 text-left">Date</th>}
                {jobColDefs.find(c => c.key === 'client')?.visible && <th className="px-4 py-3.5 text-left">Client</th>}
                {jobColDefs.find(c => c.key === 'ranges')?.visible && <th className="px-4 py-3.5 text-left">Ranges</th>}
                {jobColDefs.find(c => c.key === 'rate')?.visible && <th className="px-4 py-3.5 text-left">Rate</th>}
                {jobColDefs.find(c => c.key === 'requested')?.visible && <th className="px-4 py-3.5 text-left">Requested</th>}
                {jobColDefs.find(c => c.key === 'progress')?.visible && <th className="px-4 py-3.5 text-left">Progress</th>}
                {jobColDefs.find(c => c.key === 'status')?.visible && <th className="px-4 py-3.5 text-left">Status</th>}
                {jobColDefs.find(c => c.key === 'download')?.visible && <th className="px-4 py-3.5 text-left">Download</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">
                    No bulk jobs found.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                    {jobColDefs.find(c => c.key === 'date')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[10px] text-[var(--text-tertiary)]">{j.date}</td>
                    )}
                    {jobColDefs.find(c => c.key === 'client')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] font-medium">{j.client}</td>
                    )}
                    {jobColDefs.find(c => c.key === 'ranges')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-tertiary)] text-[10px] max-w-[200px] truncate">{j.ranges}</td>
                    )}
                    {jobColDefs.find(c => c.key === 'rate')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[var(--accent-emerald)]">{j.rate}</td>
                    )}
                    {jobColDefs.find(c => c.key === 'requested')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{j.requested.toLocaleString()}</td>
                    )}
                    {jobColDefs.find(c => c.key === 'progress')?.visible && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-[var(--glass-border)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent-blue)] transition-all"
                              style={{ width: `${(j.progress / j.requested) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                            {j.progress}/{j.requested}
                          </span>
                        </div>
                      </td>
                    )}
                    {jobColDefs.find(c => c.key === 'status')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusStyles[j.status]}`}>
                          {j.status === 'processing' && <Loader2 className="w-2.5 h-2.5 inline mr-1 animate-spin" />}
                          {j.status === 'queued' && <Clock className="w-2.5 h-2.5 inline mr-1" />}
                          {j.status === 'complete' && <CheckCircle2 className="w-2.5 h-2.5 inline mr-1" />}
                          {j.status}
                        </span>
                      </td>
                    )}
                    {jobColDefs.find(c => c.key === 'download')?.visible && (
                      <td className="px-4 py-3.5">
                        {j.downloadReady ? (
                          <button
                            id={`btn-job-download-${j.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--accent-blue)] hover:bg-[rgba(59,130,246,0.2)] cursor-pointer transition-all"
                          >
                            <Download className="w-3 h-3" /> {downloadFormat}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[var(--text-tertiary)] italic">Not ready</span>
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
            section="pagination"
            exportData={exportJobs}
            columnDefs={jobColDefs}
            onColumnVisibilityChange={handleJobColChange}
            currentPage={jobPage}
            totalItems={filteredJobs.length}
            pageSize={jobPageSize}
            onPageChange={setJobPage}
            onPageSizeChange={(s) => { setJobPageSize(s); setJobPage(1); }}
            searchValue={jobSearch}
            onSearchChange={(v) => { setJobSearch(v); setJobPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};
