import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  id,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none';

  const isIconOnly = !children && (Boolean(leftIcon) || Boolean(rightIcon) || isLoading);

  const sizeStyles = {
    sm: isIconOnly ? 'h-8 w-8 p-0 text-xs' : 'h-8 px-3 text-xs gap-1.5',
    md: isIconOnly ? 'h-9 w-9 p-0 text-sm' : 'h-9 px-4 text-sm gap-2',
    lg: isIconOnly ? 'h-11 w-11 p-0 text-base' : 'h-11 px-5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[var(--accent-blue)] text-white hover:bg-blue-500 active:bg-blue-600 shadow-[0_0_20px_var(--accent-blue-dim)]',
    secondary:
      'bg-[var(--glass-bg-active)] text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)]',
    outline:
      'border border-[var(--glass-border)] bg-transparent hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border-hover)] text-[var(--text-primary)]',
    ghost:
      'bg-transparent hover:bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    danger:
      'bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border border-[rgba(244,63,94,0.2)] hover:bg-[rgba(244,63,94,0.25)] hover:border-[rgba(244,63,94,0.3)]',
  };

  return (
    <button
      id={id}
      type={props.type || 'button'}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon}
    </button>
  );
};
