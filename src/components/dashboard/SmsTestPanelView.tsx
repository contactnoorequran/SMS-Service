import React, { useState, useEffect, useRef } from 'react';
import { Radio, ChevronRight, Download, ChevronDown, Zap, Wifi, WifiOff } from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';

/* ─── Types ─── */
interface TestNumber {
  id: string;
  range: string;
  prefix: string;
  testNumber: string;
}

interface InboundEvent {
  id: string;
  date: string;
  range: string;
  number: string;
  cli: string;
}

/* ─── Mock data ─── */
const TEST_NUMBERS: TestNumber[] = [
  { id: '1', range: '+44 7911 UK Premium', prefix: '+44 7911', testNumber: '+447911123456' },
  { id: '2', range: '+1 213 US California', prefix: '+1 213', testNumber: '+12139998877' },
  { id: '3', range: '+49 151 Germany', prefix: '+49 151', testNumber: '+491511234567' },
  { id: '4', range: '+33 6 France', prefix: '+33 6', testNumber: '+33612345678' },
  { id: '5', range: '+91 98 India', prefix: '+91 98', testNumber: '+919812345678' },
  { id: '6', range: '+55 11 Brazil', prefix: '+55 11', testNumber: '+5511912345678' },
];

const CLI_PREFIXES = ['AUTXXXX', 'FACXXXX', 'TikXXXX', 'INFXXXX', 'VRTXXXX', 'MSKXXXX', 'BLKXXXX'];
const RANGES_LIST = ['+44 7911 UK Premium', '+1 213 US California', '+91 98 India Airtel', '+33 6 France Mobile'];
const NUMBERS_LIST = TEST_NUMBERS.map((t) => t.testNumber);

function genEvent(id: number): InboundEvent {
  const now = new Date();
  now.setSeconds(now.getSeconds() - Math.floor(Math.random() * 120));
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
  return {
    id: String(id),
    date: dateStr,
    range: RANGES_LIST[id % RANGES_LIST.length],
    number: NUMBERS_LIST[id % NUMBERS_LIST.length],
    cli: CLI_PREFIXES[id % CLI_PREFIXES.length],
  };
}

const INIT_INBOUND: InboundEvent[] = Array.from({ length: 8 }, (_, i) => genEvent(i));

/* ─── Test Numbers col defs ─── */
const TN_COLS: ColumnVisibility[] = [
  { key: 'range', label: 'Range', visible: true },
  { key: 'prefix', label: 'Prefix', visible: true },
  { key: 'testNumber', label: 'Test Number', visible: true },
];

/* ─── Inbound col defs ─── */
const IB_COLS: ColumnVisibility[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'range', label: 'Range', visible: true },
  { key: 'number', label: 'Number', visible: true },
  { key: 'cli', label: 'CLI', visible: true },
];

