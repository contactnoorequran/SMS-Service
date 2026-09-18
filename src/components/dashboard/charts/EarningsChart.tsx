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
import { EarningsPoint } from '../../../types/dashboard';
import { DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../../utils/formatters';

interface EarningsChartProps {
  data: EarningsPoint[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'revenue' | 'profit' | 'cost'>('all');

  const safeData = Array.isArray(data) ? data : [];
  const totalGross = safeData.reduce((acc, curr) => acc + (curr?.grossRevenue || 0), 0);
  const totalCost = safeData.reduce((acc, curr) => acc + (curr?.providerCost || 0), 0);
  const totalNet = safeData.reduce((acc, curr) => acc + (curr?.netProfit || 0), 0);
  const profitMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;

  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Earnings & Financial Performance
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Provider wholesale cost, gross client revenue, and net platform profit
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('revenue')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              activeFilter === 'revenue'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-blue)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('cost')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              activeFilter === 'cost'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-amber)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Cost
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('profit')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              activeFilter === 'profit'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-emerald)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Profit
          </button>
        </div>
      </div>

      {/* Financial KPIs Row */}
      <div className="grid grid-cols-3 gap-3 my-4">
        {/* Provider Cost */}
        <div className="p-3 rounded-lg bg-[var(--glass-bg)]/40 border border-[var(--glass-border)]">
          <span className="text-[11px] text-[var(--text-tertiary)] block">Provider Cost</span>
          <div className="text-base font-bold font-mono text-[var(--text-secondary)] mt-0.5">
            {formatCurrency(totalCost)}
          </div>
        </div>

        {/* Client Revenue */}
        <div className="p-3 rounded-lg bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.2)]">
          <span className="text-[11px] text-[var(--accent-blue)] block">Client Revenue</span>
          <div className="text-base font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {formatCurrency(totalGross)}
          </div>
        </div>

        {/* Platform Profit */}
        <div className="p-3 rounded-lg bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--accent-emerald)] block">Platform Profit</span>
            <span className="text-[10px] font-mono font-medium text-[var(--accent-emerald)]">
              {formatPercent(profitMargin)}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-[var(--accent-emerald)] mt-0.5">
            {formatCurrency(totalNet)}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="clientRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="providerCostGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="platformProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
              tickFormatter={(val) => `$${val}`}
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
                const formatted = formatCurrency(num);
                if (name === 'grossRevenue') return [formatted, 'Client Revenue'];
                if (name === 'providerCost') return [formatted, 'Provider Cost'];
                if (name === 'netProfit') return [formatted, 'Platform Profit'];
                return [formatted, String(name)];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {(activeFilter === 'all' || activeFilter === 'revenue') && (
              <Area
                type="monotone"
                dataKey="grossRevenue"
                name="Client Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#clientRevenueGrad)"
              />
            )}
            {(activeFilter === 'all' || activeFilter === 'cost') && (
              <Area
                type="monotone"
                dataKey="providerCost"
                name="Provider Cost"
                stroke="#f59e0b"
                strokeWidth={1.75}
                strokeDasharray="4 2"
                fillOpacity={1}
                fill="url(#providerCostGrad)"
              />
            )}
            {(activeFilter === 'all' || activeFilter === 'profit') && (
              <Area
                type="monotone"
                dataKey="netProfit"
                name="Platform Profit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#platformProfitGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
