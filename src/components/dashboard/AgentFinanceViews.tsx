import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileText, ChevronRight, CreditCard, Plus, Code, Settings, User, Lock, Bell, RefreshCw, AlertCircle } from 'lucide-react';
import { DataTableToolbar, ColumnVisibility } from '../ui/DataTableToolbar';
import { apiClient } from '../../services/api';

export {CreditNotesView} from './CreditNotesView';
const statusStyles: Record<string,string> = {approved:'text-[var(--text-primary)]',pending:'text-[var(--text-secondary)]',rejected:'text-[var(--text-tertiary)]'};

/* ─── Payment Requests View ─── */
interface PaymentRequest {
  id: string;
  date: string;
  reference: string;
  amount: string;
  method: string;
  status: 'approved' | 'pending' | 'rejected';
}

const PR_COLS: ColumnVisibility[] = [
  { key: 'date', label: 'Date', visible: true },
  { key: 'reference', label: 'Reference', visible: true },
  { key: 'amount', label: 'Amount', visible: true },
  { key: 'method', label: 'Method', visible: true },
  { key: 'status', label: 'Status', visible: true },
];

export const PaymentRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colDefs, setColDefs] = useState<ColumnVisibility[]>(PR_COLS);
  const [showNew, setShowNew] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Wire Transfer');
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchPaymentRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getPaymentRequests();
      const list = Array.isArray(res?.requests) ? res.requests : Array.isArray(res?.items) ? res.items : [];
      const mapped: PaymentRequest[] = list.map((p: any) => ({
        id: p.id,
        date: new Date(p.createdAt).toISOString().replace('T', ' ').slice(0, 16),
        reference: p.reference || `PR-${p.id.slice(-6)}`,
        amount: `$${Number(p.amountDecimal || p.amount || 0).toFixed(2)}`,
        method: p.method || 'Wire Transfer',
        status: (p.status?.toLowerCase() || 'pending') as any,
      }));
      setRequests(mapped);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentRequests();
    apiClient.getWallets().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setWallets(res);
        setSelectedWalletId(res[0].id);
      }
    }).catch(() => {});
  }, [fetchPaymentRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const wId = selectedWalletId || wallets[0]?.id || 'wlt_default';
      await apiClient.createPaymentRequest({
        walletId: wId,
        amountDecimal: parseFloat(amount),
        reason: `${method} payment request`,
        reference: `PR-${Date.now().toString().slice(-6)}`,
      });
      setShowNew(false);
      setAmount('');
      fetchPaymentRequests();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((p) => p.reference.toLowerCase().includes(q) || p.method.toLowerCase().includes(q) || p.status.includes(q));
  }, [requests, search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const handleColChange = (key: string, v: boolean) => setColDefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: v } : c)));
  const exportData = filtered.map((p) => ({ date: p.date, reference: p.reference, amount: p.amount, method: p.method, status: p.status }));

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>Stats & Finance</span><ChevronRight className="w-3 h-3" /><span className="text-[var(--text-primary)]">Payment Requests</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Payment Requests</h1>
          </div>
          <div className="ml-auto">
            <button
              id="btn-new-payment-request"
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowNew(false)} />
          <form onSubmit={handleSubmit} className="relative glass-card p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">New Payment Request</h3>
            {submitError && (
              <div className="p-2.5 rounded-lg border border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.08)] text-[var(--accent-rose)] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            <div className="space-y-3">
              {wallets.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Target Wallet</label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.currency || 'USD'} Wallet ({w.id.slice(-6)})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full cursor-pointer"
                >
                  <option>Wire Transfer</option>
                  <option>Bank Transfer</option>
                  <option>Crypto</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-blue)] text-white hover:opacity-90 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)]">
          <DataTableToolbar exportData={exportData} columnDefs={colDefs} onColumnVisibilityChange={handleColChange}
            currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
                {colDefs.find(c => c.key === 'date')?.visible && <th className="px-4 py-3.5 text-left">Date</th>}
                {colDefs.find(c => c.key === 'reference')?.visible && <th className="px-4 py-3.5 text-left">Reference</th>}
                {colDefs.find(c => c.key === 'amount')?.visible && <th className="px-4 py-3.5 text-left">Amount</th>}
                {colDefs.find(c => c.key === 'method')?.visible && <th className="px-4 py-3.5 text-left">Method</th>}
                {colDefs.find(c => c.key === 'status')?.visible && <th className="px-4 py-3.5 text-left">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--text-tertiary)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-blue)]" />
                      <span>Loading payment requests...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-[11px] text-[var(--text-tertiary)]">No payment requests found.</td></tr>
              ) : paginated.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                  {colDefs.find(c => c.key === 'date')?.visible && <td className="px-4 py-3.5 font-mono text-[10px] text-[var(--text-tertiary)]">{p.date}</td>}
                  {colDefs.find(c => c.key === 'reference')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--accent-blue)] text-[11px]">{p.reference}</td>}
                  {colDefs.find(c => c.key === 'amount')?.visible && <td className="px-4 py-3.5 font-mono text-[var(--accent-emerald)] font-semibold">{p.amount}</td>}
                  {colDefs.find(c => c.key === 'method')?.visible && <td className="px-4 py-3.5 text-[var(--text-secondary)]">{p.method}</td>}
                  {colDefs.find(c => c.key === 'status')?.visible && <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--glass-border)]">
          <DataTableToolbar exportData={exportData} columnDefs={colDefs} onColumnVisibilityChange={handleColChange}
            currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
      </div>
    </div>
  );
};


