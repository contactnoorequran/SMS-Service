/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  Copy,
  Check,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Hash,
  Clock,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InboundMessage {
  id: string;
  sender: string;
  service: string;
  leasedNumber: string;
  country: string;
  flag: string;
  text: string;
  extractedOtp?: string;
  webhookDelivered: boolean;
  webhookLatencyMs: number;
  receivedAt: string;
}

const SEED_STREAM: InboundMessage[] = [
  {
    id: 'MSG-9921',
    sender: 'WhatsApp',
    service: 'Messaging',
    leasedNumber: '+44 7911 123456',
    country: 'UK',
    flag: '🇬🇧',
    text: 'Your WhatsApp code is 881-209. You can also tap this link to verify your account: v.whatsapp.com/881209',
    extractedOtp: '881-209',
    webhookDelivered: true,
    webhookLatencyMs: 42,
    receivedAt: 'Just now',
  },
  {
    id: 'MSG-9920',
    sender: 'Google',
    service: 'Identity',
    leasedNumber: '+1 202 555 0192',
    country: 'USA',
    flag: '🇺🇸',
    text: 'G-748192 is your Google verification code. Do not reply to this message.',
    extractedOtp: '748192',
    webhookDelivered: true,
    webhookLatencyMs: 38,
    receivedAt: '1m ago',
  },
  {
    id: 'MSG-9919',
    sender: 'Telegram',
    service: 'Messaging',
    leasedNumber: '+44 7911 987654',
    country: 'UK',
    flag: '🇬🇧',
    text: 'Telegram code: 91043. Use it to log in to your Telegram account. Never give this code to anyone.',
    extractedOtp: '91043',
    webhookDelivered: true,
    webhookLatencyMs: 45,
    receivedAt: '3m ago',
  },
  {
    id: 'MSG-9918',
    sender: 'Microsoft',
    service: 'Security',
    leasedNumber: '+49 151 2345678',
    country: 'Germany',
    flag: '🇩🇪',
    text: 'Use 629015 as Microsoft account password reset code.',
    extractedOtp: '629015',
    webhookDelivered: true,
    webhookLatencyMs: 51,
    receivedAt: '7m ago',
  },
  {
    id: 'MSG-9917',
    sender: 'Uber',
    service: 'Rideshare',
    leasedNumber: '+1 202 555 0192',
    country: 'USA',
    flag: '🇺🇸',
    text: 'Your Uber code is 4492. Never share this code with anyone.',
    extractedOtp: '4492',
    webhookDelivered: true,
    webhookLatencyMs: 39,
    receivedAt: '12m ago',
  },
  {
    id: 'MSG-9916',
    sender: 'Discord',
    service: 'Gaming',
    leasedNumber: '+46 70 123 4567',
    country: 'Sweden',
    flag: '🇸🇪',
    text: 'Your Discord verification code is: 819034',
    extractedOtp: '819034',
    webhookDelivered: true,
    webhookLatencyMs: 48,
    receivedAt: '19m ago',
  },
];

export const ClientInboundStreamView: React.FC = () => {
  const [messages, setMessages] = useState<InboundMessage[]>(SEED_STREAM);
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);

  // Simulated live message ticker
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      const senders = ['TikTok', 'Instagram', 'Apple', 'Binance', 'Steam'];
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const newMsg: InboundMessage = {
        id: `MSG-${Date.now().toString().slice(-4)}`,
        sender,
        service: 'Authentication',
        leasedNumber: '+44 7911 123456',
        country: 'UK',
        flag: '🇬🇧',
        text: `Your ${sender} verification code is ${otp}. Valid for 5 minutes.`,
        extractedOtp: otp,
        webhookDelivered: true,
        webhookLatencyMs: Math.floor(30 + Math.random() * 30),
        receivedAt: 'Just now',
      };
      setMessages((prev) => [newMsg, ...prev.slice(0, 24)]);
    }, 18000);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  const handleCopyOtp = (id: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredMessages = messages.filter(
    (m) =>
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.leasedNumber.includes(search) ||
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      (m.extractedOtp && m.extractedOtp.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse-dot" />
              <Badge variant="success" size="sm">
                Live Inbound Feed Active
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                Real-time Webhook & Telemetry
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Live OTP & SMS Stream
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Incoming text messages received on all your leased virtual numbers with real-time OTP regex extraction.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLiveActive((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLiveActive
                  ? 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border-[rgba(16,185,129,0.3)]'
                  : 'bg-[rgba(0,0,0,0.2)] text-[var(--text-tertiary)] border-[var(--glass-border)]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-[var(--accent-emerald)] animate-pulse' : 'bg-[var(--text-tertiary)]'}`} />
              <span>{isLiveActive ? 'Stream Live' : 'Stream Paused'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search sender, code or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        <div className="text-xs font-mono text-[var(--text-tertiary)] hidden sm:block">
          {filteredMessages.length} messages in buffer
        </div>
      </div>

      {/* Stream Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="glass-card p-12 text-center text-xs text-[var(--text-tertiary)] rounded-2xl border border-[var(--glass-border)]">
            No incoming SMS matched your search query.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="glass-card p-4 sm:p-5 rounded-2xl border border-[var(--glass-border)] hover:border-[rgba(59,130,246,0.3)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Sender, Number, Text */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--accent-blue)] font-bold text-xs flex items-center justify-center shrink-0">
                  {msg.sender.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      {msg.sender}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {msg.service}
                    </Badge>
                    <div className="flex items-center gap-1 font-mono text-xs text-[var(--accent-blue)]">
                      <span>{msg.flag}</span>
                      <span>{msg.leasedNumber}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono ml-auto sm:ml-0">
                      {msg.receivedAt}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] bg-[rgba(0,0,0,0.2)] p-2.5 rounded-xl border border-[var(--glass-border)] font-mono leading-relaxed select-all">
                    {msg.text}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] font-mono">
                    <span className="flex items-center gap-1 text-[var(--accent-emerald)]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Webhook Dispatched ({msg.webhookLatencyMs}ms)</span>
                    </span>
                    <span>&bull;</span>
                    <span>ID: {msg.id}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Extracted OTP & Copy button */}
              {msg.extractedOtp && (
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[var(--glass-border)] w-full md:w-auto justify-between md:justify-end">
                  <div className="p-2.5 px-4 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.3)] rounded-xl flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">OTP:</span>
                    <span className="font-mono font-bold text-base text-[var(--accent-blue)] tracking-wider">
                      {msg.extractedOtp}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyOtp(msg.id, msg.extractedOtp)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedId === msg.id
                        ? 'bg-[var(--accent-emerald)] text-white shadow-md'
                        : 'bg-[var(--glass-bg)] hover:bg-[var(--accent-blue-dim)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--glass-border)]'
                    }`}
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy OTP</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
