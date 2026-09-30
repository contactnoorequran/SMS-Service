import React from 'react';
import { AppIcon, AppIconSize } from './AppIcon';

export interface CountryFlagProps {
  flag?: string | null;
  countryName?: string;
  size?: AppIconSize;
  className?: string;
}

/**
 * Standardized Country Flag display with SVG global coverage fallback
 * Replaces generic emoji 🌐 fallbacks with technical enterprise vector glyphs.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({
  flag,
  countryName,
  size = 'sm',
  className = '',
}) => {
  // If flag is missing or the generic emoji globe, render the custom SVG GlobalCoverageIcon
  if (!flag || flag === '🌐') {
    return (
      <span
        className={`inline-flex items-center justify-center text-[var(--accent-cyan)] shrink-0 ${className}`}
        title={countryName || 'Global'}
        aria-label={countryName ? `${countryName} flag` : 'Global coverage'}
      >
        <AppIcon name="global-coverage" size={size} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center shrink-0 leading-none select-none ${className}`}
      title={countryName || undefined}
      aria-label={countryName ? `${countryName} flag` : undefined}
    >
      {flag}
    </span>
  );
};
