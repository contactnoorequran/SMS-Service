/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Table, ColumnDef } from '../../ui/Table';
import {
  ClientDetail,
  ClientStatus,
  ClientNumberSummary,
  ClientRecentSmsItem,
} from '../../../types/clients';
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../../../utils/formatters';
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  UserCheck,
  Edit2,
  Power,
  ExternalLink,
  CheckCircle2,
  Phone,
  DollarSign,
  Briefcase,
  Activity,
  Send,
  Inbox,
  Lock,
  Globe,
  Radio,
  FileText,
  Key,
} from 'lucide-react';

interface ClientDetailsViewProps {
  client: ClientDetail;
  onBack: () => void;
  onEdit: (client: ClientDetail) => void;
  onStatusChange: (client: ClientDetail) => void;
  onAssignAgent: (client: ClientDetail) => void;
  onViewTransactions: (client: ClientDetail) => void;
}

const CLIENT_PERMISSION_GROUPS = [
  {
    module: 'Messaging Services',
    permissions: [
      { code: 'messages.send', label: 'Outbound SMS Dispatch', desc: 'Send single and bulk SMS via portal and API' },
      { code: 'messages.inbound', label: 'Inbound Webhooks', desc: 'Receive two-way SMS and callbacks' },
    ],
  },
  {
    module: 'Number Inventory',
    permissions: [
      { code: 'numbers.read', label: 'Inspect Numbers', desc: 'View assigned E.164 phone numbers' },
    ],
  },
  {
    module: 'Financials & Billing',
    permissions: [
      { code: 'billing.view', label: 'View Ledger', desc: 'Inspect wallet balance and recharge transactions' },
      { code: 'rates.read', label: 'Rate Cards', desc: 'View retail SMS destination pricing' },
    ],
  },
  {
    module: 'Reporting & Analytics',
    permissions: [
      { code: 'reports.read', label: 'CDR Reports', desc: 'Export delivery statistics and transmission records' },
    ],
  },
];

