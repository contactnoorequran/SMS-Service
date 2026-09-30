import React from 'react';
import { IconProps } from './types';

/**
 * 14. Telecom Network Icon
 * Interconnected mesh of telecom carrier switches, SS7 / SMPP network nodes, and carrier hubs.
 */
export const TelecomNetworkIcon: React.FC<IconProps> = ({
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
    {/* Central Core Switch Node */}
    <circle cx="12" cy="12" r="2.5" />
    {/* Peripheral Carrier Nodes */}
    <circle cx="12" cy="3" r="2" />
    <circle cx="20.5" cy="17" r="2" />
    <circle cx="3.5" cy="17" r="2" />
    {/* Interconnect transmission lines */}
    <path d="M12 5v4.5" />
    <path d="m13.7 13.7 5.1 2.3" />
    <path d="m10.3 13.7-5.1 2.3" />
    <path d="M5.5 17h13" strokeDasharray="2 2" />
  </svg>
);
