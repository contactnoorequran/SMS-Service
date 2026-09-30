import React from 'react';
import { IconProps } from './types';

/**
 * 3. Virtual Number / DID Icon
 * Visualizes leased virtual telephone numbers, MSISDN prefixes, and SIM carrier routing.
 */
export const DidNumberIcon: React.FC<IconProps> = ({
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
    {/* Telecom SIM / Number Card Badge */}
    <path d="M5 4a2 2 0 0 1 2-2h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z" />
    {/* Micro-chip contacts / number matrix */}
    <rect width="6" height="5" x="9" y="8" rx="1" />
    <path d="M9 10.5H5" />
    <path d="M15 10.5h4" />
    {/* MSISDN number symbol '#' */}
    <path d="M8.5 16.5h7" />
    <path d="M10 15v3" />
    <path d="M14 15v3" />
  </svg>
);
