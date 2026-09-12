import React from 'react';
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

interface EarningsChartProps {
  data: EarningsPoint[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  const totalGross = data.reduce((acc, curr) => acc + curr.grossRevenue, 0);
  const totalCost = data.reduce((acc, curr) => acc + curr.providerCost, 0);
  const totalNet = data.reduce((acc, curr) => acc + curr.netProfit, 0);
  const totalAgentCommission = data.reduce((acc, curr) => acc + curr.agentCommission, 0);
  const profitMargin = totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Revenue & Profit Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gross customer billings, carrier wholesale cost, and net margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Margin: {profitMargin}%</span>
          </span>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">Gross Billings</span>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            ${totalGross.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">Wholesale Cost</span>
          <div className="text-base font-bold font-mono text-slate-600 dark:text-slate-300 mt-0.5">
            ${totalCost.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Net Profit</span>
          <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
            ${totalNet.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">Agent Commission</span>
          <div className="text-base font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-0.5">
            ${totalAgentCommission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
              tickFormatter={(val) => `$${val}`}
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
                `$${Number(val).toFixed(2)}`,
                name === 'grossRevenue'
                  ? 'Gross Revenue'
                  : name === 'providerCost'
                  ? 'Wholesale Cost'
                  : name === 'netProfit'
                  ? 'Net Profit'
                  : 'Agent Commission',
              ]}
              labelFormatter={(label: any) => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="grossRevenue"
              name="Gross Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#grossGradient)"
            />
            <Area
              type="monotone"
              dataKey="netProfit"
              name="Net Profit"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#profitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
