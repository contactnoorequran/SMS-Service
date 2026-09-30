import React from 'react';
import { IconProps } from './types';

/**
 * 12. Analytics / Network Analytics Icon
 * Operational telecom throughput telemetry, latency monitoring, and conversion graphs.
 */
export const NetworkAnalyticsIcon: React.FC<IconProps> = ({
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
    {/* Frame axes */}
    <path d="M3 3v18h18" />
    {/* Telemetry wave curve */}
    <path d="m19 9-5 5-4-4-3 3" />
    {/* Peak performance point */}
    <circle cx="19" cy="9" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
