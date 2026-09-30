import React from 'react';
import { IconProps } from './types';

/**
 * 1. World / Global Network Icon
 * Represents worldwide telecom presence, meridian interconnects, and geographic route coverage.
 */
export const WorldNetworkIcon: React.FC<IconProps> = ({
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
    {/* Global Outer Sphere */}
    <circle cx="12" cy="12" r="9" />
    {/* Meridian Ellipse */}
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    {/* Equator & Telemetry Latitude */}
    <path d="M3.6 9h16.8" />
    <path d="M3.6 15h16.8" />
    {/* Network Node Checkpoints */}
    <circle cx="12" cy="9" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