export const ClientDetailsView: React.FC<ClientDetailsViewProps> = ({
  client,
  onBack,
  onEdit,
  onStatusChange,
  onAssignAgent,
  onViewTransactions,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'numbers' | 'traffic' | 'activity'>('overview');

  const getStatusBadgeVariant = (status: ClientStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const initials = (client?.companyName || 'Client')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const totalSms = client?.smsCount ?? 0;
  const outboundSms = client?.outboundSmsCount ?? 0;
  const successRate = totalSms > 0
    ? (outboundSms / totalSms) * 100
    : 0;

  const numberColumns: ColumnDef<ClientNumberSummary>[] = [
    {
      key: 'e164Number',
      header: 'E.164 Number',
      render: (num) => (
        <div className="font-mono text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          <span>{num.e164Number}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'country',
      header: 'Country / Operator',
      render: (num) => (
        <div>
          <div className="text-xs text-[var(--text-primary)] font-medium">{num.country} ({num.countryCode})</div>
          <div className="text-[10px] text-[var(--text-muted)]">{num.operator}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'provider',
      header: 'Routing Provider',
      render: (num) => (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {num.provider}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'capabilities',
      header: 'Capabilities',
      render: (num) => (
        <div className="flex items-center gap-1">
          {Array.isArray(num?.capabilities) && num.capabilities.map((cap) => (
            <Badge key={cap} variant="neutral" size="sm">
              {cap}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'monthlyCost',
      header: 'Monthly Fee',
      render: (num) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatCurrency(num.monthlyCost)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'assignedAt',
      header: 'Allocated Date',
      render: (num) => (
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {formatDate(num.assignedAt)}
        </span>
      ),
      sortable: true,
    },
  ];

  const smsColumns: ColumnDef<ClientRecentSmsItem>[] = [
    {
      key: 'id',
      header: 'Transmission ID',
      render: (sms) => (
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {sms.id}
        </span>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (sms) => (
        <Badge variant={sms.direction === 'OUTBOUND' ? 'info' : 'purple'} size="sm">
          {sms.direction}
        </Badge>
      ),
    },
    {
      key: 'parties',
      header: 'Sender / Recipient',
      render: (sms) => (
        <div className="font-mono text-xs">
          <div className="text-[var(--text-primary)]">To: {sms.recipient}</div>
          <div className="text-[10px] text-[var(--text-muted)]">From: {sms.sender}</div>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message Payload',
      render: (sms) => (
        <span className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-xs">
          {sms.message}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (sms) => (
        <Badge
          variant={
            sms.status === 'DELIVERED' || sms.status === 'RECEIVED'
              ? 'success'
              : sms.status === 'PENDING'
              ? 'warning'
              : 'error'
          }
          size="sm"
        >
          {sms.status}
        </Badge>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (sms) => (
        <span className="font-mono text-xs font-semibold text-[var(--accent-emerald)]">
          {formatCurrency(sms.cost)}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Time',
      render: (sms) => (
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {formatRelativeTime(sms.timestamp)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: onBack },
              { label: 'Clients', onClick: onBack },
              { label: client.companyName },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back to Clients directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {client.companyName}
            </h1>
            <Badge variant={getStatusBadgeVariant(client.status)} size="md">
              {client.status}
            </Badge>
            <Badge variant="neutral" size="md">
              {client.billingType}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onViewTransactions(client)}>
            <DollarSign className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-emerald)]" />
            View Ledger
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAssignAgent(client)}>
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-blue)]" />
            Reassign Agent
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(client)}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button
            variant={client.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onStatusChange(client)}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            {client.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
          </Button>
        </div>
      </div>

      {/* Two-Column Master/Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3 width): Identity, Hierarchy, and Financials */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-lg shadow-[0_0_20px_var(--accent-blue-dim)]">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                  {client.companyName}
                </h2>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Contact: <span className="text-[var(--text-primary)] font-medium">{client.name}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Client ID</span>
                <span className="font-mono text-[var(--text-primary)]">{client.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Operations Email</span>
                <span className="font-mono text-[var(--text-primary)] truncate max-w-[180px]">{client.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Contact Phone</span>
                <span className="font-mono text-[var(--text-primary)]">{client.contactPhone}</span>
              </div>

              {client.website && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Website</span>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent-blue)] hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{client.website.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Member Since</span>
                <span className="font-mono text-[var(--text-primary)]">{formatDate(client.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Last Activity</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {client.lastLoginAt ? formatRelativeTime(client.lastLoginAt) : 'Never'}
                </span>
              </div>
            </div>
          </Card>

          {/* Account / Operational State Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Account & Gateway Status
              </h3>
              <Badge variant={getStatusBadgeVariant(client.status)} size="sm">
                {client.status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Commercial Tier</span>
                <span className="font-semibold text-[var(--text-primary)]">{client.billingType} Enterprise</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">API Gateway Access</span>
                {client.apiAccess?.enabled ? (
                  <Badge variant="success" size="sm">
                    Active ({client.apiAccess.rateLimitPerSecond || 100} req/s)
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Disabled</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Active API Keys</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {client.apiAccess?.activeKeysCount || 1} credentials
                </span>
              </div>
            </div>
          </Card>

          {/* Hierarchy Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Supervising Hierarchy
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssignAgent(client)}
                className="text-[var(--accent-blue)] text-xs h-6 px-2"
              >
                Reassign
              </Button>
            </div>

            {/* Supervising Agent */}
            <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Assigned Agent
                </span>
                <Badge variant="purple" size="sm">
                  Representative
                </Badge>
              </div>

              {client.agentName ? (
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)]">{client.agentName}</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">{client.agentEmail}</div>
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] italic">
                  Unassigned — Managed directly by platform operations
                </div>
              )}
            </div>

            {/* Supervising Manager */}
            <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Supervising Manager
                </span>
                <Badge variant="info" size="sm">
                  Executive
                </Badge>
              </div>

              {client.managerName ? (
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)]">{client.managerName}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Operations Oversight</div>
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] italic">
                  Direct Super Admin Oversight
                </div>
              )}
            </div>
          </Card>

          {/* Financial Overview Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Wallet & Commercial Balance
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewTransactions(client)}
                className="text-[var(--accent-emerald)] text-xs h-6 px-2"
              >
                Full Ledger
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-[var(--text-secondary)]">Current Balance</span>
                <div className="text-2xl font-extrabold text-[var(--accent-emerald)] font-mono mt-0.5">
                  {formatCurrency(client.balance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[var(--text-muted)] text-[11px]">Credit Limit:</span>
                  <div className="font-mono font-semibold text-[var(--text-primary)]">
                    {formatCurrency(client.financials?.creditLimit || 0)}
                  </div>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] text-[11px]">Available Credit:</span>
                  <div className="font-mono font-semibold text-[var(--accent-blue)]">
                    {formatCurrency(client.financials?.availableCredit || client.balance)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Lifetime SMS Spent:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {formatCurrency(client.financials?.totalSpent || 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (2/3 width): Tabbed Views (Numbers, Messaging Traffic, Recent Activity, Permissions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Allocated DIDs
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                {client.assignedNumbersCount} E.164
              </div>
              <span className="text-[10px] text-[var(--accent-purple)]">Active Lines</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Total Dispatched
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                {formatNumber(client.smsCount)}
              </div>
              <span className="text-[10px] text-[var(--accent-blue)]">Cumulative SMS</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Delivery Rate
              </span>
              <div className="text-lg font-bold text-[var(--accent-emerald)] font-mono mt-0.5">
                {formatPercent(successRate)}
              </div>
              <span className="text-[10px] text-[var(--accent-emerald)]">High Reliability</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Inbound Ingress
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                {formatNumber(client.inboundSmsCount)}
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Received Callbacks</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              Numbers & Inventory ({client.numbers?.length || client.assignedNumbersCount || 0})
            </button>

            <button
              onClick={() => setActiveTab('traffic')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'traffic'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              SMS Traffic Stream
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'activity'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              Audit Activity ({client.recentActivity?.length || 0})
            </button>
          </div>

          {/* TAB 1: NUMBERS ALLOCATION */}
          {activeTab === 'overview' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Allocated E.164 Phone Numbers
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Phone lines dedicated to {client.companyName} for two-way SMS and notifications
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  {client.numbers?.length || 0} Lines Active
                </Badge>
              </div>

              {client.numbers && client.numbers.length > 0 ? (
                <Table
                  columns={numberColumns}
                  data={client.numbers}
                  keyExtractor={(n) => n.id}
                  emptyMessage="No numbers assigned to this client account."
                />
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--accent-purple)]" />
                  No phone numbers are assigned to this client account.
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: SMS TRAFFIC FEED */}
          {activeTab === 'traffic' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Live Messaging Stream & CDR Telemetry
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Real-time outbound dispatches and inbound callbacks
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  Active Feed
                </Badge>
              </div>

              {client.recentSms && client.recentSms.length > 0 ? (
                <Table
                  columns={smsColumns}
                  data={client.recentSms}
                  keyExtractor={(s) => s.id}
                  emptyMessage="No recent message telemetry for this account."
                />
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <Send className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--accent-blue)]" />
                  No live SMS transmissions logged for this customer account.
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: RECENT ACTIVITY */}
          {activeTab === 'activity' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Client Lifecycle Audit Feed
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Security events, balance updates, status transitions, and credential modifications
                  </p>
                </div>
              </div>

              {client.recentActivity && client.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {client.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.action.replace('_', ' ')}
                          </span>
                          {item.actor && (
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              by {item.actor}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-secondary)] text-[11px]">{item.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] text-[var(--text-muted)] block">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        {item.ipAddress && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            IP: {item.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No recent security audit logs recorded.
                </div>
              )}
            </Card>
          )}

          {/* Effective Permissions Card */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
                Effective Client RBAC Permissions
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Active permissions granted to the client portal and customer service tokens
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLIENT_PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.module}
                  className="p-3.5 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] space-y-2"
                >
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    {group.module}
                  </span>
                  <div className="space-y-1.5">
                    {group.permissions.map((perm) => (
                      <div key={perm.code} className="flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-medium text-[var(--text-primary)] block">{perm.label}</span>
                          <span className="text-[11px] text-[var(--text-muted)]">{perm.desc}</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
