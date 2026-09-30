import React from 'react';
import { IconProps } from './types';

/**
 * 8. Wallet Icon
 * Wholesale telecom prepaid account balance, sub-cent micro-unit clearing, and ledger deposits.
 */
export const WalletIcon: React.FC<IconProps> = ({
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
    {/* Wallet chassis */}
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <path d="M7 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7" />
    {/* Financial clearing chip clasp */}
    <rect width="6" height="4" x="15" y="10" rx="1" />
    <circle cx="17.5" cy="12" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
