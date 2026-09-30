import React from 'react';
import { IconProps } from './types';

/**
 * 9. Billing Icon
 * Wholesale carrier settlement invoice, CDR rating fee statement, and automated billing receipts.
 */
export const BillingIcon: React.FC<IconProps> = ({
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
    {/* Receipt outline with zig-zag edge */}
    <path d="M4 2v20l3-1.5 3 1.5 3-1.5 3 1.5 4-2V2H4Z" />
    {/* Micro-unit currency clearing symbol */}
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
    {/* Sub-cent rate decimal point */}
    <circle cx="15.5" cy="15" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
