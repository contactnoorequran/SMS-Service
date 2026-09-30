import React from 'react';
import { IconProps } from './types';

/**
 * 15. API / Integration Icon
 * REST API endpoints, JSON webhook dispatchers, and carrier SDK interfaces.
 */
export const ApiIntegrationIcon: React.FC<IconProps> = ({
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
    {/* Left API code bracket */}
    <path d="m8 6-5 6 5 6" />
    {/* Right API code bracket */}
    <path d="m16 6 5 6-5 6" />
    {/* Center transmission connector plug */}
    <path d="M10 12h4" />
    <circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
