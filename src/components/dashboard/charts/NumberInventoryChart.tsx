import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { NumberInventoryData } from '../../../types/dashboard';
import { Hash, Globe } from 'lucide-react';

interface NumberInventoryChartProps {
  data: NumberInventoryData;
}

export const NumberInventoryChart: React.FC<NumberInventoryChartProps> = ({ data }) => {
  const pieData = data.byStatus.map((item) => ({
    name: item.status,
    value: item.count,
    color: item.color,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                DID & Number Inventory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allocation statuses across pooled E.164 phone numbers
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {data.total} Total DIDs
          </span>
        </div>

        {/* Donut Chart + Status Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-4">
          {/* Donut Canvas */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} numbers`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {data.total}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Numbers
              </span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="space-y-2.5">
            {data.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 capitalize font-medium">
                    {item.status.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.count}
                  </span>
                  <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country Distribution */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Country Coverage</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Assigned / Total</span>
        </div>

        <div className="space-y-2">
          {data.byCountry.map((c) => {
            const pct = c.total > 0 ? Math.round((c.assigned / c.total) * 100) : 0;
            return (
              <div key={c.iso2} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {c.country} ({c.iso2})
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    <strong className="text-slate-800 dark:text-slate-200">{c.assigned}</strong> / {c.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
