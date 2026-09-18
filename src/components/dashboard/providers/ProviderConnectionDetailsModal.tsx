/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  ProviderDetail,
  ProviderConnectionSummary,
} from '../../../types/providers';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';
import {
  Server,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Globe,
  Activity,
  Terminal,
} from 'lucide-react';

interface ProviderConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderDetail | null;
  connection: ProviderConnectionSummary | null;
  onTestConnection: (
    providerId: string,
    connectionId: string
  ) => Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }>;
}

export const ProviderConnectionDetailsModal: React.FC<ProviderConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  provider,
  connection,
  onTestConnection,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    timestamp: string;
  } | null>(null);

  if (!provider || !connection) return null;

  const handleRunPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(provider.id, connection.id);
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'Ping diagnostic timed out or connection refused',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getConnectionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DISCONNECTED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Connection Bind Diagnostics: ${connection.name}`}
      size="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Connection Header Summary */}
        <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-sm shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">{connection.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {connection.host}:{connection.port} • Priority {connection.priority}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={connection.environment === 'PRODUCTION' ? 'purple' : 'neutral'} size="sm">
              {connection.environment}
            </Badge>
            <Badge variant={getConnectionStatusBadgeVariant(connection.status)} size="sm">
              {connection.status}
            </Badge>
          </div>
        </div>

        {/* Technical Architecture Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Protocol Type
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)] mt-1 block">
              {connection.connectionType}
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Socket Encryption
            </span>
            <span className="font-mono font-bold text-[var(--accent-emerald)] mt-1 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {connection.tlsEnabled ? 'TLS Enforced' : 'Plain Text'}
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Last Ping Latency
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)] mt-1 block">
              {connection.lastPingMs ? `${connection.lastPingMs} ms` : 'N/A'}
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Last Response
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)] mt-1 block">
              {connection.lastSuccessAt ? formatRelativeTime(connection.lastSuccessAt) : 'Never'}
            </span>
          </div>
        </div>

        {/* KMS Credential Reference (Sanitized, No Secrets) */}
        <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--accent-blue)]" />
              KMS Vault Credential Reference
            </span>
            <Badge variant="success" size="sm">
              Vault Bound
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px]">
            <div>
              <span className="text-[var(--text-muted)]">Reference ID:</span>
              <span className="font-mono text-[var(--text-primary)] ml-2">{connection.credential?.id || connection.credentialRefId || 'cred-ref-default'}</span>
            </div>

            <div>
              <span className="text-[var(--text-muted)]">Key Label:</span>
              <span className="text-[var(--text-primary)] font-medium ml-2">{connection.credential?.label || 'Primary KMS Trunk Vault'}</span>
            </div>

            <div>
              <span className="text-[var(--text-muted)]">KMS Version:</span>
              <span className="font-mono text-[var(--text-primary)] ml-2">{connection.credential?.keyVersion || 'v1'}</span>
            </div>

            <div>
              <span className="text-[var(--text-muted)]">Last Rotated:</span>
              <span className="font-mono text-[var(--text-primary)] ml-2">
                {connection.credential?.rotatedAt ? formatDate(connection.credential.rotatedAt) : 'Initial'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] italic pt-1">
            Plaintext API secrets and SMPP passwords reside in AWS KMS HSM modules and cannot be exported or rendered in the browser.
          </p>
        </div>

        {/* Live Diagnostics Section */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-emerald)]" />
              Live Socket Diagnostic Ping
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunPingTest}
              isLoading={isTesting}
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-[var(--accent-amber)]" />
              Run Health Ping
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                testResult.success
                  ? 'bg-[var(--accent-emerald-dim)] border-[var(--accent-emerald)]/30 text-[var(--text-primary)]'
                  : 'bg-[var(--accent-rose-dim)] border-[var(--accent-rose)]/30 text-[var(--text-primary)]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[var(--accent-rose)] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>{testResult.message}</span>
                  <span className="font-mono text-[11px]">{testResult.latencyMs}ms</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  Timestamp: {new Date(testResult.timestamp).toLocaleTimeString()} • Checked via TLS socket echo
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Diagnostics
          </Button>
        </div>
      </div>
    </Modal>
  );
};
