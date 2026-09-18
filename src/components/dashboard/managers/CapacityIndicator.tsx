/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CapacityStatus } from '../../../types/managers';

interface CapacityIndicatorProps {
  current: number;
  max: number;
  showLabels?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  current,
  max,
  showLabels = true,
  size = 'md',
  className = '',
}) => {
  const safeMax = Math.max(1, max);
  const safeCurrent = Math.max(0, current);
  const percentage = Math.min(100, Math.round((safeCurrent / safeMax) * 100));

  // Determine semantic color style based on capacity
  let status: CapacityStatus = 'AVAILABLE';
  let barColor = 'bg-[var(--accent-blue)]';
  let statusText = 'Normal';
  let badgeColor = 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border-[var(--border-subtle)]';

  if (percentage >= 100) {
    status = 'FULL';
    barColor = 'bg-[var(--accent-rose)]';
    statusText = 'Full';
    badgeColor = 'bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border-[var(--border-subtle)]';
  } else if (percentage >= 80) {
    status = 'NEAR_CAPACITY';
    barColor = 'bg-[var(--accent-amber)]';
    statusText = 'Near Capacity';
    badgeColor = 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border-[var(--border-subtle)]';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={safeCurrent}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={`Agent capacity: ${safeCurrent} of ${safeMax} agents (${percentage}%, ${statusText})`}
    >
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--text-secondary)] font-medium">
            <span className="text-[var(--text-primary)] font-semibold">{safeCurrent}</span>
            <span className="text-[var(--text-muted)]"> / {safeMax} agents</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
            {percentage}%
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className={`w-full ${heightClass} bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-full overflow-hidden`}>
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
