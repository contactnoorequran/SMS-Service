import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  message?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  actionText,
  actionLabel,
  onAction,
  className = '',
  id,
}) => {
  const renderIcon = () => {
    if (!icon) return <Inbox className="w-6 h-6" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-6 h-6" />;
    }
    return <Inbox className="w-6 h-6" />;
  };

  const displayDescription = description || message || '';
  const displayActionText = actionText || actionLabel;

  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 text-center glass-card ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[var(--glass-bg-active)] flex items-center justify-center text-[var(--text-tertiary)] mb-3.5">
        {renderIcon()}
      </div>
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h4>
      {displayDescription && (
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">
          {displayDescription}
        </p>
      )}
      {displayActionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {displayActionText}
        </Button>
      )}
    </div>
  );
};
