import React from 'react';
import { IconProps } from './types';

/**
 * 6. Agent Icon
 * Enterprise partner agent with telecom operator headset and commission tier badge.
 */
export const AgentIcon: React.FC<IconProps> = ({
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
    {/* Agent head */}
    <circle cx="12" cy="7" r="4" />
    {/* Operator headset band and earpiece/microphone */}
    <path d="M8 7a4 4 0 0 1 8 0" />
    <path d="M16 7v3a1.5 1.5 0 0 1-1.5 1.5H13" />
    <circle cx="8" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="16" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
    {/* Shoulders / Torso */}
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    {/* Commission status badge */}
    <circle cx="17.5" cy="17.5" r="2.5" />
    <path d="m16.5 17.5 1 1 1.5-1.5" />
  </svg>
);
