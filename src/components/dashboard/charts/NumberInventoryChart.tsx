import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { NumberInventoryData } from '../../../types/dashboard';
import { Hash, Globe, Inbox } from 'lucide-react';

interface NumberInventoryChartProps {
  data: NumberInventoryData;
}

export const NumberInventoryChart: React.FC<NumberInventoryChartProps> = ({ data }) => {
  const byStatus = Array.isArray(data?.byStatus) ? data.byStatus : [];
  const byCountry = Array.isArray(data?.byCountry) ? data.byCountry : [];
  const totalCount = data?.total ?? 0;

  const pieData = byStatus.map((item) => ({
    name: item.status,
    value: item.count,
    color: item.color,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                DID & Number Inventory
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Allocation statuses across pooled E.164 phone numbers
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--glass-bg-active)] px-2.5 py-1 rounded-lg">
            {totalCount} Total DIDs
          </span>
        </div>

        {totalCount === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center text-[var(--text-tertiary)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg-active)] flex items-center justify-center text-[var(--text-tertiary)] mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)]">No numbers available in inventory</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 max-w-sm">
              Allocation statuses and country distribution will appear here once phone numbers are provisioned into the pool.
            </p>
          </div>
        ) : (
          <>
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
                        backgroundColor: 'rgba(13, 19, 33, 0.88)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderColor: 'var(--glass-border-hover)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                      }}
                      formatter={(val: number | string | undefined) => [`${val ?? 0} numbers`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {totalCount}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                    Numbers
                  </span>
                </div>
              </div>

              {/* Legend Details */}
              <div className="space-y-2.5">
                {byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[var(--text-secondary)] capitalize font-medium">
                        {item.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {item.count}
                      </span>
                      <span className="text-[var(--text-tertiary)] text-[11px]">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Distribution */}
            <div className="mt-5 pt-4 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  <span>Country Coverage</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary)]">Assigned / Total</span>
              </div>

              <div className="space-y-2">
                {byCountry.map((c) => {
                  const pct = c.total > 0 ? Math.round((c.assigned / c.total) * 100) : 0;
                  return (
                    <div key={c.iso2} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">
                          {c.country} ({c.iso2})
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{c.assigned}</strong> / {c.total}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--glass-bg-active)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[var(--accent-blue)] h-1.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
