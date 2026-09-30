import React from 'react';
import { IconProps } from './types';

/**
 * 11. Routing Icon
 * Visualizes dynamic least-cost routing (LCR), carrier failover switches, and prefix dispatch.
 */
export const RoutingIcon: React.FC<IconProps> = ({
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
    {/* Ingress origin node */}
    <circle cx="5" cy="12" r="2" />
    {/* Forked route paths */}
    <path d="M7 12h5" />
    <path d="M12 12c1.5 0 3-2.5 4-5h4" />
    <path d="M12 12h8" />
    <path d="M12 12c1.5 0 3 2.5 4 5h4" />
    {/* Egress carrier destination nodes */}
    <circle cx="20" cy="7" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="20" cy="12" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="20" cy="17" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);
