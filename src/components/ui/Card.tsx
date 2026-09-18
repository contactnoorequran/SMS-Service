import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Badge } from './Badge';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id }) => {
  return (
    <div
      id={id}
      className={`glass-card overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  className?: string;
  id?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
  id,
}) => {
  const renderHeaderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-4 h-4" />;
    }
    return null;
  };

  const renderedIcon = renderHeaderIcon();

  return (
    <div
      id={id}
      className={`px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {renderedIcon && <div className="text-[var(--text-secondary)] shrink-0">{renderedIcon}</div>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', id }) => {
  return (
    <div id={id} className={`p-5 ${className}`}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', id }) => {
  return (
    <div
      id={id}
      className={`px-5 py-3.5 bg-[rgba(255,255,255,0.02)] border-t border-[var(--glass-border)] text-xs text-[var(--text-secondary)] ${className}`}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  badge?: React.ReactNode;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  subtext,
  change,
  icon,
  iconBgColor = 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]',
  badge,
  badgeText,
  badgeVariant,
  className = '',
  id,
  onClick,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const renderStatIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5" />;
    }
    return null;
  };

  const renderedIcon = renderStatIcon();
  const displaySubtitle = subtitle || subtext;
  const renderedBadge = badge || (badgeText ? (
    <Badge variant={badgeVariant || 'info'} size="sm">
      {badgeText}
    </Badge>
  ) : null);

  return (
    <div
      id={id}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`glass-card p-5 h-full flex flex-col justify-between transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] ${
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[var(--glass-border-hover)] hover:shadow-lg'
          : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
                {value}
              </span>
              {renderedBadge && <span className="shrink-0">{renderedBadge}</span>}
            </div>
          </div>
          {renderedIcon && (
            <div className={`p-2.5 rounded-xl shrink-0 ${iconBgColor}`}>
              {renderedIcon}
            </div>
          )}
        </div>
      </div>

      {(change || displaySubtitle) && (
        <div className="mt-3.5 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs">
          {change ? (
            <div className="flex items-center gap-1 font-medium">
              {change.trend === 'up' && (
                <span className="flex items-center text-[var(--accent-emerald)]">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.trend === 'down' && (
                <span className="flex items-center text-[var(--accent-rose)]">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.trend === 'neutral' && (
                <span className="flex items-center text-[var(--text-secondary)]">
                  <Minus className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.label && <span className="text-[var(--text-tertiary)] font-normal">{change.label}</span>}
            </div>
          ) : (
            <span />
          )}

          {displaySubtitle && (
            <span className="text-[var(--text-tertiary)] truncate ml-auto">{displaySubtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
