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
import { MessageSquare, Calendar } from 'lucide-react';

interface SmsVolumeChartProps {
  data: SmsVolumePoint[];
}

export const SmsVolumeChart: React.FC<SmsVolumeChartProps> = ({ data }) => {
  const [metricView, setMetricView] = useState<'all' | 'delivered' | 'failed'>('all');

  const totalDelivered = data.reduce((acc, curr) => acc + curr.delivered, 0);
  const totalFailed = data.reduce((acc, curr) => acc + curr.failed, 0);
  const totalVolume = data.reduce((acc, curr) => acc + curr.total, 0);
  const deliveryRate = totalVolume > 0 ? ((totalDelivered / totalVolume) * 100).toFixed(1) : '100';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              SMS Traffic & Delivery Volume
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            7-day rolling inbound message stream and delivery carrier confirmations
          </p>
        </div>

        {/* Metric pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setMetricView('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            All Stream
          </button>
          <button
            onClick={() => setMetricView('delivered')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'delivered'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setMetricView('failed')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              metricView === 'failed'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">Total Inbound</span>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Delivered</span>
          <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
            {totalDelivered.toLocaleString()} ({deliveryRate}%)
          </div>
        </div>
        <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
          <span className="text-[11px] text-rose-600 dark:text-rose-400">Failed / Rejected</span>
          <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
            {totalFailed.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
              formatter={(val: any, name: any) => [
                Number(val).toLocaleString(),
                name === 'delivered' ? 'Delivered' : name === 'failed' ? 'Failed' : 'Total Inbound',
              ]}
              labelFormatter={(label: any) => `Date: ${label}`}
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
