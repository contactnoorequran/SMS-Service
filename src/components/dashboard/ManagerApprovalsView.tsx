/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertCircle,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Layers,
  FileText,
  Shield,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export interface ApprovalRequest {
  id: string;
  type: 'DEPOSIT' | 'PAYOUT' | 'RANGE_QUOTA';
  requesterName: string;
  requesterEmail: string;
  requesterRole: 'CLIENT' | 'AGENT';
  amountOrQuantity: string;
  details: string;
  notes: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: string;
}

const SEED_REQUESTS: ApprovalRequest[] = [
  {
    id: 'REQ-1049',
    type: 'DEPOSIT',
    requesterName: 'Acme Global Telematics',
    requesterEmail: 'billing@acmeglobal.com',
    requesterRole: 'CLIENT',
    amountOrQuantity: '$500.00 USD',
    details: 'Bank Wire Swift Transfer (Ref #WIRE-98218)',
    notes: 'Urgent top-up for OTP verification traffic in UK routes.',
    date: '2026-09-24 14:10',
    status: 'PENDING',
  },
  {
    id: 'REQ-1050',
    type: 'PAYOUT',
    requesterName: 'Agent Alex Rivera',
    requesterEmail: 'alex@smshub.local',
    requesterRole: 'AGENT',
    amountOrQuantity: '$1,250.00 USD',
    details: 'USDT TRC20 (TXID: 8a7c29...3b)',
    notes: 'Bi-weekly agent commission clearing.',
    date: '2026-09-24 13:45',
    status: 'PENDING',
  },
  {
    id: 'REQ-1051',
    type: 'RANGE_QUOTA',
    requesterName: 'Agent Sarah Chen',
    requesterEmail: 'sarah@smshub.local',
    requesterRole: 'AGENT',
    amountOrQuantity: '5,000 Numbers',
    details: 'United Kingdom +44 7911 Prefix Pool',
    notes: 'Allocating additional capacity for client onboarding next week.',
    date: '2026-09-24 12:30',
    status: 'PENDING',
  },
  {
    id: 'REQ-1045',
    type: 'DEPOSIT',
    requesterName: 'Fintech Solutions UK',
    requesterEmail: 'finance@fintechuk.io',
    requesterRole: 'CLIENT',
    amountOrQuantity: '$1,000.00 USD',
    details: 'Corporate Credit Card (*4492)',
    notes: 'Monthly billing automated replenishment.',
    date: '2026-09-23 18:20',
    status: 'APPROVED',
    processedBy: 'Manager Dave',
    processedAt: '2026-09-23 18:25',
  },
  {
    id: 'REQ-1042',
    type: 'PAYOUT',
    requesterName: 'AAbuzar (Primary Agent)',
    requesterEmail: 'agent@smshub.local',
    requesterRole: 'AGENT',
    amountOrQuantity: '$3,400.00 USD',
    details: 'Direct Bank Wire (IBAN: GB29BARC...)',
    notes: 'Monthly enterprise commission settlement.',
    date: '2026-09-22 10:15',
    status: 'APPROVED',
    processedBy: 'Manager Dave',
    processedAt: '2026-09-22 11:00',
  },
  {
    id: 'REQ-1039',
    type: 'DEPOSIT',
    requesterName: 'Unknown Telecoms Ltd',
    requesterEmail: 'ops@unknown-telecom.com',
    requesterRole: 'CLIENT',
    amountOrQuantity: '$200.00 USD',
    details: 'Crypto BTC (Invalid confirmation)',
    notes: 'Transaction hash was invalid or unconfirmed on mempool.',
    date: '2026-09-21 09:30',
    status: 'REJECTED',
    processedBy: 'Manager Dave',
    processedAt: '2026-09-21 10:05',
  },
];

