import React from 'react';
import { IconProps } from './types';

/**
 * 2. SMS / Message Routing Icon
 * Communicates SMS packet forwarding through gateway route with ingress/egress nodes.
 */
export const SmsRoutingIcon: React.FC<IconProps> = ({
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
    {/* SMS message container */}
    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 4V5Z" />
    {/* Internal routing vector and packet directional chevron */}
    <path d="m8 9 3 2.5-3 2.5" />
    <path d="M11 11.5h4.5" />
    <circle cx="16.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
