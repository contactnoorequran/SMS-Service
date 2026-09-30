/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type BrandLogoVariant = 'primary' | 'full' | 'compact' | 'symbol';
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type BrandLogoTheme = 'accent' | 'light' | 'dark';

export interface BrandLogoProps {
  /** Logo variant style */
  variant?: BrandLogoVariant;
  /** Size scale */
  size?: BrandLogoSize;
  /** Color theme */
  theme?: BrandLogoTheme;
  /** Whether to show the telecom status or edition badge */
  showBadge?: boolean;
  /** Custom badge text (defaults to 'TELECOM GATEWAY') */
  badgeText?: string;
  /** Additional CSS class names */
  className?: string;
  /** Optional link destination (e.g. '/') */
  linkTo?: string | null;
  /** Accessibility title for screen readers */
  accessibleLabel?: string;
}

/**
 * WORLD SMS SERVICE Standalone Vector Symbol
 * Encapsulates global latitude sphere, longitudinal telecom meridian,
 * carrier trunk line, and directional packet routing nodes.
 */
export const BrandSymbol: React.FC<{
  sizePx?: number;
  theme?: BrandLogoTheme;
  className?: string;
  idPrefix?: string;
}> = ({ sizePx = 32, theme = 'dark', className = '', idPrefix = 'wss' }) => {
  const globeGradId = `${idPrefix}-globe-grad`;
  const trunkGradId = `${idPrefix}-trunk-grad`;

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {theme === 'accent' && (
          <>
            <linearGradient id={globeGradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id={trunkGradId} x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </>
        )}
      </defs>

      {/* Global Outer Sphere */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : `url(#${globeGradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={isLight || isDark ? 0.9 : 0.95}
      />

      {/* Global Telecom Meridian Ellipse */}
      <ellipse
        cx="16"
        cy="16"
        rx="6.5"
        ry="13"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : `url(#${globeGradId})`}
        strokeWidth="1.5"
        strokeDasharray="3 1.5"
        opacity={isLight || isDark ? 0.45 : 0.6}
      />

      {/* Upper & Lower Telemetry Latitude Arcs */}
      <path
        d="M 8.5 8 C 12.5 5.5 19.5 5.5 23.5 8"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : '#38bdf8'}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity={isLight || isDark ? 0.4 : 0.65}
      />
      <path
        d="M 8.5 24 C 12.5 26.5 19.5 26.5 23.5 24"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : '#38bdf8'}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity={isLight || isDark ? 0.4 : 0.65}
      />

      {/* Primary High-Throughput Carrier Trunk Line */}
      <path
        d="M 3 16 H 29"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : `url(#${trunkGradId})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Packet Directional Forwarding Chevron */}
      <path
        d="M 13.5 12.5 L 17.5 16 L 13.5 19.5"
        stroke={isLight ? '#ffffff' : isDark ? '#07090f' : '#ffffff'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Telecom Network Ingress / Core / Egress Nodes */}
      <circle
        cx="9.5"
        cy="16"
        r="1.75"
        fill={isLight ? '#ffffff' : isDark ? '#07090f' : '#60a5fa'}
        opacity={isLight || isDark ? 0.75 : 1}
      />
      <circle
        cx="22.5"
        cy="16"
        r="1.75"
        fill={isLight ? '#ffffff' : isDark ? '#07090f' : '#34d399'}
        opacity={isLight || isDark ? 0.75 : 1}
      />
      <circle
        cx="16"
        cy="16"
        r="2.25"
        fill={isLight ? '#ffffff' : isDark ? '#07090f' : '#ffffff'}
      />
    </svg>
  );
};

/**
 * Reusable Enterprise Brand Logo Component
 * Supports full horizontal lockup, compact WSS monogram, and standalone symbol variants.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  showBadge = false,
  badgeText = 'TELECOM GATEWAY',
  className = '',
  linkTo = null,
  accessibleLabel = 'WORLD SMS SERVICE',
}) => {
  // Dimension configurations
  const sizeMap: Record<BrandLogoSize, { symbolPx: number; titleCls: string; subCls: string; badgeCls: string }> = {
    sm: {
      symbolPx: 26,
      titleCls: 'text-xs tracking-tight',
      subCls: 'text-[9px] tracking-[0.2em]',
      badgeCls: 'text-[8px] px-1.5 py-0.2',
    },
    md: {
      symbolPx: 32,
      titleCls: 'text-sm tracking-tight',
      subCls: 'text-[10px] tracking-[0.22em]',
      badgeCls: 'text-[9px] px-2 py-0.5',
    },
    lg: {
      symbolPx: 42,
      titleCls: 'text-lg tracking-tight',
      subCls: 'text-[11px] tracking-[0.24em]',
      badgeCls: 'text-[10px] px-2.5 py-0.5',
    },
    xl: {
      symbolPx: 54,
      titleCls: 'text-2xl tracking-tight',
      subCls: 'text-xs tracking-[0.26em]',
      badgeCls: 'text-[11px] px-3 py-1',
    },
  };

  const currentSize = sizeMap[size];

  // Theme text styling
  const textColor = theme === 'dark' ? 'text-[#07090f]' : 'text-white';
  const accentColor = theme === 'dark' ? 'text-[#18181b]' : theme === 'light' ? 'text-white' : 'text-[var(--accent-blue)]';
  const subColor = theme === 'dark' ? 'text-[rgba(7,9,15,0.6)]' : 'text-[var(--text-tertiary)]';

  const logoContent = (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      role="img"
      aria-label={accessibleLabel}
    >
      {/* Brand Symbol Container with subtle glass aura */}
      <div className="relative flex items-center justify-center shrink-0">
        <BrandSymbol sizePx={currentSize.symbolPx} theme={theme} idPrefix={`logo-${size}-${variant}`} />
      </div>

      {/* Typography: Compact Variant */}
      {variant === 'compact' && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold ${currentSize.titleCls} ${textColor} font-sans`}>
            W<span className={accentColor}>S</span><span className="text-[var(--accent-emerald)]">S</span>
          </span>
          {showBadge && (
            <span className={`font-mono font-medium rounded-full bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.25)] ${currentSize.badgeCls}`}>
              v1.7
            </span>
          )}
        </div>
      )}

      {/* Typography: Primary / Full Variant */}
      {(variant === 'full' || variant === 'primary') && (
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-bold tracking-tight uppercase ${currentSize.titleCls} ${textColor} font-sans truncate`}>
            WORLD <span className={`font-extrabold ${accentColor}`}>SMS</span> SERVICE
          </span>
          {showBadge && (
            <span className={`font-mono font-semibold uppercase rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] shrink-0 ${currentSize.badgeCls}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <a
        href={linkTo}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] rounded-xl transition-opacity hover:opacity-90"
        aria-label={`${accessibleLabel} Home`}
      >
        {logoContent}
      </a>
    );
  }

  return logoContent;
};

export default BrandLogo;