export const ManagerApprovalsView: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>(SEED_REQUESTS);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeModalRequest, setActiveModalRequest] = useState<ApprovalRequest | null>(null);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT' | 'DETAILS' | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const handleConfirmAction = () => {
    if (!activeModalRequest || !modalMode) return;

    if (modalMode === 'APPROVE') {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeModalRequest.id
            ? {
                ...r,
                status: 'APPROVED',
                processedBy: 'Manager (You)',
                processedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              }
            : r
        )
      );
    } else if (modalMode === 'REJECT') {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeModalRequest.id
            ? {
                ...r,
                status: 'REJECTED',
                notes: rejectReason ? `${r.notes} | Rejection reason: ${rejectReason}` : r.notes,
                processedBy: 'Manager (You)',
                processedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              }
            : r
        )
      );
    }

    setActiveModalRequest(null);
    setModalMode(null);
    setRejectReason('');
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {pendingCount} Pending Approvals
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                Financial & Capacity Clearing
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Approvals Queue
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Process client wallet top-up requests, agent commission withdrawals, and number range quota requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              Total Recorded: {requests.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'DEPOSIT', label: 'Client Deposits' },
            { id: 'PAYOUT', label: 'Agent Payouts' },
            { id: 'RANGE_QUOTA', label: 'Range Quotas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter & Search */}
        <div className="flex items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search request or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--table-th-bg)] border-b border-[var(--glass-border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Request ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Requester</th>
                <th className="p-3.5">Amount / Units</th>
                <th className="p-3.5">Details & Channel</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No requests match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-semibold text-[var(--accent-blue)]">
                      {req.id}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          req.type === 'DEPOSIT'
                            ? 'success'
                            : req.type === 'PAYOUT'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {req.type}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {req.requesterName}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {req.requesterEmail} &bull; {req.requesterRole}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">
                      {req.amountOrQuantity}
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-[var(--text-secondary)]">
                      <div>{req.details}</div>
                      {req.notes && (
                        <div className="text-[10px] text-[var(--text-tertiary)] italic truncate">
                          &quot;{req.notes}&quot;
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--text-tertiary)] font-mono whitespace-nowrap">
                      {req.date}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          req.status === 'PENDING'
                            ? 'warning'
                            : req.status === 'APPROVED'
                            ? 'success'
                            : 'error'
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveModalRequest(req);
                              setModalMode('APPROVE');
                            }}
                            className="px-2.5 py-1 bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)] hover:text-white rounded-lg font-medium transition-all text-xs border border-[rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalRequest(req);
                              setModalMode('REJECT');
                            }}
                            className="px-2.5 py-1 bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] hover:bg-[var(--accent-rose)] hover:text-white rounded-lg font-medium transition-all text-xs border border-[rgba(244,63,94,0.3)] cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveModalRequest(req);
                            setModalMode('DETAILS');
                          }}
                          className="px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Details Modal */}
      {activeModalRequest && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActiveModalRequest(null);
            setModalMode(null);
            setRejectReason('');
          }}
          title={
            modalMode === 'APPROVE'
              ? `Confirm Approval: ${activeModalRequest.id}`
              : modalMode === 'REJECT'
              ? `Confirm Rejection: ${activeModalRequest.id}`
              : `Request Details: ${activeModalRequest.id}`
          }
          subtitle={`Requester: ${activeModalRequest.requesterName} (${activeModalRequest.requesterRole})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-tertiary)]">Amount / Allocation:</span>
                <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                  {activeModalRequest.amountOrQuantity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-tertiary)]">Channel:</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {activeModalRequest.details}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-tertiary)]">Date Submitted:</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {activeModalRequest.date}
                </span>
              </div>
              {activeModalRequest.notes && (
                <div className="pt-2 border-t border-[var(--glass-border)] text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Requester Note: </span>
                  {activeModalRequest.notes}
                </div>
              )}
            </div>

            {modalMode === 'APPROVE' && (
              <p className="text-[var(--text-secondary)]">
                Approving this request will credit the account balance or allocate the prefix numbers immediately. Are you sure you wish to proceed?
              </p>
            )}

            {modalMode === 'REJECT' && (
              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-primary)]">
                  Rejection Reason (will be communicated to requester):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unverified bank transfer reference, invalid wallet address..."
                  className="w-full p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-rose)]"
                />
              </div>
            )}

            {modalMode === 'DETAILS' && activeModalRequest.processedBy && (
              <div className="p-3 bg-[var(--input-bg-subtle)] rounded-xl border border-[var(--glass-border)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)]">Audit Telemetry:</div>
                <div className="text-[var(--text-secondary)]">
                  Processed by <span className="font-semibold text-[var(--text-primary)]">{activeModalRequest.processedBy}</span> on {activeModalRequest.processedAt}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--glass-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveModalRequest(null);
                  setModalMode(null);
                }}
              >
                Close
              </Button>

              {modalMode === 'APPROVE' && (
                <Button variant="primary" size="sm" onClick={handleConfirmAction}>
                  Confirm Approval
                </Button>
              )}

              {modalMode === 'REJECT' && (
                <button
                  onClick={handleConfirmAction}
                  className="px-3 py-1.5 bg-[var(--accent-rose)] hover:opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
