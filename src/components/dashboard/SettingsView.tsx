/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Lock,
  Key,
  Database,
  Radio,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'telecom' | 'security' | 'notifications'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState('Enterprise Telecom Operations Platform');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [autoDlrReconcile, setAutoDlrReconcile] = useState(true);
  const [lowBalanceAlertThreshold, setLowBalanceAlertThreshold] = useState('50.00');
  const [webhookUrl, setWebhookUrl] = useState('https://api.platform.internal/webhooks/inbound');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Settings & System Configuration"
        description="Platform parameters, wholesale settlement policies, webhook routing, and security preferences."
        breadcrumbs={[
          { label: 'Platform' },
          { label: 'Settings' },
        ]}
        primaryAction={{
          label: isSaving ? 'Saving...' : 'Save Changes',
          onClick: handleSave,
          icon: isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />,
          isLoading: isSaving,
        }}
        badge={
          <Badge variant="neutral" size="sm">
            Core Engine v1.4.0
          </Badge>
        }
      />

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.2)] text-xs text-[var(--accent-emerald)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform configuration updated successfully. Applied to active sessions.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-xl w-fit text-xs border border-[var(--glass-border)]">
        {[
          { id: 'general', label: 'Platform & General', icon: <Settings className="w-3.5 h-3.5" /> },
          { id: 'telecom', label: 'Telecom & Webhooks', icon: <Radio className="w-3.5 h-3.5" /> },
          { id: 'security', label: 'Security & RBAC', icon: <Shield className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Alert Thresholds', icon: <Bell className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Organization Details" description="Tenant identity and operating standards">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Platform Display Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:border-[var(--accent-blue)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Settlement Currency Code
                </label>
                <input
                  type="text"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:border-[var(--accent-blue)] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  System Architecture Tier
                </label>
                <div className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)] font-medium">Enterprise Carrier HA</span>
                  <Badge variant="success" size="sm">Operational</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Financial Settlement Defaults" description="Ledger rounding and reconciliation intervals">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Sub-Cent Micro-unit Clearing</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">Precision 10^-6 microunits for zero loss</div>
                </div>
                <Badge variant="success" size="sm">Enforced</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Automated Delivery DLR Clearing</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">Post immediate debit upon successful network ACK</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoDlrReconcile}
                  onChange={(e) => setAutoDlrReconcile(e.target.checked)}
                  className="rounded border-[var(--glass-border)] text-[var(--accent-blue)]"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'telecom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Webhook Delivery Defaults" description="HTTP endpoints for real-time inbound events">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Global Inbound Webhook URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs font-mono focus:border-[var(--accent-blue)] outline-none"
                />
              </div>
              <div className="p-3 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] text-[11px] text-[var(--accent-blue)]">
                Inbound events will be signed with the platform HMAC-SHA256 secret key.
              </div>
            </div>
          </Card>

          <Card title="Protocol Heartbeats" description="Carrier session keepalive intervals">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">HTTP Keepalive:</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">30 seconds</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">SMPP Enquire Link:</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">60 seconds</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--text-secondary)]">Auto Carrier Failover:</span>
                <span className="font-mono text-[var(--accent-emerald)] font-semibold">Enabled (3 retries)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="RBAC Policy Enforcement" description="Granular authorization rules across roles">
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Super Admin Oversight</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">Full authority across all domains</div>
                </div>
                <Badge variant="purple" size="sm">Strict</Badge>
              </div>
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Manager Agent Scoping</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">Restricted to supervised agent hierarchies</div>
                </div>
                <Badge variant="info" size="sm">Active</Badge>
              </div>
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Client Isolation</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">Zero cross-tenant DID or CDR leakage</div>
                </div>
                <Badge variant="success" size="sm">Isolated</Badge>
              </div>
            </div>
          </Card>

          <Card title="Session & Auth Tokens" description="JWT safety buffers and expiry durations">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Access Token TTL:</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">15 minutes</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Preemptive Refresh Skew:</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">15 seconds</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--text-secondary)]">Password Hash Algorithm:</span>
                <span className="font-mono font-semibold text-[var(--accent-blue)]">Bcrypt (Cost 12)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card title="Operational Alerts & Thresholds" description="When to trigger high-priority alerts">
          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">
                Client Low Balance Alert Threshold ($)
              </label>
              <input
                type="number"
                value={lowBalanceAlertThreshold}
                onChange={(e) => setLowBalanceAlertThreshold(e.target.value)}
                className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs font-mono focus:border-[var(--accent-blue)] outline-none"
              />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                Generates a notification when a prepaid client balance drops below this value.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
