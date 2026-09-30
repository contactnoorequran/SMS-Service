import React from 'react';
import { IconProps } from './types';

/**
 * 4. Provider / Carrier Icon
 * Represents upstream wholesale carrier partners, cell towers, and telecom interconnect trunks.
 */
export const ProviderIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  'aria-hidden': ariaHidden,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={ariaHidden ?? !title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Transmission tower mast */}
    <path d="M12 2v20" />
    <path d="m8 10 4-3 4 3" />
    <path d="m6 16 6-4 6 4" />
    <path d="m4 22 8-5 8 5" />
    {/* Concentric radio carrier wave broadcasts */}
    <path d="M16.5 4.5a6 6 0 0 1 0 7" />
    <path d="M7.5 4.5a6 6 0 0 0 0 7" />
    <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
  </svg>
);
