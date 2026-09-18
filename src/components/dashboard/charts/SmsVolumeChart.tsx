import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SmsVolumePoint } from '../../../types/dashboard';
import { MessageSquare } from 'lucide-react';
import { formatNumber, formatPercent } from '../../../utils/formatters';

interface SmsVolumeChartProps {
  data: SmsVolumePoint[];
}

export const SmsVolumeChart: React.FC<SmsVolumeChartProps> = ({ data }) => {
  const [metricView, setMetricView] = useState<'all' | 'delivered' | 'failed'>('all');

  const safeData = Array.isArray(data) ? data : [];
  const totalDelivered = safeData.reduce((acc, curr) => acc + (curr?.delivered || 0), 0);
  const totalFailed = safeData.reduce((acc, curr) => acc + (curr?.failed || 0), 0);
  const totalVolume = safeData.reduce((acc, curr) => acc + (curr?.total || 0), 0);
  const deliveryRate = totalVolume > 0 ? (totalDelivered / totalVolume) * 100 : 100;

  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              SMS Traffic & Delivery Volume
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Rolling message activity over time and carrier delivery confirmations
          </p>
        </div>

        {/* Metric pills */}
        <div className="flex items-center gap-1.5 bg-[var(--glass-bg-active)] p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricView('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'all'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Stream
          </button>
          <button
            type="button"
            onClick={() => setMetricView('delivered')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'delivered'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-emerald)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Delivered
          </button>
          <button
            type="button"
            onClick={() => setMetricView('failed')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'failed'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-rose)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-lg bg-[var(--glass-bg)]/40 border border-[var(--glass-border)]">
          <span className="text-[11px] text-[var(--text-tertiary)] block">Total Inbound</span>
          <div className="text-base font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {formatNumber(totalVolume)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.2)]">
          <span className="text-[11px] text-[var(--accent-emerald)] block">Delivered ({formatPercent(deliveryRate)})</span>
          <div className="text-base font-bold font-mono text-[var(--accent-emerald)] mt-0.5">
            {formatNumber(totalDelivered)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)]">
          <span className="text-[11px] text-[var(--accent-rose)] block">Failed / Rejected</span>
          <div className="text-base font-bold font-mono text-[var(--accent-rose)] mt-0.5">
            {formatNumber(totalFailed)}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="deliveredGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--glass-border)', opacity: 0.5 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 19, 33, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderColor: 'var(--glass-border-hover)',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: 'var(--text-primary)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(val: number | string | undefined, name: string | undefined) => {
                const num = typeof val === 'number' ? val : Number(val) || 0;
                const formatted = formatNumber(num);
                if (name === 'delivered') return [formatted, 'Delivered'];
                if (name === 'failed') return [formatted, 'Failed'];
                return [formatted, 'Total Inbound'];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {(metricView === 'all' || metricView === 'delivered') && (
              <Area
                type="monotone"
                dataKey="delivered"
                name="Delivered"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#deliveredGradient)"
              />
            )}
            {metricView === 'all' && (
              <Area
                type="monotone"
                dataKey="total"
                name="Total Volume"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#totalGradient)"
              />
            )}
            {(metricView === 'all' || metricView === 'failed') && (
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#failedGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
