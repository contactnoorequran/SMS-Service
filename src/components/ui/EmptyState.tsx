import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { AppIcon, AppIconName } from './AppIcon';

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconName?: AppIconName;
  title: string;
  description?: string;
  message?: string;
  actionText?: string;
  actionLabel?: string;
  action?: React.ReactNode;
  onAction?: () => void;
  className?: string;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  description,
  message,
  actionText,
  actionLabel,
  action,
  onAction,
  className = '',
  id,
}) => {
  const renderIcon = () => {
    if (iconName) {
      return <AppIcon name={iconName} size={24} className="text-[var(--brand-primary)]" />;
    }
    if (!icon) return <Inbox className="w-6 h-6 text-[var(--brand-primary)]" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-6 h-6 text-[var(--brand-primary)]" />;
    }
    return <Inbox className="w-6 h-6 text-[var(--brand-primary)]" />;
  };

  const displayDescription = description || message || '';
  const displayActionText = actionText || actionLabel;

  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 text-center glass-card ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary-soft)] border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-primary)] mb-3.5 shadow-sm shadow-[rgba(56,189,248,0.12)]">
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
      {action ? (
        action
      ) : displayActionText && onAction ? (
        <Button variant="outline" size="sm" onClick={onAction}>
          {displayActionText}
        </Button>
      ) : null}
    </div>
  );
};