/* ─── REST API View ─── */
export const RestApiView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const apiKey = 'sk-agent-••••••••••••••••••••••••••••••••';
  const webhookUrl = 'https://your-server.com/webhook/sms';
  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const endpoints = [
    { method: 'GET', path: '/api/v1/numbers', desc: 'List your allocated numbers' },
    { method: 'GET', path: '/api/v1/cdr', desc: 'Fetch CDR records' },
    { method: 'POST', path: '/api/v1/numbers/assign', desc: 'Assign number to client' },
    { method: 'POST', path: '/api/v1/numbers/unassign', desc: 'Unassign number' },
    { method: 'POST', path: '/api/v1/bulk-add', desc: 'Queue bulk number job' },
  ];

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 border-[rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,182,212,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-cyan-dim)] border border-[rgba(6,182,212,0.25)] flex items-center justify-center">
            <Code className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>Account</span><ChevronRight className="w-3 h-3" /><span className="text-[var(--text-primary)]">REST API</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">REST API</h1>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Your API Key</h2>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[var(--glass-border)] font-mono text-[11px] text-[var(--text-secondary)]">
          <span className="flex-1 truncate">{apiKey}</span>
          <button id="btn-copy-api-key" onClick={() => copy(apiKey)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${copied ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]' : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'}`}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)]">Keep this key secret. It grants full access to your agent account via the REST API.</p>
      </div>

      {/* Webhook */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Webhook Configuration</h2>
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">Inbound SMS webhook URL</label>
          <input type="url" defaultValue={webhookUrl}
            className="glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] w-full font-mono focus:border-[var(--accent-cyan)] outline-none" />
        </div>
        <button id="btn-save-webhook" className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 cursor-pointer">Save Webhook</button>
      </div>

      {/* Endpoints */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Available Endpoints</h2>
        <div className="space-y-2">
          {endpoints.map((e) => (
            <div key={e.path} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${e.method === 'GET' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]'}`}>
                {e.method}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-primary)]">{e.path}</span>
              <span className="text-[11px] text-[var(--text-tertiary)] ml-auto hidden sm:block">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Profile Settings View ─── */
export const ProfileSettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'notifications'>('profile');

  const sections = [
    { key: 'profile' as const, label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'password' as const, label: 'Password', icon: <Lock className="w-3.5 h-3.5" /> },
    { key: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-3.5 h-3.5" /> },
  ];

  const inputCls = 'glass-input px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] outline-none transition-colors w-full';

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 border-[rgba(139,92,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.25)] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[var(--accent-violet)]" />
          </div>
          <div>
            <nav className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mb-0.5">
              <span>Account</span><ChevronRight className="w-3 h-3" /><span className="text-[var(--text-primary)]">Profile Settings</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="glass-card p-2 space-y-1">
            {sections.map((s) => (
              <button
                key={s.key}
                id={`btn-profile-section-${s.key}`}
                onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  activeSection === s.key
                    ? 'bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] border border-[rgba(139,92,246,0.25)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
                }`}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeSection === 'profile' && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: 'First Name', placeholder: 'John' }, { label: 'Last Name', placeholder: 'Doe' }, { label: 'Email', placeholder: 'john@example.com' }, { label: 'Phone', placeholder: '+1 555-0100' }, { label: 'Company', placeholder: 'Your company' }, { label: 'Timezone', placeholder: 'UTC+00:00' }].map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">{f.label}</label>
                    <input type="text" placeholder={f.placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
              <button id="btn-save-profile" className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-violet)] text-white hover:opacity-90 cursor-pointer">Save Profile</button>
            </div>
          )}

          {activeSection === 'password' && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">Change Password</h2>
              {[{ label: 'Current password', id: 'input-current-password' }, { label: 'New password', id: 'input-new-password' }, { label: 'Confirm new password', id: 'input-confirm-password' }].map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">{f.label}</label>
                  <input id={f.id} type="password" placeholder="••••••••" className={inputCls} />
                </div>
              ))}
              <button id="btn-update-password" className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-violet)] text-white hover:opacity-90 cursor-pointer">Update Password</button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">Notification Preferences</h2>
              {[
                { label: 'Range requests approved', key: 'range-approved' },
                { label: 'Balance low alert', key: 'balance-low' },
                { label: 'New client assigned', key: 'client-assigned' },
                { label: 'Monthly statement ready', key: 'monthly-statement' },
                { label: 'Payment request updates', key: 'payment-updates' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-colors">
                  <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                  <input id={`notif-${item.key}`} type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--accent-violet)] cursor-pointer" />
                </label>
              ))}
              <button id="btn-save-notifications" className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-violet)] text-white hover:opacity-90 cursor-pointer">Save Preferences</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
