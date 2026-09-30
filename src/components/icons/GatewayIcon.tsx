import React from 'react';
import { IconProps } from './types';

/**
 * 5. Gateway / Connection Icon
 * Depicts telecom server unit with optical LED indicators and bidirectional data transmission conduits.
 */
export const GatewayIcon: React.FC<IconProps> = ({
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
    {/* Upper server blade */}
    <rect width="20" height="7" x="2" y="3" rx="2" />
    {/* Lower server blade */}
    <rect width="20" height="7" x="2" y="14" rx="2" />
    {/* Optical LED status dots */}
    <circle cx="6" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="6" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    {/* Carrier packet throughput vectors */}
    <path d="M11 6.5h4.5m0 0-1.5-1.5m1.5 1.5-1.5 1.5" />
    <path d="M15 17.5H10.5m0 0 1.5-1.5m-1.5 1.5 1.5 1.5" />
  </svg>
);
