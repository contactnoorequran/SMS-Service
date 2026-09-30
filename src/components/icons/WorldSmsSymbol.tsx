import React from 'react';
import { IconProps } from './types';

export type SymbolVariant =
  | 'primary'
  | 'small'
  | 'favicon'
  | 'app-icon'
  | 'monochrome'
  | 'outline';

export interface WorldSmsSymbolProps extends IconProps {
  variant?: SymbolVariant;
  idPrefix?: string;
}

/**
 * WORLD SMS SERVICE Refined Brand Symbol Component
 * Provides 6 specialized representations:
 * - primary: full vibrant color vector
 * - small: streamlined geometry with high contrast for 16px–24px
 * - favicon: 32x32 bounded base for browser tabs
 * - app-icon: 180x180 rounded app shortcut
 * - monochrome: single-tone currentColor / white with opacities
 * - outline: wireframe stroke-only geometry
 */
export const WorldSmsSymbol: React.FC<WorldSmsSymbolProps> = ({
  variant = 'primary',
  size = 32,
  className = '',
  title,
  idPrefix = 'wss-sym',
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const isOutline = variant === 'outline';
  const isMono = variant === 'monochrome';
  const isSmall = variant === 'small';

  // 1. Favicon Presentation (Bounded base)
  if (variant === 'favicon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        role={title ? 'img' : undefined}
        aria-hidden={ariaHidden ?? !title}
        {...props}
      >
        {title && <title>{title}</title>}
        <rect width="32" height="32" rx="8" fill="#07090f" />
        <rect width="32" height="32" rx="8" stroke="rgba(56,189,248,0.3)" strokeWidth="1" />
        <circle cx="16" cy="16" r="10.5" stroke="#38bdf8" strokeWidth="1.75" />
        <ellipse cx="16" cy="16" rx="5" ry="10.5" stroke="#38bdf8" strokeWidth="1.25" strokeDasharray="2 1" opacity="0.6" />
        <path d="M 5 16 H 27" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M 14 13 L 17.5 16 L 14 19" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10.5" cy="16" r="1.5" fill="#60a5fa" />
        <circle cx="21.5" cy="16" r="1.5" fill="#34d399" />
        <circle cx="16" cy="16" r="1.75" fill="#ffffff" />
      </svg>
    );
  }

  // 2. App Icon Presentation (180x180 base)
  if (variant === 'app-icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 180 180"
        fill="none"
        className={className}
        role={title ? 'img' : undefined}
        aria-hidden={ariaHidden ?? !title}
        {...props}
      >
        {title && <title>{title}</title>}
        <rect width="180" height="180" rx="40" fill="#07090f" />
        <rect width="180" height="180" rx="40" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
        <circle cx="90" cy="90" r="56" stroke="#38bdf8" strokeWidth="8" />
        <ellipse cx="90" cy="90" rx="27" ry="56" stroke="#38bdf8" strokeWidth="6" strokeDasharray="10 5" opacity="0.6" />
        <path d="M 30 90 H 150" stroke="#38bdf8" strokeWidth="9" strokeLinecap="round" />
        <path d="M 80 74 L 98 90 L 80 106" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="90" r="8" fill="#60a5fa" />
        <circle cx="120" cy="90" r="8" fill="#34d399" />
        <circle cx="90" cy="90" r="10" fill="#ffffff" />
      </svg>
    );
  }

  // 3. Small (16px–24px) High-Legibility Representation
  if (isSmall) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        role={title ? 'img' : undefined}
        aria-hidden={ariaHidden ?? !title}
        {...props}
      >
        {title && <title>{title}</title>}
        <circle cx="12" cy="12" r="9.5" stroke="#38bdf8" strokeWidth="1.75" />
        <ellipse cx="12" cy="12" rx="4.5" ry="9.5" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 1" opacity="0.65" />
        <path d="M 3.5 12 H 20.5" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M 10.5 9.5 L 13.5 12 L 10.5 14.5" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  // 4. Primary, Monochrome, and Outline (Standard 32x32)
  const globeStroke = isOutline ? 'currentColor' : isMono ? 'currentColor' : `url(#${idPrefix}-globe)`;
  const trunkStroke = isOutline ? 'currentColor' : isMono ? 'currentColor' : `url(#${idPrefix}-trunk)`;
  const chevronStroke = isOutline || isMono ? 'currentColor' : '#ffffff';
  const node1Fill = isOutline ? 'none' : isMono ? 'currentColor' : '#60a5fa';
  const node2Fill = isOutline ? 'none' : isMono ? 'currentColor' : '#34d399';
  const nodeCoreFill = isOutline ? 'none' : isMono ? 'currentColor' : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={ariaHidden ?? !title}
      {...props}
    >
      {title && <title>{title}</title>}
      {!isOutline && !isMono && (
        <defs>
          <linearGradient id={`${idPrefix}-globe`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-trunk`} x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      )}

      {/* Global Outer Sphere */}
      <circle cx="16" cy="16" r="13" stroke={globeStroke} strokeWidth="2" strokeLinecap="round" opacity={isMono ? 0.9 : 1} />

      {/* Global Telecom Meridian Ellipse */}
      <ellipse cx="16" cy="16" rx="6.5" ry="13" stroke={globeStroke} strokeWidth="1.5" strokeDasharray="3 1.5" opacity={isMono ? 0.5 : 0.55} />

      {/* Telemetry Latitude Arcs */}
      <path d="M 8.5 8 C 12.5 5.5 19.5 5.5 23.5 8" stroke={globeStroke} strokeWidth="1.25" strokeLinecap="round" opacity={isMono ? 0.5 : 0.6} />
      <path d="M 8.5 24 C 12.5 26.5 19.5 26.5 23.5 24" stroke={globeStroke} strokeWidth="1.25" strokeLinecap="round" opacity={isMono ? 0.5 : 0.6} />

      {/* Primary Carrier Trunk */}
      <path d="M 3 16 H 29" stroke={trunkStroke} strokeWidth="2" strokeLinecap="round" />

      {/* Directional Pulse Chevron */}
      <path d="M 13.5 12.5 L 17.5 16 L 13.5 19.5" stroke={chevronStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Network Nodes */}
      <circle cx="9.5" cy="16" r="1.75" fill={node1Fill} stroke={isOutline ? 'currentColor' : 'none'} opacity={isMono ? 0.8 : 1} />
      <circle cx="22.5" cy="16" r="1.75" fill={node2Fill} stroke={isOutline ? 'currentColor' : 'none'} opacity={isMono ? 0.8 : 1} />
      <circle cx="16" cy="16" r="2.25" fill={nodeCoreFill} stroke={isOutline ? 'currentColor' : 'none'} />
    </svg>
  );
};
