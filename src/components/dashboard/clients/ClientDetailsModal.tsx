import React, { useState, useEffect } from 'react';
import { ClientDetail } from '../../../types/client';
import { apiClient } from '../../../services/api';
import {
  X,
  Building2,
  Phone,
  BarChart3,
  Wallet,
  History,
  Shield,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../../ui/Badge';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail | null;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'numbers' | 'statistics' | 'balance' | 'activity'>('profile');

  const [numbers, setNumbers] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [balanceData, setBalanceData] = useState<any | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && client) {
      setActiveTab('profile');
      loadSubResources(client.id);
    }
  }, [isOpen, client]);

  const loadSubResources = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [numbersRes, statsRes, balanceRes, activityRes] = await Promise.all([
        apiClient.getClientNumbers(clientId).catch(() => []),
        apiClient.getClientStatistics(clientId).catch(() => null),
        apiClient.getClientBalance(clientId).catch(() => null),
        apiClient.getClientActivity(clientId).catch(() => []),
      ]);

      setNumbers(numbersRes || []);
      setStats(statsRes);
      setBalanceData(balanceRes);
      setActivity(activityRes || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client sub-resources.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {client.companyName}
                </h2>
                <Badge
                  variant={
                    client.status === 'ACTIVE'
                      ? 'success'
                      : client.status === 'SUSPENDED'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {client.status}
                </Badge>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {client.billingType}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client ID: <span className="font-mono">{client.id}</span> • Contact: {client.name} ({client.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 gap-2">
          {[
            { id: 'profile', label: 'Overview & Profile', icon: Building2 },
            { id: 'numbers', label: `Assigned Numbers (${numbers.length})`, icon: Phone },
            { id: 'statistics', label: 'SMS Statistics', icon: BarChart3 },
            { id: 'balance', label: 'Balance & Ledger', icon: Wallet },
            { id: 'activity', label: 'Activity Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mr-2" />
              Loading client details and live telemetry...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Company Information
                  </h4>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Company Name:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{client.companyName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{client.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{client.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Phone Contact:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{client.contact || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Enrolled Since:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Operational Hierarchy
                  </h4>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Assigned Agent:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {client.agentName ? `${client.agentName} (${client.agentId})` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Supervising Manager:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {client.managerName ? `${client.managerName} (${client.managerId})` : 'Platform Direct'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Account Status:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{client.status}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Last Activity:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {client.lastActivityAt ? new Date(client.lastActivityAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Access Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-500" />
                    REST API Integration Status
                  </h4>
                  <Badge variant={client.apiAccess?.enabled ? 'success' : 'neutral'}>
                    {client.apiAccess?.enabled ? 'API Active' : 'API Disabled'}
                  </Badge>
                </div>
                {client.apiAccess?.enabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">API Key: </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{client.apiAccess.apiKey}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Rate Limit: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {client.apiAccess.rateLimitPerSecond} req/sec
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    API dispatch is currently disabled for this account.
                  </p>
                )}
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'numbers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Allocated Phone Numbers ({numbers.length})
                </span>
              </div>

              {numbers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Phone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No phone numbers currently assigned to this client.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Phone Number</th>
                        <th className="p-3">Country</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Capabilities</th>
                        <th className="p-3">Assigned Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {numbers.map((num: any) => (
                        <tr key={num.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                            {num.e164 || num.number}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {num.countryCode || 'US'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {num.type || 'LOCAL'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {num.capabilities?.join(', ') || 'SMS, MMS'}
                          </td>
                          <td className="p-3 text-slate-500">
                            {num.assignedAt ? new Date(num.assignedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-3">
                            <Badge variant={num.status === 'ACTIVE' ? 'success' : 'neutral'}>
                              {num.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === 'statistics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total SMS Sent</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {stats?.totalSms?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Delivered Messages</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {stats?.deliveredSms?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Delivery Success Rate</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                    {stats?.deliveryRate ? `${stats.deliveryRate}%` : '0%'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Peak TPS Throughput</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {stats?.throughputTps || 0} /sec
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Transmission Status Breakdown
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-700 dark:text-emerald-400">Delivered</span>
                    <span className="font-semibold">{stats?.deliveredSms || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${stats?.deliveryRate || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-amber-700 dark:text-amber-400">Queued / In Transit</span>
                    <span className="font-semibold">{stats?.pendingSms || 0}</span>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-rose-700 dark:text-rose-400">Failed / Undelivered</span>
                    <span className="font-semibold">{stats?.failedSms || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'balance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Current Balance</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                    ${balanceData?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}{' '}
                    <span className="text-xs font-normal text-slate-500">{balanceData?.currency || 'USD'}</span>
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Credit Limit</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                    ${balanceData?.creditLimit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Historical Spend</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                    ${balanceData?.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Billing Configuration
                </h4>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Billing Model:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{balanceData?.billingType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Currency:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{balanceData?.currency}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Last Deposit / Recharge:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {balanceData?.lastRechargeAt ? new Date(balanceData.lastRechargeAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'activity' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Security & Operational Event Log
              </span>
              {activity.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No activity events recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {activity.map((event: any, idx: number) => (
                    <div
                      key={event.id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {event.action}
                          </span>
                          <span className="text-[10px] text-slate-500">by {event.actorEmail || 'System'}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{event.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
