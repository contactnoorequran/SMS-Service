/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Hash,
  Radio,
  Wallet,
  Cable,
  Copy,
  Check,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Code,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ClientDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
}

interface LiveOtpMessage {
  id: string;
  sender: string;
  service: string;
  number: string;
  code: string;
  text: string;
  time: string;
}

const INITIAL_OTPS: LiveOtpMessage[] = [
  {
    id: 'MSG-8812',
    sender: 'WhatsApp',
    service: 'Messaging',
    number: '+44 7911 123456',
    code: '729-104',
    text: 'Your WhatsApp verification code is 729-104. Do not share this code with anyone.',
    time: '45s ago',
  },
  {
    id: 'MSG-8811',
    sender: 'Google',
    service: 'Authentication',
    number: '+1 202 555 0192',
    code: '904128',
    text: 'G-904128 is your Google verification code.',
    time: '2m ago',
  },
  {
    id: 'MSG-8810',
    sender: 'Telegram',
    service: 'Messaging',
    number: '+44 7911 987654',
    code: '44812',
    text: 'Telegram code: 44812. You can also tap on this link to log in...',
    time: '5m ago',
  },
  {
    id: 'MSG-8809',
    sender: 'Uber',
    service: 'Rideshare',
    number: '+49 151 2345678',
    code: '3190',
    text: 'Your Uber code is 3190. Never share this code.',
    time: '8m ago',
  },
];

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({ onNavigateToTab }) => {
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const handleCopyOtp = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 2500);
  };

  const handleCopyApiToken = () => {
    navigator.clipboard.writeText('sms_live_pk_88a9120e98f7c112b450');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.06)] via-transparent to-[rgba(16,185,129,0.04)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Client Self-Service Portal
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                SMS Service API & Numbers
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Client Overview
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Real-time inbound SMS stream, automated OTP verification extraction, leased phone numbers, and webhook integrations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('client-webhooks')}
              className="gap-2 text-xs"
            >
              <Cable className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span>Webhooks & Ping</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateToTab('client-numbers')}
              className="gap-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lease Number</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Leased Numbers</span>
            <Hash className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">8</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--accent-emerald)]">
              <span>All 100% Active</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Received Today</span>
            <Radio className="w-4 h-4 text-[var(--accent-emerald)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">342</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--accent-emerald)]">
              <TrendingUp className="w-3 h-3" />
              <span>+24% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>OTPs Extracted</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">318</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-tertiary)]">
              <span>93% extraction rate</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Wallet Balance</span>
            <Wallet className="w-4 h-4 text-[var(--accent-emerald)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--accent-emerald)] font-mono">$245.80</div>
            <button
              onClick={() => onNavigateToTab('client-wallet')}
              className="text-[11px] text-[var(--accent-blue)] hover:underline mt-1 block text-left"
            >
              Top-up balance &rarr;
            </button>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Webhook Health</span>
            <Cable className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">99.8%</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-tertiary)] font-mono">
              <span>Avg Latency: 42ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Inbound OTP Stream Feed */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse-dot" />
              <span>Live Inbound OTP Stream</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Instant incoming verification codes and SMS messages received on your leased numbers
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('client-inbound')}
            className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>View Full Stream</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[var(--glass-border)] border border-[var(--glass-border)] rounded-xl overflow-hidden bg-[rgba(0,0,0,0.12)]">
          {INITIAL_OTPS.map((msg) => (
            <div
              key={msg.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--glass-bg)] transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--accent-blue)] font-bold text-xs flex items-center justify-center shrink-0">
                  {msg.sender.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-primary)]">{msg.sender}</span>
                    <Badge variant="neutral" size="sm">
                      {msg.service}
                    </Badge>
                    <span className="text-[11px] font-mono text-[var(--accent-blue)]">
                      {msg.number}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      {msg.time}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>

              {/* OTP Code Badge & Copy Action */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <div className="p-2 px-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(59,130,246,0.3)] rounded-xl flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">OTP:</span>
                  <span className="font-mono font-bold text-sm text-[var(--accent-blue)] tracking-wider">
                    {msg.code}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyOtp(msg.id, msg.code)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedOtpId === msg.id
                      ? 'bg-[var(--accent-emerald)] text-white shadow-md'
                      : 'bg-[var(--glass-bg)] hover:bg-[var(--accent-blue-dim)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--glass-border)]'
                  }`}
                  title="Copy verification code"
                >
                  {copiedOtpId === msg.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick API Credentials & Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Token Card */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Client REST API Access</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('rest-api')}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              Docs & SDK &rarr;
            </button>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Use your personal bearer token to fetch inbound SMS, poll OTPs, and query leased number health via REST API.
          </p>

          <div className="p-3 bg-[rgba(0,0,0,0.25)] border border-[var(--glass-border)] rounded-xl flex items-center justify-between gap-3 font-mono text-xs">
            <span className="text-[var(--text-tertiary)] truncate">
              sms_live_pk_88a9120e98f7c112b450...
            </span>
            <button
              onClick={handleCopyApiToken}
              className="px-2.5 py-1 bg-[var(--glass-bg)] hover:bg-[var(--accent-blue-dim)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--glass-border)] rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedToken ? <Check className="w-3 h-3 text-[var(--accent-emerald)]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedToken ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-tertiary)] flex items-center justify-between">
            <span>Base URL: <code className="font-mono text-[var(--text-primary)]">http://localhost:3000/api/v1</code></span>
            <Badge variant="success" size="sm">Rate Limit: 60 req/min</Badge>
          </div>
        </div>

        {/* Active Webhook Status Card */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Cable className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span>Automated Webhook Relay</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('client-webhooks')}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              Configure & Test &rarr;
            </button>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Forward every inbound SMS and extracted OTP directly to your application backend with sub-50ms latency.
          </p>

          <div className="p-3 bg-[rgba(0,0,0,0.25)] border border-[var(--glass-border)] rounded-xl space-y-1.5 font-mono text-xs">
            <div className="text-[11px] text-[var(--text-tertiary)]">Target URL:</div>
            <div className="text-[var(--text-primary)] truncate font-semibold">
              https://api.acmetelematics.com/v1/sms/inbound
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)]" />
              <span className="text-[var(--text-primary)] font-medium">Relay Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('client-webhooks')}
              className="text-xs"
            >
              Send Test Ping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
