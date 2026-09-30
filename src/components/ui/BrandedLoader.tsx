/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorldSmsSymbol } from '../icons/WorldSmsSymbol';

export interface BrandedLoaderProps {
  /** Optional message displayed below the brand mark */
  message?: string;
  /** Whether the loader occupies the entire screen or an inline container */
  fullScreen?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * WORLD SMS SERVICE Branded Application Loading State
 *
 * Sequence:
 * Brand Mark (vector symbol)
 * ↓
 * Subtle signal pulse / carrier telemetry wave
 * ↓
 * Application ready
 *
 * Respects `prefers-reduced-motion` to disable animations for accessibility.
 */
export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  message = 'Initializing WORLD SMS SERVICE...',
  fullScreen = true,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 min-h-screen w-screen bg-[var(--bg-deep)] z-50 flex flex-col items-center justify-center text-[var(--text-primary)] gap-5 select-none'
    : `p-8 flex flex-col items-center justify-center text-[var(--text-primary)] gap-4 select-none ${className}`;

  return (
    <div
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-label="Loading WORLD SMS SERVICE"
    >
      {/* Brand Mark with ambient telecom carrier glow */}
      <div className="relative flex items-center justify-center">
        {/* Subtle carrier wave beacon pulse ring (suppressed in reduced motion) */}
        <div
          className="absolute w-16 h-16 rounded-full bg-[var(--brand-primary-glow)] animate-ping opacity-25 pointer-events-none motion-reduce:hidden"
          style={{ animationDuration: '2.5s' }}
          aria-hidden="true"
        />

        {/* Ambient static glow backplate */}
        <div
          className="absolute w-20 h-20 rounded-full bg-[var(--brand-primary-soft)] blur-xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Core WORLD SMS SERVICE Symbol */}
        <div className="relative z-10 p-2 rounded-2xl bg-[rgba(13,17,28,0.85)] border border-[var(--brand-border)] shadow-xl shadow-[rgba(0,0,0,0.5)]">
          <WorldSmsSymbol size={44} strokeWidth={1.75} aria-hidden="true" />
        </div>
      </div>

      {/* Brand Wordmark and Micro Telemetry Status */}
      <div className="flex flex-col items-center gap-2 text-center z-10">
        <div className="text-xs font-bold tracking-wider font-sans uppercase text-[var(--brand-text)]">
          WORLD <span className="text-[var(--brand-primary)]">SMS</span> SERVICE
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle micro spinner dot */}
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin motion-reduce:hidden"
            aria-hidden="true"
          />
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrandedLoader;
