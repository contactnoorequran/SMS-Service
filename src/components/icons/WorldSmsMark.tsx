import React from 'react';
import { WorldSmsSymbol } from './WorldSmsSymbol';
import { IconProps } from './types';

export interface WorldSmsMarkProps extends IconProps {
  theme?: 'accent' | 'light' | 'dark';
  showBadge?: boolean;
}

/**
 * WORLD SMS SERVICE Compact Mark Component
 * Symbol + WSS monogram for narrow headers and mobile toolbars
 */
export const WorldSmsMark: React.FC<WorldSmsMarkProps> = ({
  size = 28,
  theme = 'accent',
  showBadge = false,
  className = '',
  title = 'WORLD SMS SERVICE (Compact)',
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const textColor = theme === 'light' ? 'text-white' : 'text-[var(--text-primary)]';
  const accentColor = theme === 'light' ? 'text-white' : 'text-[var(--brand-primary)]';

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      role="img"
      aria-label={title}
      aria-hidden={ariaHidden}
      {...props}
    >
      <WorldSmsSymbol
        size={size}
        variant={theme === 'light' ? 'monochrome' : 'primary'}
        aria-hidden={true}
      />
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`font-extrabold uppercase text-sm ${textColor} font-sans`}>
          W<span className={accentColor}>S</span><span className="text-[var(--accent-emerald)]">S</span>
        </span>
        {showBadge && (
          <span className="font-mono text-[8px] font-medium rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] px-1.5 py-0.2">
            v1.7
          </span>
        )}
      </div>
    </div>
  );
};