/* ─── Download dropdown ─── */
const DownloadDropdown: React.FC<{ numbers: TestNumber[] }> = ({ numbers }) => {
  const [open, setOpen] = useState(false);
  const download = (mode: 'full' | 'random') => {
    const txt = [...numbers.map((n) => n.testNumber)]
      .sort(() => mode === 'random' ? Math.random() - 0.5 : 0)
      .join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_numbers.txt';
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };
  return (
    <div className="relative">
      <button
        id="btn-test-panel-download"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Download .txt (random)
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-44 bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-2xl p-1">
          {[{ label: 'In order', mode: 'full' as const }, { label: 'Randomly shuffled', mode: 'random' as const }].map((o) => (
            <button
              key={o.mode}
              onClick={() => download(o.mode)}
              className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
export const SmsTestPanelView: React.FC = () => {
  /* Test Numbers table */
  const [tnSearch, setTnSearch] = useState('');
  const [tnPage, setTnPage] = useState(1);
  const [tnPageSize, setTnPageSize] = useState(10);
  const [tnCols, setTnCols] = useState<ColumnVisibility[]>(TN_COLS);

  /* Inbound stream */
  const [inbound, setInbound] = useState<InboundEvent[]>(INIT_INBOUND);
  const [ibSearch, setIbSearch] = useState('');
  const [ibPage, setIbPage] = useState(1);
  const [ibPageSize, setIbPageSize] = useState(25);
  const [ibCols, setIbCols] = useState<ColumnVisibility[]>(IB_COLS);
  const [liveStream, setLiveStream] = useState(true);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventCounter = useRef(INIT_INBOUND.length);

  /* Live stream: add new event every ~4s */
  useEffect(() => {
    if (!liveStream) {
      if (streamRef.current) clearInterval(streamRef.current);
      return;
    }
    streamRef.current = setInterval(() => {
      eventCounter.current += 1;
      const newEvent = genEvent(eventCounter.current);
      setInbound((prev) => [newEvent, ...prev].slice(0, 200));
    }, 4000);
    return () => { if (streamRef.current) clearInterval(streamRef.current); };
  }, [liveStream]);

  /* Test numbers */
  const filteredTn = TEST_NUMBERS.filter((n) => {
    const q = tnSearch.toLowerCase();
    return n.range.toLowerCase().includes(q) || n.prefix.includes(q) || n.testNumber.includes(q);
  });
  const paginatedTn = filteredTn.slice((tnPage - 1) * tnPageSize, tnPage * tnPageSize);

  /* Inbound */
  const filteredIb = inbound.filter((e) => {
    const q = ibSearch.toLowerCase();
    return e.range.toLowerCase().includes(q) || e.number.includes(q) || e.cli.toLowerCase().includes(q);
  });
  const paginatedIb = filteredIb.slice((ibPage - 1) * ibPageSize, ibPage * ibPageSize);

  const handleTnColChange = (key: string, v: boolean) =>
    setTnCols((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));
  const handleIbColChange = (key: string, v: boolean) =>
    setIbCols((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  const exportTn = filteredTn.map((n) => ({ range: n.range, prefix: n.prefix, testNumber: n.testNumber }));
  const exportIb = filteredIb.map((e) => ({ date: e.date, range: e.range, number: e.number, cli: e.cli }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="glass-card p-5 border-[rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(245,158,11,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.25)] flex items-center justify-center">
            <Radio className="w-4 h-4 text-[var(--accent-amber)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">SMS Test Panel</h1>
          </div>
        </div>
      </div>

      {/* ─ Panel 1: Test Numbers ─ */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--glass-border)] flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Test Numbers</h2>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono ml-1">{TEST_NUMBERS.length} numbers</span>
          <div className="ml-auto">
            <DownloadDropdown numbers={TEST_NUMBERS} />
          </div>
        </div>

        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportTn}
            columnDefs={tnCols}
            onColumnVisibilityChange={handleTnColChange}
            currentPage={tnPage}
            totalItems={filteredTn.length}
            pageSize={tnPageSize}
            onPageChange={setTnPage}
            onPageSizeChange={(s) => { setTnPageSize(s); setTnPage(1); }}
            searchValue={tnSearch}
            onSearchChange={(v) => { setTnSearch(v); setTnPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {tnCols.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left w-1/3">Range</th>}
                {tnCols.find(c => c.key === 'prefix')?.visible && <th className="px-4 py-3.5 text-left w-1/3">Prefix</th>}
                {tnCols.find(c => c.key === 'testNumber')?.visible && <th className="px-4 py-3.5 text-left w-1/3">Test Number</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginatedTn.map((n) => (
                <tr key={n.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                  {tnCols.find(c => c.key === 'range')?.visible && (
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{n.range}</td>
                  )}
                  {tnCols.find(c => c.key === 'prefix')?.visible && (
                    <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{n.prefix}</td>
                  )}
                  {tnCols.find(c => c.key === 'testNumber')?.visible && (
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[var(--accent-blue)] font-semibold text-[11px]">{n.testNumber}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Toolbar BOTTOM */}
        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportTn}
            columnDefs={tnCols}
            onColumnVisibilityChange={handleTnColChange}
            currentPage={tnPage}
            totalItems={filteredTn.length}
            pageSize={tnPageSize}
            onPageChange={setTnPage}
            onPageSizeChange={(s) => { setTnPageSize(s); setTnPage(1); }}
            searchValue={tnSearch}
            onSearchChange={(v) => { setTnSearch(v); setTnPage(1); }}
          />
        </div>
      </div>

      {/* ─ Panel 2: Recent Inbound ─ */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--glass-border)] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Inbound</h2>
            {liveStream && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent-emerald)] font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              <Zap className="w-3 h-3 inline text-[var(--accent-amber)] mr-1" />
              {inbound.length} events
            </span>
            {/* Live toggle */}
            <button
              id="btn-inbound-live-toggle"
              onClick={() => setLiveStream((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                liveStream
                  ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
                  : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]'
              }`}
            >
              {liveStream ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {liveStream ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Toolbar TOP */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar
            exportData={exportIb}
            columnDefs={ibCols}
            onColumnVisibilityChange={handleIbColChange}
            currentPage={ibPage}
            totalItems={filteredIb.length}
            pageSize={ibPageSize}
            onPageChange={setIbPage}
            onPageSizeChange={(s) => { setIbPageSize(s); setIbPage(1); }}
            searchValue={ibSearch}
            onSearchChange={(v) => { setIbSearch(v); setIbPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {ibCols.find(c => c.key === 'date')?.visible && <th className="px-4 py-3.5 text-left w-44">Date</th>}
                {ibCols.find(c => c.key === 'range')?.visible && <th className="px-4 py-3.5 text-left w-48">Range</th>}
                {ibCols.find(c => c.key === 'number')?.visible && <th className="px-4 py-3.5 text-left w-48">Number</th>}
                {ibCols.find(c => c.key === 'cli')?.visible && <th className="px-4 py-3.5 text-left w-32">CLI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {paginatedIb.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">
                    No inbound events yet. Live stream is {liveStream ? 'active' : 'paused'}.
                  </td>
                </tr>
              ) : (
                paginatedIb.map((e, idx) => (
                  <tr
                    key={e.id}
                    className={`transition-colors ${idx === 0 && ibPage === 1 ? 'bg-[rgba(16,185,129,0.04)]' : 'hover:bg-[var(--glass-bg-hover)]'}`}
                  >
                    {ibCols.find(c => c.key === 'date')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[10px] text-[var(--text-tertiary)]">{e.date}</td>
                    )}
                    {ibCols.find(c => c.key === 'range')?.visible && (
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{e.range}</td>
                    )}
                    {ibCols.find(c => c.key === 'number')?.visible && (
                      <td className="px-4 py-3.5 font-mono text-[var(--accent-blue)] font-semibold text-[11px]">{e.number}</td>
                    )}
                    {ibCols.find(c => c.key === 'cli')?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] border border-[rgba(139,92,246,0.2)]">
                          {e.cli}
                        </span>
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
            exportData={exportIb}
            columnDefs={ibCols}
            onColumnVisibilityChange={handleIbColChange}
            currentPage={ibPage}
            totalItems={filteredIb.length}
            pageSize={ibPageSize}
            onPageChange={setIbPage}
            onPageSizeChange={(s) => { setIbPageSize(s); setIbPage(1); }}
            searchValue={ibSearch}
            onSearchChange={(v) => { setIbSearch(v); setIbPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};
