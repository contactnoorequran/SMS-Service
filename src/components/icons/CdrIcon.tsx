import React from 'react';
import { IconProps } from './types';

/**
 * 10. CDR / Call Detail Record Icon
 * Immutable delivery ledger recording message timestamps, carrier latencies, and DLR codes.
 */
export const CdrIcon: React.FC<IconProps> = ({
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
    {/* Log ledger sheet */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    {/* Timing clock / duration dial in corner */}
    <circle cx="12" cy="14" r="3.5" />
    <path d="M12 12.5v1.5l1 1" />
  </svg>
);
