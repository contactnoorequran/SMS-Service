import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Zap,
  PauseCircle,
  Slash,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AppIconSize } from './AppIcon';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'disabled'
  | 'connected'
  | 'disconnected';

export interface StatusIconProps {
  status: StatusType;
  size?: AppIconSize;
  strokeWidth?: number;
  showBadge?: boolean;
  label?: string;
  className?: string;
  badgeClassName?: string;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const resolveSizeNumber = (size?: AppIconSize): number => {
  if (typeof size === 'number') return size;
  if (!size) return 16;
  if (size in SIZE_MAP) return SIZE_MAP[size as keyof typeof SIZE_MAP];
  const parsed = parseInt(size, 10);
  return isNaN(parsed) ? 16 : parsed;
};

interface StatusConfig {
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  defaultLabel: string;
}

const STATUS_CONFIGS: Record<StatusType, StatusConfig> = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-[var(--accent-emerald)]',
    bgClass: 'bg-[var(--accent-emerald-dim)]',
    borderClass: 'border-[rgba(16,185,129,0.25)]',
    defaultLabel: 'Success',
  },
  active: {
    icon: Zap,
    colorClass: 'text-[var(--accent-emerald)]',
    bgClass: 'bg-[var(--accent-emerald-dim)]',
    borderClass: 'border-[rgba(16,185,129,0.25)]',
    defaultLabel: 'Active',
  },
  connected: {
    icon: Wifi,
    colorClass: 'text-[var(--accent-emerald)]',
    bgClass: 'bg-[var(--accent-emerald-dim)]',
    borderClass: 'border-[rgba(16,185,129,0.25)]',
    defaultLabel: 'Connected',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-[var(--accent-amber)]',
    bgClass: 'bg-[var(--accent-amber-dim)]',
    borderClass: 'border-[rgba(245,158,11,0.25)]',
    defaultLabel: 'Warning',
  },
  pending: {
    icon: Clock,
    colorClass: 'text-[var(--accent-amber)]',
    bgClass: 'bg-[var(--accent-amber-dim)]',
    borderClass: 'border-[rgba(245,158,11,0.25)]',
    defaultLabel: 'Pending',
  },
  suspended: {
    icon: PauseCircle,
    colorClass: 'text-[var(--accent-amber)]',
    bgClass: 'bg-[var(--accent-amber-dim)]',
    borderClass: 'border-[rgba(245,158,11,0.25)]',
    defaultLabel: 'Suspended',
  },
  error: {
    icon: AlertCircle,
    colorClass: 'text-[var(--accent-rose)]',
    bgClass: 'bg-[var(--accent-rose-dim)]',
    borderClass: 'border-[rgba(244,63,94,0.25)]',
    defaultLabel: 'Error',
  },
  disconnected: {
    icon: WifiOff,
    colorClass: 'text-[var(--accent-rose)]',
    bgClass: 'bg-[var(--accent-rose-dim)]',
    borderClass: 'border-[rgba(244,63,94,0.25)]',
    defaultLabel: 'Disconnected',
  },
  info: {
    icon: Info,
    colorClass: 'text-[var(--accent-blue)]',
    bgClass: 'bg-[var(--accent-blue-dim)]',
    borderClass: 'border-[rgba(59,130,246,0.25)]',
    defaultLabel: 'Info',
  },
  disabled: {
    icon: Slash,
    colorClass: 'text-[var(--text-disabled)]',
    bgClass: 'bg-[rgba(255,255,255,0.05)]',
    borderClass: 'border-[rgba(255,255,255,0.1)]',
    defaultLabel: 'Disabled',
  },
};

/**
 * Standardized WORLD SMS SERVICE Status Icon
 * Pairs unambiguous semantic icon glyph with color cues to avoid reliance on color alone.
 */
export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 'sm',
  strokeWidth = 1.75,
  showBadge = false,
  label,
  className = '',
  badgeClassName = '',
}) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.info;
  const pixelSize = resolveSizeNumber(size);
  const IconComponent = config.icon;
  const textLabel = label || config.defaultLabel;

  if (showBadge) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgClass} ${config.colorClass} ${config.borderClass} ${badgeClassName}`}
        role="status"
        aria-label={`${config.defaultLabel}: ${textLabel}`}
      >
        <IconComponent size={pixelSize} strokeWidth={strokeWidth} aria-hidden={true} />
        <span>{textLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${config.colorClass} ${className}`}
      role="img"
      aria-label={`${config.defaultLabel}: ${textLabel}`}
      title={textLabel}
    >
      <IconComponent size={pixelSize} strokeWidth={strokeWidth} aria-hidden={true} />
    </span>
  );
};
