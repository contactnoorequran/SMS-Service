import React from 'react';
import { IconProps } from './types';

/**
 * 13. Messaging Traffic Icon
 * Real-time inbound/outbound SMS traffic streams, live throughput bursts, and message velocity.
 */
export const MessagingTrafficIcon: React.FC<IconProps> = ({
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
    {/* Inbound message envelope */}
    <rect width="14" height="10" x="2" y="4" rx="2" />
    <path d="m2 6 7 4.5L16 6" />
    {/* Outbound high-speed message stream */}
    <path d="M10 18h12" />
    <path d="m18 14 4 4-4 4" />
    <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
