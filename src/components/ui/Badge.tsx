import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  id,
}) => {
  const variantStyles = {
    success: 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border-[rgba(16,185,129,0.25)]',
    warning: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border-[rgba(245,158,11,0.25)]',
    error: 'bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border-[rgba(244,63,94,0.25)]',
    info: 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border-[rgba(59,130,246,0.25)]',
    neutral: 'bg-[var(--glass-bg-active)] text-[var(--text-secondary)] border-[var(--glass-border)]',
    purple: 'bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] border-[rgba(139,92,246,0.25)]',
  };

  const sizeStyles = {
    sm: 'text-[11px] leading-tight px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
