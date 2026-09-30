import React from 'react';
import { WorldSmsSymbol } from './WorldSmsSymbol';
import { IconProps } from './types';

export interface WorldSmsLogoProps extends IconProps {
  theme?: 'accent' | 'light' | 'dark';
  showBadge?: boolean;
  badgeText?: string;
  linkTo?: string | null;
}

/**
 * WORLD SMS SERVICE Primary Horizontal Logo Component
 * Symbol + exact wordmark "WORLD SMS SERVICE"
 */
export const WorldSmsLogo: React.FC<WorldSmsLogoProps> = ({
  size = 32,
  theme = 'accent',
  showBadge = false,
  badgeText = 'TELECOM GATEWAY',
  className = '',
  linkTo = null,
  title = 'WORLD SMS SERVICE',
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const textColor = theme === 'light' ? 'text-white' : 'text-[var(--text-primary)]';
  const accentColor = theme === 'light' ? 'text-white' : 'text-[var(--brand-primary)]';

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      role="img"
      aria-label={title}
      aria-hidden={ariaHidden}
      {...props}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <WorldSmsSymbol
          size={size}
          variant={theme === 'light' ? 'monochrome' : 'primary'}
          aria-hidden={true}
        />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-bold tracking-tight uppercase text-sm ${textColor} font-sans truncate`}>
          WORLD <span className={`font-extrabold ${accentColor}`}>SMS</span> SERVICE
        </span>
        {showBadge && (
          <span className="font-mono text-[9px] font-semibold uppercase rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] px-2 py-0.5 shrink-0">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <a
        href={linkTo}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-xl transition-opacity hover:opacity-90"
        aria-label={`${title} Home`}
      >
        {content}
      </a>
    );
  }

  return content;
};
