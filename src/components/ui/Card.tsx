import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id }) => {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
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
  return (
    <div
      id={id}
      className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="text-slate-500 dark:text-slate-400 shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
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
      className={`px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  badge?: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBgColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  badge,
  className = '',
  id,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
              {value}
            </span>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {change ? (
            <div className="flex items-center gap-1 font-medium">
              {change.trend === 'up' && (
                <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.trend === 'down' && (
                <span className="flex items-center text-rose-600 dark:text-rose-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.trend === 'neutral' && (
                <span className="flex items-center text-slate-500">
                  <Minus className="w-3.5 h-3.5" />
                  <span>{change.value}</span>
                </span>
              )}
              {change.label && <span className="text-slate-400 font-normal">{change.label}</span>}
            </div>
          ) : (
            <span />
          )}

          {subtitle && (
            <span className="text-slate-400 truncate ml-auto">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
