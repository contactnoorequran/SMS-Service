import React from 'react';
import { IconProps } from './types';

/**
 * 7. Client Icon
 * Enterprise tenant organization consuming SMS routing APIs and virtual numbers.
 */
export const ClientIcon: React.FC<IconProps> = ({
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
    {/* Enterprise client building structure */}
    <rect width="16" height="18" x="4" y="3" rx="2" />
    {/* Office tenant windows */}
    <path d="M8 7h2" />
    <path d="M14 7h2" />
    <path d="M8 11h2" />
    <path d="M14 11h2" />
    <path d="M8 15h2" />
    <path d="M14 15h2" />
    {/* API gateway connector node */}
    <path d="M10 21v-3h4v3" />
  </svg>
);
