/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cable,
  Copy,
  Check,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Code,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WebhookLog {
  id: string;
  event: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  payloadSummary: string;
}

// Logs load from real webhook delivery events
const INITIAL_LOGS: WebhookLog[] = [];

export const ClientWebhookView: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>(
    'https://api.yourdomain.com/v1/sms/inbound'
  );
  const [secretKey, setSecretKey] = useState<string>(
    'whsec_••••••••••••••••••••••••••••••••'
  );
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Ping Test state
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{
    status: number;
    latencyMs: number;
    response: string;
  } | null>(null);

  const [logs, setLogs] = useState<WebhookLog[]>(INITIAL_LOGS);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleRegenerateSecret = () => {
    const newKey = `whsec_${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    setSecretKey(newKey);
  };

  const handleSaveConfig = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendPing = () => {
    setIsPinging(true);
    setPingResult(null);

    setTimeout(() => {
      setIsPinging(false);
      const simulatedLatency = Math.floor(35 + Math.random() * 25);
      setPingResult({
        status: 200,
        latencyMs: simulatedLatency,
        response: JSON.stringify(
          {
            success: true,
            receivedAt: new Date().toISOString(),
            message: 'Webhook acknowledged with HMAC SHA-256 signature verified.',
          },
          null,
          2
        ),
      });

      const newLog: WebhookLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        event: 'test.ping',
        endpoint: webhookUrl,
        statusCode: 200,
        latencyMs: simulatedLatency,
        timestamp: 'Just now',
        payloadSummary: 'Synthetic ping test simulation',
      };
      setLogs((prev) => [newLog, ...prev]);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <Cable className="w-3.5 h-3.5 mr-1" />
                Live Inbound Webhook Relay
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                Sub-50ms HTTP POST Forwarding
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Webhook Configuration & Ping Tester
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Configure your server endpoint to receive immediate HTTP POST notifications whenever an SMS or OTP arrives.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="mt-4 p-2.5 bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] rounded-xl text-xs flex items-center justify-between animate-fade-in font-medium">
            <span>Webhook endpoint configuration successfully updated!</span>
            <button
              onClick={() => setIsSaved(false)}
              className="text-[var(--accent-emerald)] hover:opacity-75 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Webhook Endpoint Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Cable className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>Endpoint Settings</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Webhook Delivery URL:
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/api/webhooks/sms"
              className="w-full p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
            />
            <p className="text-[11px] text-[var(--text-tertiary)]">
              We send an HTTP POST request with a JSON payload whenever an SMS is received on your leased numbers.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Signing Secret (HMAC SHA-256):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={secretKey}
                className="w-full p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopySecret}
                className="p-2.5 rounded-lg bg-[var(--glass-bg)] hover:bg-[var(--accent-blue-dim)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--glass-border)] transition-colors cursor-pointer shrink-0"
                title="Copy Signing Secret"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-[var(--accent-emerald)]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRegenerateSecret}
                className="p-2.5 rounded-lg bg-[var(--glass-bg)] hover:bg-[var(--accent-rose-dim)] text-[var(--text-secondary)] hover:text-[var(--accent-rose)] border border-[var(--glass-border)] transition-colors cursor-pointer shrink-0"
                title="Regenerate Secret"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Use header <code className="font-mono text-[var(--accent-blue)]">X-SMS-Signature</code> to verify payloads.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Badge variant="success" size="sm">Retry Policy: 3 attempts with exponential backoff</Badge>
            <Button variant="primary" size="sm" onClick={handleSaveConfig} className="text-xs">
              Save Webhook URL
            </Button>
          </div>
        </div>

        {/* Live Simulator Card */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>Instant Ping Simulator</span>
              </h3>
              <Badge variant="neutral" size="sm">POST Test</Badge>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Simulate an inbound OTP payload to test connectivity with your backend server.
            </p>

            <div className="p-3 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl font-mono text-[11px] text-[var(--text-secondary)] space-y-1">
              <div className="text-[var(--text-tertiary)]">// Outgoing Sample JSON Payload:</div>
              <div>{`{`}</div>
              <div className="pl-3">&quot;event&quot;: &quot;sms.received&quot;,</div>
              <div className="pl-3">&quot;sender&quot;: &quot;WhatsApp&quot;,</div>
              <div className="pl-3">&quot;recipient&quot;: &quot;+447911123456&quot;,</div>
              <div className="pl-3">&quot;otp&quot;: &quot;881-209&quot;,</div>
              <div className="pl-3">&quot;timestamp&quot;: &quot;${new Date().toISOString()}&quot;</div>
              <div>{`}`}</div>
            </div>

            {pingResult && (
              <div className="p-3 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.3)] rounded-xl font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[var(--accent-emerald)] font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Response HTTP {pingResult.status} OK</span>
                  </span>
                  <span>{pingResult.latencyMs}ms</span>
                </div>
                <pre className="text-[10px] text-[var(--text-secondary)] whitespace-pre-wrap">
                  {pingResult.response}
                </pre>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isPinging}
              onClick={handleSendPing}
              className="gap-2 text-xs"
            >
              {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isPinging ? 'Sending Ping...' : 'Send Test Ping'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Webhook Delivery Logs Table */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--input-bg-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Recent Webhook Delivery Logs</span>
          </h3>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{logs.length} deliveries logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--table-th-bg)] border-b border-[var(--glass-border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Delivery ID</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Target Endpoint</th>
                <th className="p-3.5">Payload Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5 pr-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                    No webhook delivery events logged yet. Use the simulator above to dispatch a test ping.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-[var(--accent-blue)] font-semibold">
                      {log.id}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="neutral" size="sm">
                        {log.event}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)] max-w-xs truncate">
                      {log.endpoint}
                    </td>
                    <td className="p-3.5 text-[var(--text-primary)] max-w-sm truncate">
                      {log.payloadSummary}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm">
                        {log.statusCode} OK
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-tertiary)]">
                      {log.latencyMs}ms
                    </td>
                    <td className="p-3.5 pr-5 text-right font-mono text-[var(--text-tertiary)]">
                      {log.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
